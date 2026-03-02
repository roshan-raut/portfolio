---
layout: default
title: "Infra for AI – Part 2: CUDA & ROCm"
date: 2026-02-08
author: "Roshan Raut"
slug: "infra-for-ai-02-cuda-rocm"
tags:
  - ai
  - cuda
  - gpu
  - linux
summary: "The software-hardware bridge: Navigating the complex world of GPU drivers, CUDA kernels, and the NVIDIA Container Toolkit."
---

## Context
Hardware is just expensive silicon without the software layer that tells it how to execute math. For a DevOps Engineer, the "AI Stack" starts at the Linux Kernel and moves up through drivers to the Container Runtime. Managing this "Dependency Hell" is a core DevOps responsibility.

## 1. The CUDA Dominance (NVIDIA)
**CUDA (Compute Unified Device Architecture)** is more than a driver; it is a parallel computing platform and programming model. 

  - **Why it wins:** NVIDIA invested 15+ years in the software ecosystem (cuDNN for deep learning, NCCL for multi-GPU communication).
  - **The Catch:** It is proprietary. It only runs on NVIDIA hardware, creating a "walled garden" that defines modern AI infra.

## 2. The Challenger: AMD ROCm
**ROCm (Radeon Open Compute)** is the open-source answer to CUDA. 

  - **Architecture:** It aims for portability. Tools like `HIPIFY` allow developers to convert CUDA code to Portable C++ that runs on AMD GPUs (like the MI300X).
  - **DevOps Note:** AMD infrastructure is gaining traction because it avoids vendor lock-in and often offers better price-to-performance for raw compute.

## 3. Triton: The New Intermediate Language
Developed by OpenAI, **Triton** is a language and compiler that allows developers to write highly efficient GPU code without being experts in CUDA C++.

  - **Importance:** It simplifies how kernels (the math functions sent to the GPU) are written.
  - **Impact:** It makes it easier for new hardware (like Intel Gaudi) to support modern AI models like Llama-3.

## 4. The Linux Driver Setup
Setting up an AI node requires managing three distinct layers. If these versions don't align, the GPU will not be accessible to your applications.

  1. **Kernel Module:** The low-level `nvidia.ko` driver.
  2. **CUDA Toolkit:** The compilers and libraries (`nvcc`, `cublas`).
  3. **NVIDIA Container Toolkit:** The bridge that lets Docker "see" the GPU.

### Practical: NVIDIA Container Toolkit Setup
To run AI containers, your Docker daemon must be configured with the NVIDIA runtime:

```bash
# 1. Install the toolkit
sudo apt-get install -y nvidia-container-toolkit

# 2. Configure Docker to use the NVIDIA runtime
sudo nvidia-ctk runtime configure --runtime=docker

# 3. Restart Docker
sudo systemctl restart docker

# 4. Test the bridge
docker run --rm --gpus all nvidia/cuda:12.0-base-ubuntu22.04 nvidia-smi
```

## 5. The "Golden Triangle" of Compatibility
The biggest challenge in AI DevOps is version matching. You must ensure compatibility between:

  - **NVIDIA Driver Version** (e.g., 535.xx)
  - **CUDA Version** (e.g., 12.1)
  - **Framework Version** (PyTorch 2.1.0)

## 6. DevOps Infrastructure Implications
  - **Immutable Images:** Never pip install torch inside a running production container. Use pre-built images from NVIDIA's NGC catalog.
  - **Kernel Updates:** A simple apt upgrade can break the NVIDIA driver. Use DKMS to automatically rebuild drivers on kernel updates.
  - **Health Checks:** Use nvidia-smi or the DCGM to monitor XID errors (hardware-level faults).

## Lessons Learned
Compatibility is the primary cause of downtime in AI clusters. As a DevOps Engineer, your goal is to pin every version to ensure a predictable, reproducible environment.
