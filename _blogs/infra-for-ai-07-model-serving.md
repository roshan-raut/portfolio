---
layout: default
title: "Infra for AI – Part 7: Model Serving"
date: 2026-03-15
author: "Roshan Raut"
slug: "infra-for-ai-07-model-serving"
tags:
  - ai
  - inference
  - kubernetes
  - scaling
summary: "Beyond training: Mastering real-time inference, model servers like vLLM, and token-based autoscaling in production."
---

## Context
Deploying an AI model for users is fundamentally different from deploying a web app. You aren't just serving HTML; you are running a massive neural network for every request. If your serving stack is unoptimized, your users will see "streaming" text that crawls, and your GPU bill will explode.

## 1. Real-time vs. Batch Inference
  - **Real-time (Online):** High pressure on latency. Users expect immediate responses (e.g., Chatbots). Requires "Always-on" GPUs.
  - **Batch (Offline):** High pressure on cost-efficiency. Processing millions of rows at once (e.g., Sentiment analysis on logs). Can use Spot Instances and "Scale-to-zero" logic.

## 2. The Modern Inference Stack: TGI, vLLM, and Triton
Standard Flask or FastAPI wrappers are too slow for LLMs. We use specialized "Model Servers":

  - **vLLM:** The current gold standard for LLMs. It uses **PagedAttention**, which manages KV cache memory so efficiently that it can handle 24x higher throughput than standard transformers.
  - **TGI (Text Generation Inference):** Developed by Hugging Face. Highly optimized for production-grade streaming and quantization.
  - **NVIDIA Triton:** The "Swiss Army Knife." It can serve multiple models (PyTorch, ONNX, TensorRT) on the same GPU simultaneously.

## 3. Token-Based Autoscaling
Traditional DevOps autoscales on CPU/RAM. In AI, these metrics are deceptive because a GPU will always look "busy" even if it's just idling with a loaded model.

Instead, we autoscale based on **Inference Metrics**:
  - **Time Per Output Token (TPOT):** How fast the words are appearing for the user.
  - **Queue Depth:** How many requests are waiting for a "Slot" on the GPU.
  - **KV Cache Usage:** If memory is full, we need a new replica.

## 4. Latency Optimization Patterns
To make your AI feel "snappy," DevOps engineers implement several patterns:

  - **Continuous Batching:** Instead of waiting for one request to finish, the server "inserts" new requests into the GPU mid-computation.
  - **Quantization (FP8/INT4):** Reducing the precision of model weights to make them smaller. This allows you to fit a 70B model on a single A100 instead of needing two.
  - **Speculative Decoding:** Using a tiny, fast model to predict what the big model will say, significantly speeding up the "Time to First Token."



## 5. Production Challenges
  1. **Model Loading (Cold Starts):** A 140GB model takes minutes to pull from S3. We use **P2P streaming** or "warm" nodes to ensure users don't wait for a container to pull.
  2. **GPU Memory Fragmentation:** Long conversations eat up "KV Cache." If not managed, the system will crash with an OOM even if the model itself fits.
  3. **Streaming Responses:** Implementing Server-Sent Events (SSE) so users see the answer as it is generated, rather than waiting 30 seconds for the whole block.

## Lessons Learned
Model serving is about the balance between **User Experience (Latency)** and **Operational Cost (Throughput)**. By moving away from generic web servers and adopting specialized inference engines like vLLM, you can serve more users with fewer GPUs, directly impacting the bottom line.
