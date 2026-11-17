---
title: "Infra for AI – Part 3: Containerizing AI Workloads"
short: "Containerizing AI"
date: 2026-02-05
updated: 2026-11-17
series: "Infra for AI"
part: 3
summary: "Reproducible GPU images, why model weights shouldn't live in your image, lazy-loading for 10 GB+ images, CDI, and a secure AI supply chain."
tags: [ai, docker, containers, security, mlops]
---

## Context

AI containers break the usual assumptions: images are 5–20 GB, cold starts take minutes, and the "artifact" you care about (model weights) can be hundreds of gigabytes. The fix is to separate **runtime**, **code** and **weights**.

## 1. Pick the right base

| Base | When |
|---|---|
| `vllm/vllm-openai`, `lmsysorg/sglang` | Serving open-weight LLMs — don't rebuild these |
| `nvcr.io/nvidia/pytorch:<yy.mm>-py3` | Training/fine-tuning with a tested CUDA+NCCL+PyTorch combo |
| `nvidia/cuda:13.x-runtime-ubuntu24.04` + `uv pip install torch` | Slim custom images |
| `rocm/pytorch`, `rocm/vllm` | AMD Instinct |

Use the `runtime` flavour, not `devel`, unless you compile kernels at build time.

## 2. A modern, reproducible Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.7
FROM nvidia/cuda:13.0.1-runtime-ubuntu24.04 AS base

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy UV_COMPILE_BYTECODE=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app

# Dependency layer: cached unless the lockfile changes
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev

COPY src/ ./src
USER 1000
ENTRYPOINT ["uv", "run", "python", "-m", "src.serve"]
```

Key points: a **lockfile** (`uv.lock`) for exact reproducibility, a BuildKit cache mount, a non-root user, and **no model weights in the image**.

## 3. Keep weights out of the image

Baking a 140 GB model into an image means every node pulls 140 GB through the registry on every deploy. Instead:

- **Object storage + fast loader** — pull `safetensors` from S3/Blob/GCS at start using parallel loaders (e.g. the Run:ai Model Streamer supported by vLLM).
- **Shared filesystem cache** — FSx for Lustre / Azure Managed Lustre / a node-local NVMe cache (Part 6).
- **Weights as OCI artifacts** — push models to your registry and mount them with Kubernetes **image volumes**, so the same signing and caching pipeline covers code *and* weights.

Prefer **safetensors** over pickle-based `.bin`/`.pt` files: pickle can execute arbitrary code on load.

## 4. Taming big images

- **Lazy pulling:** SOCI (AWS), eStargz/Nydus or GKE image streaming start containers before the full image arrives.
- **Pre-pull** on GPU nodes with a DaemonSet or bake into the node image.
- **Registry close to compute** — pull-through caches in the same region.

## 5. Exposing GPUs to containers

The **NVIDIA Container Toolkit** now uses **CDI (Container Device Interface)** — a standard spec that tells the runtime which device nodes and libraries to inject.

```bash
# Docker / Podman with CDI
docker run --rm --device nvidia.com/gpu=all nvidia/cuda:13.0.1-base-ubuntu24.04 nvidia-smi
```

CDI is also what Kubernetes **DRA** builds on (Part 4). Never use `--privileged` to "make the GPU work".

## 6. AI supply-chain security

- **Sign** images and model artifacts (Sigstore `cosign`), verify at admission (Kyverno / policy controller).
- Generate **SBOMs** (`syft`) and scan (`grype`, Trivy) — CUDA images carry a lot of OS packages.
- Pin by **digest**, not tag.
- Treat model files as untrusted input: safetensors, checksums, provenance from a trusted registry.

## Lessons learned

The container should hold the **runtime and code**; the **weights** are a separate, versioned, signed artifact loaded at start. That split is what turns 10-minute cold starts into seconds and keeps your registry bill sane.
