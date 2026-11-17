---
title: "Infra for AI – Part 10: FinOps for AI Infrastructure"
short: "FinOps for AI"
date: 2026-02-19
updated: 2026-11-17
series: "Infra for AI"
part: 10
featured: true
summary: "Cost per token as the unit metric, GPU capacity strategy (spot, capacity blocks, reservations), utilization, model right-sizing, prompt caching and batch APIs."
tags: [ai, finops, cloud, cost-optimization]
---

## Context

AI changed the shape of the cloud bill. A single 8-GPU node can cost more per month than an entire microservices platform, and API-based AI spend scales with every token your users generate. FinOps for AI is about one thing: **useful output per dollar**.

## 1. Pick a unit metric

"GPU hours" tells you what you paid, not what you got. Track:

- **Cost per 1M tokens** (input and output separately) for serving.
- **Cost per successful task** for agents (tokens × retries × tool calls).
- **Cost per training/fine-tuning run** and per eval point gained.
- **GPU utilization** — real *SM/tensor activity* from DCGM, not just "allocated".

Tag every GPU workload and every API key with team, product and environment. The **FOCUS** billing spec now covers AI/API usage, making cross-cloud and vendor reporting easier.

## 2. Capacity strategy

| Option | Good for | Watch out |
|---|---|---|
| **On-demand** | Spiky, short-lived | Highest price, availability not guaranteed |
| **Spot / preemptible** | Batch inference, evals, fault-tolerant training with checkpoints | Interruptions; plan for them |
| **Capacity Blocks (AWS) / DWS (GCP) / short-term reservations** | Scheduled training runs | Pay for the window whether you use it or not |
| **1–3 yr reservations / Savings Plans** | Steady inference baseline | Lock-in as GPU generations move fast |
| **Neoclouds** (CoreWeave, Lambda, Nebius, …) | Large GPU blocks at lower $/hr | Data egress, integration, another vendor |
| **Managed APIs** (Claude, GPT, Gemini via Bedrock/Azure/Vertex) | Most product use cases | Per-token pricing at scale |

GPU prices have fallen as Blackwell ramped — older-generation (H100/H200) capacity is often the best $/token for mid-size models. Re-check pricing every quarter.

## 3. Raise utilization before buying more

- **Right-size the GPU**: an 8B model doesn't need an H100 — L4/L40S-class GPUs or a MIG slice will do.
- **Share GPUs** with MIG/MPS (Part 4) for small models and dev environments.
- **Queue, don't over-provision**: Kueue quotas with borrowing keep expensive nodes busy.
- **Scale to zero** for non-production endpoints; fast model loading makes it practical.
- **Batch offline work** — bigger batches are dramatically cheaper per token.

## 4. Make every token cheaper

- **Quantize** (FP8 → FP4/INT4 where evals allow): fewer GPUs per replica.
- **Prefix caching + KV-aware routing** (Part 7): skip redundant prefill.
- **Speculative decoding**: more tokens per forward pass.
- **Route by difficulty**: send easy requests to a small/cheap model (e.g. Claude Haiku-class) and reserve frontier models for hard ones.
- **Distill or fine-tune** a small model once a task is well-understood.

## 5. API-based AI is FinOps too

If you call hosted models, most savings come from usage patterns, not infrastructure:

- **Prompt caching** — providers such as Anthropic and OpenAI bill cached input tokens at a large discount; put stable content (system prompts, tool definitions, documents) first.
- **Batch APIs** — asynchronous batch processing is typically ~50% cheaper for non-interactive work.
- **Cap output length** and context size; trim chat history and retrieved chunks.
- **Per-team budgets and rate limits** at an AI gateway, with alerts on anomalies (a looping agent can burn a month's budget overnight).

## 6. A simple dashboard

```text
┌───────────────────────────┬───────────────────────────┐
│ $ / 1M output tokens      │ GPU SM-active % by pool   │
│ by model & team (trend)   │ (DCGM, p50/p95)           │
├───────────────────────────┼───────────────────────────┤
│ Idle allocated GPU-hours  │ Cache hit rate            │
│ (allocated – active)      │ (prefix / prompt cache)   │
├───────────────────────────┼───────────────────────────┤
│ Spot interruption & retry │ Top 10 most expensive     │
│ cost                      │ endpoints / agents        │
└───────────────────────────┴───────────────────────────┘
```

## Lessons learned

Measure **cost per token or per task**, not per GPU-hour. Buy capacity to match the workload's shape, push utilization up with sharing and queuing, and make each token cheaper with quantization, caching, routing and batching. Most AI cost wins are engineering decisions — which makes them a platform team's job.

---

*This wraps up the Infra for AI series. Next up: hands-on posts on running LLM gateways, evaluating agents, and building with Claude and MCP on Kubernetes.*
