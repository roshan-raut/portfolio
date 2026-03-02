---
layout: default
title: "Infra for AI – Part 5: Distributed Training"
date: 2026-03-01
author: "Roshan Raut"
slug: "infra-for-ai-05-distributed-training"
tags:
  - ai
  - distributed-systems
  - gpu
  - mlops
summary: "Scaling across the cluster: Mastering Data Parallelism, NCCL communication, and multi-node GPU networking."
---

## Context
Standard applications scale by adding more independent pods. AI training scales by linking pods together into a single "supercomputer." The challenge is no longer just compute; it is **inter-node latency**. If your network is slow, your $30k GPUs will spend 90% of their time waiting for data from their neighbors.

## 1. Data vs. Model Parallelism
Before building the infra, you must understand how the workload is split:

  - **Distributed Data Parallelism (DDP):** Every GPU gets a full copy of the model but a different "slice" of the data. They training independently and then sync their math (gradients) at the end of each step.
  - **Model Parallelism:** The model is so big (e.g., Llama-3 405B) it won't fit on one GPU. We "slice" the model layers across multiple GPUs.

## 2. The NCCL Communication Layer
**NCCL (NVIDIA Collective Communications Library)** is the secret sauce of distributed AI. It handles the "All-Reduce" and "Broadcast" operations that keep GPUs in sync.

  - **DevOps Responsibility:** You must ensure NCCL can "see" your high-speed network interfaces. In Kubernetes, this often requires setting environment variables like `NCCL_SOCKET_IFNAME=eth0` or `NCCL_DEBUG=INFO` to troubleshoot connectivity.

## 3. Networking: The East-West Traffic
Standard 10Gbps Ethernet is a massive bottleneck for AI. To scale effectively, we use specialized networking:

  - **GPUDirect RDMA:** Allows a GPU on Node A to write directly to the memory of a GPU on Node B, bypassing the CPU and the OS kernel.
  - **InfiniBand / RoCE:** High-speed interconnects (200Gbps - 400Gbps) designed specifically for low-latency math synchronization.



## 4. Orchestration with Kubeflow & PyTorch Operator
Manually starting 50 pods and telling them who their "Master" is would be a nightmare. We use **Kubernetes Operators** to automate this:

- **PyTorchJob:** A Custom Resource Definition (CRD) provided by Kubeflow. You define the number of workers, and the Operator automatically handles:
  1. Creating the Master and Worker pods.
  2. Setting up the `MASTER_ADDR` and `MASTER_PORT` environment variables.
  3. Managing the lifecycle of the entire distributed job.

```yaml
apiVersion: "kubeflow.org/v1"
kind: "PyTorchJob"
metadata:
  name: "distributed-llama-finetuning"
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      template:
        spec:
          containers:
            - name: pytorch
              image: my-ai-app:latest
    Worker:
      replicas: 4
      template:
        spec:
          containers:
            - name: pytorch
              image: my-ai-app:latest
              resources:
                limits:
                  [nvidia.com/gpu](https://nvidia.com/gpu): 1
```

## 5. DevOps Challenges in Distributed Jobs

  1. **Gang Scheduling:** In distributed training, you need all 50 pods to start at the exact same time. If 49 start and 1 is pending, the 49 will sit idle, burning money. Tools like Volcano or Kueue are used for "all-or-nothing" scheduling.

  2. **Checkpointing:** Training can take weeks. You must configure high-speed shared storage (like FSx for Lustre) so the model can save "checkpoints." If a node fails, the job can resume from the last save.

## Lessons Learned
Distributed training turns Kubernetes into a performance-tuned engine. As a DevOps Engineer, your focus shifts from "uptime" to "throughput." Every millisecond saved in network latency translates directly into thousands of dollars saved in GPU compute time.
