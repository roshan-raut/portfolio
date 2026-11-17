---
title: "Infra for AI – Part 6: Storage Architecture for AI Workloads"
short: "Storage for AI"
date: 2026-02-11
updated: 2026-11-17
series: "Infra for AI"
part: 6
summary: "Why S3 alone starves GPUs, the tiered storage pattern (object → parallel FS → NVMe), checkpoint bursts, fast model loading and KV-cache offload."
tags: [ai, storage, cloud, performance]
---

## Context

A GPU waiting on I/O is the most expensive idle resource in your cloud account. AI has four very different storage patterns, and one system rarely serves them all well.

## 1. The four access patterns

| Pattern | Shape | What matters |
|---|---|---|
| **Training data reads** | Many small/medium random reads, repeated each epoch | Throughput, metadata ops |
| **Checkpoints** | Huge bursty writes from every rank at once | Write bandwidth |
| **Model loading** | 10–700 GB sequential read at startup | Read bandwidth → cold-start time |
| **KV-cache offload** *(new)* | Hot, latency-sensitive reads/writes during inference | Latency, bandwidth |

## 2. The tiered pattern

```text
  Object storage (S3 / Blob / GCS)  ← source of truth, cheap, durable
            │  lazy load / sync
  Parallel FS (FSx for Lustre, Azure Managed Lustre, Weka, VAST, JuiceFS)
            │  cache
  Node-local NVMe (instance store)  ← fastest, ephemeral
            │
          GPU HBM
```

- **FSx for Lustre** linked to an S3 bucket gives a POSIX view that hydrates on first read and writes checkpoints back.
- **Azure Managed Lustre** plays the same role on Azure; **Parallelstore / Managed Lustre** on GCP.
- **S3 Express One Zone** offers single-digit-ms object access for shard-based loaders.
- **JuiceFS / Alluxio** add a caching layer over any object store when you want portability.

## 3. Training data: think in shards

Millions of tiny files kill metadata servers. Pack data into large shards (WebDataset tar, Parquet, MosaicML Streaming / MDS) and stream them. On Databricks, Delta tables + Mosaic Streaming is a common pairing.

## 4. Checkpoints: absorb the burst

A 70B model with optimizer state checkpoints at ~1 TB. If 64 ranks write at once, your storage must absorb it or training stalls.

- Use **async/distributed checkpointing** (PyTorch DCP) — each rank writes its shard in the background.
- Write to the **parallel FS or local NVMe first**, then copy to object storage.
- Keep the last N checkpoints hot; lifecycle older ones to cheaper tiers.

## 5. Model loading: the cold-start problem

Autoscaling an inference server is pointless if it takes 8 minutes to load weights.

- **Parallel streaming loaders** (e.g. Run:ai Model Streamer, supported by vLLM) read safetensors from S3 concurrently, straight into GPU memory.
- **Node-local caches** — pre-warm popular models onto NVMe with a DaemonSet.
- **OCI image volumes** — ship weights as registry artifacts and reuse the image cache on each node.
- Use **FP8/FP4 checkpoints** where quality allows: half the bytes, half the load time.

## 6. KV-cache offload: storage meets inference

Long contexts and agent workloads re-send the same prefixes (system prompts, documents, tool definitions) over and over. Recomputing their KV cache is wasted GPU time. Modern stacks offload KV blocks to **CPU RAM, local NVMe or even shared storage** and reload them on a cache hit:

- **LMCache** and vLLM's KV-connector API
- **NVIDIA Dynamo KV Block Manager**
- **llm-d** KV-cache-aware routing (Part 7)

This makes storage latency part of your time-to-first-token budget.

## Lessons learned

Object storage is your **source of truth**, not your hot path. Put a **parallel filesystem or NVMe cache** between it and the GPUs, stream data in **shards**, write checkpoints **asynchronously**, and treat **model-load time** as a first-class SLO.
