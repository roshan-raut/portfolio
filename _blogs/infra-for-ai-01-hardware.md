---
title: "Infra for AI – Part 1: Hardware 101 — Why Can't My CPU Do This?"
short: "Hardware 101"
date: 2026-02-01
updated: 2026-11-17
series: "Infra for AI"
part: 1
featured: true
summary: "Parallelism, low-precision math and memory bandwidth — why GPUs and other accelerators with HBM dominate AI, and how to read a 2026 spec sheet."
tags: [ai, gpu, hardware, fundamentals]
---

## Context

In classic DevOps we scale by adding CPU and RAM. AI infrastructure plays by different rules: the job is no longer general-purpose logic, it's **moving huge tensors through matrix multiplications as fast as memory allows**. Pick the wrong hardware and you pay for silicon that sits waiting on data.

## 1. Latency vs. throughput

- **CPU** — a handful of very fast, very smart cores. Built for branching logic and low latency. Think sports car.
- **GPU / accelerator** — tens of thousands of simple lanes plus dedicated matrix units (NVIDIA *Tensor Cores*, AMD *Matrix Cores*, Google TPU *MXUs*). Built for throughput. Think a train.

An LLM forward pass is billions of multiply-adds that don't depend on each other — perfect for the train.

## 2. Precision is a performance knob

Accelerators are rated in FLOPS **per data type**, and lower precision means more math per second and less memory per parameter.

| Format | Typical use in 2026 |
|---|---|
| FP32 / TF32 | Legacy training, numerically sensitive ops |
| BF16 | Default for training and high-quality inference |
| FP8 (E4M3/E5M2) | Mainstream for training on Hopper/Blackwell and for inference |
| FP4 (NVFP4 / MXFP4) | Blackwell-era inference; Rubin pushes it further |
| INT8 / INT4 | Weight-only quantization, edge and cost-optimized serving |

> **DevOps note:** Spec sheets love to quote FP4 *sparse* numbers. Compare the precision you will actually run, dense, and divide by price per hour.

## 3. Memory bandwidth is usually the real bottleneck

Generating a token means streaming the model weights (plus the KV cache) through the chip. For a 70B model in FP8 that's ~70 GB **per token step**. That's why decoding is usually **memory-bandwidth bound**, not compute bound — and why **HBM** (High Bandwidth Memory) matters more than raw TFLOPS for inference.

Rule of thumb for single-stream decode speed:

```text
tokens/sec ≈ memory bandwidth / bytes read per token
           ≈ 8 TB/s / 70 GB  ≈ ~110 tok/s (upper bound, batch size 1)
```

Batching amortizes those weight reads across many users, which is the whole game of inference serving (Part 7).

## 4. The 2026 accelerator landscape

| Generation | Memory | Notes |
|---|---|---|
| NVIDIA H100 / H200 (Hopper) | 80 GB HBM3 / 141 GB HBM3e | Still the cloud workhorse; plentiful and cheaper now |
| NVIDIA B200 / B300 (Blackwell, Blackwell Ultra) | ~180–288 GB HBM3e | FP4 Tensor Cores, NVLink 5; GB200/GB300 NVL72 racks |
| NVIDIA Rubin (Vera Rubin NVL144) | 288 GB HBM4 per GPU | Ramping in 2H 2026; another big jump in bandwidth |
| AMD Instinct MI300X / MI325X / MI355X | 192–288 GB HBM | Large memory per GPU; ROCm 7 maturing fast |
| Google TPU (Trillium, Ironwood) | HBM | Available on GCP; JAX and increasingly vLLM support |
| AWS Trainium2 / Trainium3, Inferentia2 | HBM | Lower $/token if you accept the Neuron SDK |

The headline trend: **memory per accelerator keeps growing faster than anything else**, because bigger models and longer contexts (KV cache) eat it.

## 5. Systems, not chips

Since Blackwell the unit you buy is increasingly the **rack**: 72 GPUs in one NVLink domain (NVL72) behave like one giant GPU for tensor- and expert-parallel workloads. That shifts the infra conversation to:

- **Power:** 120 kW+ per rack, heading toward 800 V DC designs.
- **Cooling:** direct liquid cooling is no longer optional at the top end.
- **Networking:** scale-up (NVLink) vs scale-out (InfiniBand / Ethernet) — see Part 9.

## 6. How to choose (practically)

1. **Fine-tuning / training a 7–70B model?** A node of 8× H100/H200 is still the sweet spot for most teams.
2. **Serving a large open-weight model?** Optimize for **memory capacity + bandwidth per dollar** (H200, B200, MI300X-class).
3. **Bursty, small models?** Fractional GPUs (MIG), L4/L40S-class cards, or a managed API.
4. **Calling frontier models (Claude, GPT, Gemini)?** You don't need GPUs at all — your infra problem becomes gateways, caching, rate limits and cost (Part 10).

## Lessons learned

Stop asking "how many cores?" and start asking **"how many bytes per second can I feed the matrix units, and in which precision?"** Everything else in this series — containers, schedulers, storage, networking — exists to keep those matrix units busy.
