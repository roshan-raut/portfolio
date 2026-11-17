---
title: "Infra for AI – Part 2: CUDA, ROCm & the Software–Hardware Bridge"
short: "CUDA, ROCm & drivers"
date: 2026-02-03
updated: 2026-11-17
series: "Infra for AI"
part: 2
summary: "The driver → runtime → library → framework stack, why version alignment breaks production, and what changed with CUDA 13 and ROCm 7."
tags: [ai, cuda, rocm, gpu, linux]
---

## Context

A GPU is useless without the software stack that lets PyTorch talk to it. Most "the GPU isn't working" incidents I've seen are **version mismatches** somewhere in this stack — not hardware faults.

## 1. The stack, bottom to top

```text
┌──────────────────────────────────────────────┐
│ Your code: PyTorch / JAX / vLLM / SGLang     │
├──────────────────────────────────────────────┤
│ Libraries: cuDNN, cuBLAS, NCCL, TensorRT     │  (ROCm: MIOpen, hipBLASLt, RCCL)
├──────────────────────────────────────────────┤
│ Runtime: CUDA Toolkit (user space)           │  (ROCm: HIP runtime)
├──────────────────────────────────────────────┤
│ Kernel driver (host)                          │  (amdgpu)
├──────────────────────────────────────────────┤
│ GPU hardware                                  │
└──────────────────────────────────────────────┘
```

The golden rule: **the host driver must be new enough for the CUDA runtime inside your container.** Everything above the driver should live in the container image.

## 2. CUDA in 2026

- **CUDA 13.x** is current (13.0 shipped in Aug 2025). It drops Maxwell, Pascal and Volta; Turing through Blackwell are supported.
- CUDA 13 requires the **R580+ driver** branch. Many managed node images (EKS, AKS, GKE) still default to 12.x drivers — check before you bump base images.
- **Minor-version compatibility:** a 13.x runtime runs on any R580+ driver, so you can upgrade containers without touching nodes, within a major version.
- Writing raw CUDA C++ is rare for platform teams. Kernels now come from **Triton** (the language), **CUTLASS/CuTe**, FlashAttention/FlashInfer and the frameworks themselves — and Python-native CUDA (`cuda.core`, CuTe DSL) is growing.

## 3. ROCm in 2026

AMD's ROCm 7 line closed much of the gap: PyTorch, vLLM and SGLang ship first-class ROCm builds, and FP8/FP4 work on MI300/MI350-class GPUs.

- AMD now runs a **production stream (7.2.x)** and faster **preview/core SDK releases (7.1x)** — pin to the production stream for clusters.
- **HIP** is CUDA-like; `hipify` translates much of existing CUDA code.
- The ecosystem gap that remains is mostly *long tail* — niche custom kernels and tooling.

## 4. Checking what you have

```bash
# Driver + max CUDA version supported by the driver
nvidia-smi

# CUDA toolkit inside the container
nvcc --version

# What PyTorch was built against, and whether it sees GPUs
python -c "import torch; print(torch.__version__, torch.version.cuda, torch.cuda.is_available())"

# AMD
rocm-smi && amd-smi static
```

> **Gotcha:** `nvidia-smi` shows the *maximum* CUDA version the driver supports — not what's installed.

## 5. Driver management at scale

Don't hand-install drivers on GPU nodes. Use:

- **NVIDIA GPU Operator** — deploys driver, container toolkit, DCGM exporter, MIG manager and (now) the DRA driver as Kubernetes DaemonSets.
- **Pre-baked node images** — EKS Accelerated AMIs, AKS GPU node images or Bottlerocket NVIDIA variants for faster scale-up.
- **AMD GPU Operator** for Instinct clusters.

Pin driver versions in IaC, roll them like any other node change (surge, drain, canary), and alert on DCGM **Xid errors** — they're your early warning for bad hardware.

## Lessons learned

Treat the driver as **infrastructure** and everything above it as **application**. Pin both, test the pair, and upgrade them on separate cadences. That one discipline prevents most GPU outages.
