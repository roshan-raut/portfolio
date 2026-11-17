---
title: "Infra for AI – Part 5: Distributed Training at Scale"
short: "Distributed training"
date: 2026-02-09
updated: 2026-11-17
series: "Infra for AI"
part: 5
summary: "Data, tensor, pipeline, context and expert parallelism; FSDP2 and NCCL; and the operational reality of keeping hundreds of GPUs alive through a training run."
tags: [ai, distributed-systems, gpu, training, pytorch]
---

## Context

Most teams in 2026 **fine-tune** rather than pre-train — but even a LoRA on a 70B model or a full fine-tune of a 30B model needs multiple GPUs. Understanding *how* the work is split tells you what infrastructure it needs.

## 1. The parallelism menu

| Strategy | What's split | Communication | Typical scope |
|---|---|---|---|
| **Data parallel (DDP)** | The batch | Gradient all-reduce once per step | Across nodes |
| **Sharded DP (FSDP2 / ZeRO-3)** | Params, grads, optimizer state | All-gather + reduce-scatter per layer | Across nodes |
| **Tensor parallel (TP)** | Each matrix multiply | Very frequent all-reduce | Inside an NVLink domain |
| **Pipeline parallel (PP)** | Layers into stages | Activations between stages | Across nodes |
| **Context / sequence parallel (CP)** | Long sequences | Ring attention exchanges | Long-context training |
| **Expert parallel (EP)** | MoE experts | All-to-all token routing | NVLink domain or fast fabric |

Large runs combine them ("3D/4D/5D parallelism"). The infra rule: **the chattier the strategy, the faster the link it needs** — TP and EP want NVLink; DP tolerates the scale-out network.

## 2. Default choice for most teams: FSDP2

PyTorch's **FSDP2** (`fully_shard`) is the pragmatic default for fine-tuning up to ~70B: it shards everything across GPUs, works with `torch.compile`, and supports FP8 training on Hopper/Blackwell.

```python
import os
import torch, torch.distributed as dist
from torch.distributed.fsdp import fully_shard, MixedPrecisionPolicy

dist.init_process_group("nccl")
torch.cuda.set_device(int(os.environ["LOCAL_RANK"]))

model = build_model()
mp = MixedPrecisionPolicy(param_dtype=torch.bfloat16, reduce_dtype=torch.float32)
for block in model.layers:
    fully_shard(block, mp_policy=mp)
fully_shard(model, mp_policy=mp)
```

Higher-level options: **TorchTitan** (PyTorch-native reference), **Megatron-Core / NeMo** (NVIDIA, largest scale), **DeepSpeed**, and fine-tuning frameworks like **Axolotl**, **TRL** and **Unsloth**.

## 3. Launching

```bash
torchrun --nnodes=4 --nproc-per-node=8 \
  --rdzv-backend=c10d --rdzv-endpoint=$MASTER_ADDR:29400 \
  train.py --config llama-70b-sft.yaml
```

On Kubernetes, wrap this in a **JobSet** or **Kubeflow Trainer** (TrainJob) and admit it through **Kueue** so all 32 GPUs start together. **Ray** (KubeRay) is the other common choice, especially for RL post-training pipelines that mix training and inference.

## 4. NCCL: the network is part of the model

NCCL (RCCL on AMD) performs the collectives. Most "training is slow" tickets are NCCL picking the wrong transport.

```bash
export NCCL_DEBUG=INFO            # see which transport is chosen
export NCCL_SOCKET_IFNAME=eth0    # control traffic interface
# On AWS EFA, the aws-ofi-nccl plugin must be present in the image
```

Validate every new cluster with **nccl-tests** (`all_reduce_perf`) and compare bus bandwidth to the fabric's rated speed before you burn GPU-days on a real job.

## 5. Failure is the normal case

At hundreds of GPUs, something fails every few hours: an Xid error, a flaky link, an OOM.

- **Checkpoint often and asynchronously** — PyTorch DCP async save writes in the background while training continues.
- **Fast restart** — keep hot spares; JobSet/Kueue can replace a failed node and restart from the latest checkpoint.
- **Health checks** — run DCGM diagnostics and a quick NCCL test as a pre-flight before admitting a node.

## 6. RL post-training changes the shape

Reasoning-model training (GRPO/PPO-style RL) alternates **generation** (inference) with **training**. Infra-wise, that means running vLLM/SGLang and an FSDP/Megatron trainer side by side and syncing weights between them — frameworks like **verl** and **OpenRLHF** handle the orchestration, usually on Ray.

## Lessons learned

Pick the simplest parallelism that fits: **DDP → FSDP2 → add TP inside the node → add PP/EP only at real scale**. Then spend your effort on what actually stops runs: NCCL configuration, gang scheduling and checkpoint/restart.
