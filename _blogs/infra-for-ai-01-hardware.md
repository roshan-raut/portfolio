---
title: "Infra for AI – Part 1: Hardware 101"
date: 2026-02-01
author: "Roshan Raut"
slug: "infra-for-ai-01-hardware"
tags:
  - ai
  - gpu
  - infrastructure
  - fundamentals
summary: "Why can't my CPU do this? A deep dive into GPUs, TFLOPS, HBM, and the hardware bottlenecks of modern AI."
---

## Context
In traditional DevOps, we scale by adding more CPU and RAM. In AI Infrastructure, the rules change. We are no longer optimizing for general-purpose logic; we are optimizing for massive matrix multiplication.

## 1. Parallelism: CPU vs. GPU
The fundamental difference is **Latency vs. Throughput**.
  - **CPU (Central Processing Unit):** Designed for low-latency serial processing. It’s like a Ferrari—it carries one or two people very fast. Great for logic (if/else).
  - **GPU (Graphics Processing Unit):** Designed for high-throughput parallel processing. It’s like a massive bus—it moves slowly but carries 1,000 people at once. 

AI models (especially LLMs) require billions of simultaneous simple math operations. A CPU would take days to process what a GPU does in seconds.

## 2. The Language of Speed: TFLOPS
In AI Infra, we measure performance in **TFLOPS** (Tera Floating Point Operations Per Second).
  - **FP32 (Single Precision):** Standard for traditional high-performance computing.
  - **FP16 / BF16 (Half Precision):** The "Sweet Spot" for AI training.
  - **INT8 / FP4:** Used for "Quantized" inference to make models run on smaller hardware.

*DevOps Note:* When selecting cloud instances (like AWS P4d or Azure NDv4), always check the Tensor Core TFLOPS, not just the raw CUDA core count.

## 3. The Real Bottleneck: Memory Bandwidth & HBM
A common mistake is thinking the "Processor Speed" is the only thing that matters. In AI, the **Memory Wall** is the real enemy. 
Data must move from memory to the processor. If the processor is fast but the "pipe" is narrow, the GPU sits idle (Starvation).

  - **HBM (High Bandwidth Memory):** Unlike standard GDDR6 in gaming cards, HBM stacks memory chips vertically directly on the GPU die.
  - **The Bottleneck:** Training a 70B parameter model requires moving massive amounts of data every millisecond. If your HBM bandwidth is low, your $30,000 GPU is just an expensive heater.



## 4. Hardware Comparison Table

| Feature | GPU (NVIDIA H100) | TPU (Google v5p) | LPU (Groq) |
| :--- | :--- | :--- | :--- |
| **Best For** | General AI Training/Inference | Massive Scale Deep Learning | Ultra-Fast LLM Inference |
| **Architecture** | Parallel CUDA Cores | Matrix Unit (MXU) | Tensor Streaming |
| **DevOps Complexity** | High (Driver/NCCL management) | Medium (Cloud Managed) | Low (SaaS/API focused) |
| **Availability** | Hard to find (High Demand) | Google Cloud Only | Emerging / Specialized |

## 5. DevOps Infrastructure Implications
As a DevOps Engineer, how does this change your job?
  1. **Node Pressure:** AI nodes are "Hot." You need specialized monitoring for GPU Temperature and Power Draw.
  2. **Binary Sizes:** AI base images are huge (PyTorch + CUDA = 6GB+). You need local container registries and fast disk I/O to avoid long pull times.
  3. **Driver Hell:** Your Infrastructure as Code (Terraform/Ansible) must strictly manage the NVIDIA Driver version vs. CUDA version vs. Kernel version. One mismatch breaks the entire pipeline.

## Lessons Learned
Infrastructure for AI is moving away from "General Purpose" to "Application Specific." Understanding the difference between a compute bottleneck and a memory bottleneck determines whether your cluster is cost-efficient or a money pit.
