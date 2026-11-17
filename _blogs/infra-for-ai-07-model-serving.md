---
title: "Infra for AI – Part 7: Model Serving & Inference Infrastructure"
short: "Model serving"
date: 2026-02-13
updated: 2026-11-17
series: "Infra for AI"
part: 7
featured: true
summary: "vLLM, SGLang and TensorRT-LLM; KV-cache-aware routing with llm-d and the Gateway API Inference Extension; prefill/decode disaggregation; and autoscaling on the metrics that matter."
tags: [ai, inference, kubernetes, vllm, scaling]
---

## Context

Inference is where AI spend lives in 2026. Training is a project; inference is a **24/7 production service** with latency SLOs, bursty traffic and a GPU bill that scales with usage. A FastAPI wrapper around `transformers` will not survive contact with real users.

## 1. The metrics that matter

| Metric | Meaning | Users feel it as |
|---|---|---|
| **TTFT** — time to first token | Queue wait + prefill | "Is it thinking?" |
| **ITL / TPOT** — inter-token latency | Decode speed per stream | Streaming smoothness |
| **Throughput** (tok/s per GPU) | Efficiency | Your cost per token |
| **KV-cache utilization** | Memory left for more requests | Hidden capacity limit |

Prefill (processing the prompt) is **compute-bound**; decode (generating tokens) is **memory-bandwidth-bound**. Almost every modern optimization exploits that difference.

## 2. The engines

- **vLLM** — the default open-source engine. PagedAttention, continuous batching, prefix caching, speculative decoding, FP8/FP4 quantization, and broad hardware support (NVIDIA, AMD, TPU, Trainium, Gaudi).
- **SGLang** — RadixAttention prefix cache and strong structured-output/agent performance; very competitive on DeepSeek-style MoE models.
- **TensorRT-LLM** — NVIDIA's compiled path for maximum performance on NVIDIA hardware.
- **NVIDIA Dynamo** — a distributed serving framework that orchestrates engines (vLLM, SGLang, TRT-LLM) with disaggregation and KV-cache management.
- **Triton Inference Server / KServe** — still great for classic ML models and multi-framework serving.

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --tensor-parallel-size 4 \
  --quantization fp8 \
  --enable-prefix-caching \
  --max-model-len 32768
```

Everything speaks the **OpenAI-compatible API**, so swapping engines is cheap.

## 3. Routing is the new load balancing

Round-robin is wrong for LLMs. A request whose prefix (system prompt, document, chat history) is already cached on replica B should go to B — it skips most of the prefill.

- **Gateway API Inference Extension (GAIE)** — the Kubernetes standard for inference-aware routing. An `InferencePool` plus an endpoint picker scores replicas on queue depth, KV-cache usage, prefix-cache hits and LoRA adapters loaded. Works with Envoy-based gateways (kgateway, Istio, GKE Gateway).
- **llm-d** — a Kubernetes-native distributed inference stack on top of vLLM, donated to the **CNCF (Sandbox) in 2026**. It bundles KV-cache-aware routing, prefill/decode disaggregation and well-lit deployment paths.

## 4. Prefill/decode disaggregation

Because prefill and decode have different bottlenecks, large deployments split them onto **separate GPU pools** and transfer the KV cache between them (via NIXL over RDMA/NVLink). You size each pool independently and stop long prompts from stalling everyone else's token stream. It's worth it at scale — overkill for a single small model.

## 5. Autoscaling on the right signal

GPU utilization is a terrible scaling metric — a loaded model looks "busy" while idle. Scale on **queue depth and latency**:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: vllm-llama
spec:
  scaleTargetRef:
    name: vllm-llama
  minReplicaCount: 1
  maxReplicaCount: 8
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus.monitoring:9090
      query: sum(vllm:num_requests_waiting{model_name="llama-70b"})
      threshold: "10"
```

Pair it with **fast model loading** (Part 6), or a scale-up will arrive after the spike is over.

## 6. Production checklist

- Separate **interactive** and **batch** traffic (different pools/priorities).
- Set **max context length** deliberately — it caps concurrency via KV memory.
- Use **multi-LoRA** serving instead of one deployment per fine-tune.
- Emit **OpenTelemetry GenAI** traces and per-tenant token counts.
- Put an **AI gateway** in front (auth, rate limits, quotas, fallback across self-hosted and API models like Claude or GPT).

## Lessons learned

Serving LLMs well is about **memory and routing**: keep the KV cache hot, route requests to where their prefix already lives, and scale on queue depth — not CPU, not GPU utilization.
