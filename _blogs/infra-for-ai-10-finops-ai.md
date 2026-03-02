---
layout: default
title: "Infra for AI – Part 10: FinOps for AI"
date: 2026-04-05
author: "Roshan Raut"
slug: "infra-for-ai-10-finops-ai"
tags:
  - ai
  - finops
  - cloud
  - cost-optimization
summary: "The finale: Mastering the economics of AI. From fractional GPUs (MIG) to serverless patterns and cost observability."
---

## Context
A single NVIDIA H100 node can cost over $30,000 per month to rent in the cloud. As a DevOps Engineer, your value isn't just in making the system work; it's in making it **financially sustainable**. FinOps for AI is the practice of bringing fiscal accountability to the high-velocity world of Machine Learning.

## 1. Spot vs. Reserved Economics
The strategy for purchasing compute determines your "burn rate":
    - **Reserved Instances (RI) / Savings Plans:** Best for 24/7 production inference. You commit to 1-3 years for a 40-60% discount.
    - **Spot Instances:** Best for stateless training or batch processing. You get up to 90% off, but the cloud provider can reclaim the GPU at any time.
    - **On-Demand:** The "Default" and most expensive. Only use this for short experiments or sudden traffic spikes.

## 2. MIG: Fractional GPUs
Not every task needs a full A100 or H100. **MIG (Multi-Instance GPU)** allows you to partition a single physical GPU into up to seven separate hardware-isolated instances.
    - **The Savings:** Instead of giving 7 developers their own GPU (expensive), you give them 7 MIG partitions on a single card (cheap).
    - **Use Case:** Perfect for model development, testing, and small-scale inference where the model doesn't need 80GB of VRAM.

## 3. Serverless GPU Patterns
Serverless AI (e.g., RunPod, Modal, or AWS Lambda with GPU support) is the ultimate FinOps tool.
- **Pay-per-millisecond:** You only pay when the code is actually running.
- **The Trade-off:** "Cold Starts." When a request comes in, the provider has to pull your 10GB container and load the model into GPU memory.

## 4. Solving the Cold Start Challenge
To make serverless or "Scale-to-Zero" viable, DevOps engineers use several tricks:
    - **Base Image Caching:** Keeping the heavy CUDA layers "warm" on the host machine.
    - **Streaming Model Weights:** Using specialized formats like `Safetensors` to start the model before the entire file is finished downloading.
    - **Predictive Scaling:** Using historical data to spin up a GPU 5 minutes *before* the morning traffic spike hits.

## 5. Cost Observability
You cannot optimize what you cannot measure. Traditional cloud billing consoles are often too slow (24-hour delay).
    - **GPU-Level Attribution:** Use tools like **KubeCost** or **NVIDIA DCGM Exporter** to see exactly which team or which specific "Project" is consuming GPU cycles.
    - **Idle Detection:** Automate the shutdown of "Zombie" Jupyter notebooks. If a GPU has 0% utilization for more than 2 hours, kill the instance.

## 6. Resource Quotas and Governance
Implement "Guardrails" to prevent catastrophic billing errors:
    - **Hard Quotas:** Set a limit on the number of GPUs a single namespace can request.
    - **Time-to-Live (TTL):** Every experimental GPU node should have a TTL. After 8 hours, it should require a manual "Extend" click, or it gets deleted.

## Lessons Learned
AI Infrastructure is a "High-Stakes" game. The difference between a junior and a senior AI Infrastructure Engineer is the ability to balance raw performance with cost-efficiency. By mastering MIG, Spot instances, and strict observability, you ensure that your AI projects grow into profitable products rather than expensive experiments.

---
**Series Conclusion:** We have traveled from the raw silicon of Part 1 to the financial strategies of Part 10. The world of AI Infra is moving fast, but the fundamentals of DevOps—automation, observability, and scaling—remain your best tools for success.
