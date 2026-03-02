---
layout: default
title: "Infra for AI – Part 3: Containerizing AI"
date: 2026-02-15
author: "Roshan Raut"
slug: "infra-for-ai-03-containerizing-ai"
tags:
  - ai
  - docker
  - mlops
  - containers
summary: "Solving reproducibility and image bloat: A guide to multi-stage builds and GPU passthrough for ML workloads."
---

## Context
In traditional microservices, a 500MB Docker image is considered "large." In AI, a base image containing PyTorch and CUDA libraries often starts at 6GB. This creates massive challenges for CI/CD pipelines, disk space, and cold-start times in production.

## 1. The Reproducibility Challenge
"It works on my machine" is 10x worse in AI. 
  - **The Problem:** Slight differences in library versions (e.g., `libcusolver.so.11`) can cause a model to either crash or, worse, produce slightly different mathematical results.
  - **The Solution:** We must containerize not just the code, but the entire CUDA environment.

## 2. Managing Large ML Base Images
Most AI teams start with `nvidia/cuda` or `pytorch/pytorch`. 
  - **Tip:** Use the `-runtime` or `-base` tags for production, and only use the `-devel` tags for your build/training stages.
  - **Registry Choice:** Use high-throughput registries like Amazon ECR or Google Artifact Registry to handle the 10GB+ pulls efficiently.



## 3. Optimization: Multi-Stage Builds
To prevent your production image from being 15GB, use multi-stage builds. Compile your dependencies in a "heavy" image, then copy only the binaries to a "light" runtime image.

```dockerfile
# Stage 1: Build
FROM nvidia/cuda:12.1.0-devel-ubuntu22.04 AS builder
RUN apt-get update && apt-get install -y python3-pip
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Stage 2: Runtime
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04
RUN apt-get update && apt-get install -y python3
COPY --from=builder /root/.local /root/.local
COPY . /app
WORKDIR /app
ENV PATH=/root/.local/bin:$PATH
CMD ["python3", "main.py"]
```

## 4. GPU Passthrough: The --gpus Flag
Even with the NVIDIA Container Toolkit installed, Docker containers are isolated from the hardware by default. You must explicitly pass the GPU device.

  - **Pass all GPUs:** `docker run --gpus all my-ai-app`
  - **Pass specific GPU:** `docker run --gpus '"device=0"' my-ai-app`
  - **Pass by capability:** `docker run --gpus all,capabilities=utility,compute my-ai-app`

## 5. Production Hardening Practices
Moving AI containers to production requires extra security and stability steps:

  1. **Resource Limits:** Always set memory limits. A GPU OOM (Out of Memory) error can sometimes hang the entire host kernel, not just the container.
  2. **Non-Root Users:** Even if NVIDIA's base images default to root, use USER 1000 to prevent privilege escalation.
  3. **Health Checks:** Use a script that checks GPU health:

  ```bash
  HEALTHCHECK --interval=30s --timeout=10s \
    CMD nvidia-smi || exit 1
  ```

4. **Shm-size:** Deep learning often requires shared memory for data loaders. Use --shm-size=1g or larger, otherwise, your training will crash with a "Bus error."

## Lessons Learned
Containerizing AI isn't just about wrapping code; it's about managing the heavy marriage between OS drivers and math libraries. By using multi-stage builds and strict resource limits, you can turn a fragile ML experiment into a stable production service.
