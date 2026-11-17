---
title: "Infra for AI – Part 9: Networking — The East-West Traffic of AI"
short: "Networking"
date: 2026-02-17
updated: 2026-11-17
series: "Infra for AI"
part: 9
summary: "Scale-up vs. scale-out fabrics: NVLink domains, InfiniBand, RoCE, Ultra Ethernet, AWS EFA — and why GPUDirect RDMA decides how fast your cluster really is."
tags: [ai, networking, rdma, performance]
---

## Context

Web apps are dominated by **north-south** traffic (users ↔ services). AI clusters are dominated by **east-west** traffic: GPUs exchanging gradients, activations, MoE tokens and KV caches with each other — constantly, in lockstep. The slowest link sets the pace for every GPU in the job.

## 1. Three tiers of networking

| Tier | Purpose | Technology | Bandwidth per GPU (order of magnitude) |
|---|---|---|---|
| **Scale-up** | GPUs acting as one big GPU | NVLink / NVSwitch, AMD Infinity Fabric (UALink emerging) | ~1–3.6 TB/s |
| **Scale-out** | Nodes in a training/inference cluster | InfiniBand, RoCEv2 Ethernet, AWS EFA | 400–800 Gb/s |
| **Front-end** | Storage, users, control plane | Standard Ethernet | 25–200 Gb/s |

That ~10× gap between scale-up and scale-out is why tensor- and expert-parallel traffic is kept **inside** an NVLink domain.

## 2. Scale-up got huge

With **GB200/GB300 NVL72**, 72 GPUs share one NVLink domain at ~1.8 TB/s per GPU. **Vera Rubin NVL144** (2H 2026) moves to NVLink 6 and roughly doubles that again. A trillion-parameter MoE model can now be served from *one rack* with expert parallelism over NVLink — an architecture decision, not just a networking one.

## 3. Scale-out: RDMA everywhere

**RDMA** lets one machine read/write another's memory without the CPU or kernel in the path. **GPUDirect RDMA** goes further: the NIC reads straight from GPU memory.

- **InfiniBand (NDR 400G → XDR 800G)** — lossless, credit-based, mature. Still the default for the largest training clusters.
- **RoCEv2** — RDMA over Ethernet. Needs careful tuning (PFC, ECN, DCQCN) but uses Ethernet skills and tooling. NVIDIA Spectrum-X and similar AI-tuned Ethernet fabrics close much of the gap with IB.
- **Ultra Ethernet (UEC 1.0, 2025)** — an industry spec for an AI/HPC-optimized Ethernet transport (packet spraying, modern congestion control). Expect it across NICs and switches through 2026–2027.
- **AWS EFA** — AWS's own RDMA-like transport (SRD). Needs the `aws-ofi-nccl` plugin in your image.
- **Azure ND-series** — InfiniBand between VMs.

## 4. Topology matters

Training fabrics are built as **rail-optimized, non-blocking fat trees**: GPU 0 of every node connects to "rail 0" switches, GPU 1 to rail 1, and so on. Collectives then mostly stay on one rail. As a platform engineer you rarely design this — but you **must schedule with it in mind**:

- Use topology-aware placement (Kueue TAS, Slurm topology plugin, cloud "placement groups" / "UltraClusters").
- Keep a job's nodes under as few spine hops as possible.

## 5. Inference needs fast networks too

Disaggregated serving (Part 7) moves KV caches between prefill and decode GPUs; multi-node replicas of very large models span hosts. Both use the same RDMA fabric via **NIXL / UCX**. Inference clusters are no longer "just Ethernet".

## 6. Validate before you trust

```bash
# RDMA links up?
ibstat            # InfiniBand
ibv_devinfo

# Real collective bandwidth across 2 nodes x 8 GPUs
mpirun -np 16 -H node1:8,node2:8 \
  ./build/all_reduce_perf -b 8 -e 8G -f 2 -g 1
```

Compare **bus bandwidth** to the fabric's rated line rate. If you get a fraction of it, NCCL is probably falling back to TCP sockets — check `NCCL_DEBUG=INFO`.

## Lessons learned

Think in **three networks**: NVLink for scale-up, RDMA (IB / RoCE / EFA) for scale-out, Ethernet for everything else. Place jobs according to topology, verify with nccl-tests, and remember the GPU can only go as fast as the slowest link it waits on.
