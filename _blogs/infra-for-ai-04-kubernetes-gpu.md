---
layout: default
title: "Infra for AI – Part 4: Kubernetes for AI"
date: 2026-02-22
author: "Roshan Raut"
slug: "infra-for-ai-04-kubernetes-gpu"
tags:
  - ai
  - kubernetes
  - gpu
  - terraform
summary: "Orchestrating the silicon: How to manage GPU scheduling, node taints, and cost isolation in K8s clusters."
---

## Context
Running AI on Kubernetes is more than just deploying a pod. You are dealing with expensive, scarce resources that require specialized scheduling. If you don't configure your cluster correctly, a simple web-server pod might accidentally land on a $30,000 GPU node, wasting thousands of dollars.

## 1. The NVIDIA Device Plugin
Standard K8s tracks CPU and RAM. To track GPUs, we deploy the **NVIDIA Device Plugin** as a DaemonSet. It scans the nodes for hardware and reports the GPU capacity back to the API server.

  - **How it works:** It allows you to request `nvidia.com/gpu: 1` in your pod spec just like you request CPU.
  - **Implementation:** Without this, your pods will stay in a `Pending` state even if GPUs are physically present.

## 2. Node Labeling and Taints
To protect your GPU nodes from "general" traffic, we use **Taints and Tolerations**.

  - **The Taint:** We mark GPU nodes with `dedicated=gpu:NoSchedule`. This keeps regular pods off the node.
  - **The Toleration:** Only AI pods with a matching toleration are allowed to land there.
  - **Node Affinity:** We use labels (e.g., `accelerator=nvidia-h100`) to ensure a specific model lands on the exact hardware it needs.

## 3. Terraform Cluster Provisioning
Automating AI infrastructure means treating your GPU pools as "cattle, not pets." A typical Terraform setup for an EKS (AWS) or GKE (Google) cluster includes:

```hcl
# Example EKS Node Group for GPUs
resource "aws_eks_node_group" "gpu_nodes" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "ai-workers-h100"
  instance_types  = ["p4d.24xlarge"] # NVIDIA A100 Nodes

  scaling_config {
    desired_size = 2
    max_size     = 10
    min_size     = 0 # Scaling to zero is crucial for cost!
  }
}
```

## 4. GPU Scheduling & Sharing
In many cases, a pod doesn't need a full 80GB A100 GPU.

  - **MIG (Multi-Instance GPU):** Splits a single physical GPU into up to 7 smaller hardware-isolated instances.
  - **Time-Slicing:** A software-level split that lets multiple pods "take turns" on one GPU (best for development environments).

## 5. Cost Isolation Strategies
GPUs are the most expensive items in your cloud bill. As a DevOps Engineer, you must implement:

  1. **Cluster Autoscaler:** Automatically spin up GPU nodes when a job is queued and terminate them immediately when finished.
  2. **Karpenter (AWS):** A faster alternative to the standard autoscaler that can choose the most cost-effective GPU instance type on the fly.
  3. **Quotas:** Use ResourceQuotas per namespace to prevent a single team from accidentally consuming the entire company's AI budget.

## Lessons Learned
Kubernetes for AI is about strict segregation. By using Taints, Labels, and sophisticated Autoscalers, you ensure that your high-performance hardware is only used when necessary, by the right teams, at the right time.
