---
layout: default
title: "Infra for AI – Part 9: Networking for AI"
date: 2026-03-29
author: "Roshan Raut"
slug: "infra-for-ai-09-networking"
tags:
  - ai
  - networking
  - rdma
  - performance
summary: "The silent killer of AI performance: Mastering RDMA, InfiniBand, and RoCE to eliminate network latency bottlenecks."
---

## Context
In traditional web architecture, we care about "North-South" traffic (users talking to servers). In AI clusters, 90% of the traffic is "East-West" (servers talking to servers). When training a 175B parameter model, the GPUs must synchronize billions of values every few milliseconds. A standard 10Gbps Ethernet network is physically incapable of this speed.

## 1. RDMA Fundamentals
**RDMA (Remote Direct Memory Access)** is the core technology of AI networking. 
  - **The Problem:** In standard TCP/IP networking, data must be copied from the GPU to the CPU, then to the OS kernel, then to the network card. This "context switching" creates massive latency.
  - **The Solution:** RDMA allows a GPU on Node A to read or write data directly into the memory of a GPU on Node B, completely bypassing the CPU and the Operating System.

## 2. InfiniBand Architecture
**InfiniBand (IB)** is a networking standard designed specifically for High-Performance Computing (HPC).
  - **Zero-Loss:** Unlike Ethernet, which "drops" packets when congested, InfiniBand uses credit-based flow control to ensure zero packet loss.
  - **Ultra-Low Latency:** While Ethernet latency is measured in milliseconds, InfiniBand latency is measured in **nanoseconds**.
  - **Hardware-Based:** The switching and routing are handled at the hardware level, making it the preferred choice for NVIDIA’s H100 clusters.

## 3. RoCE: RDMA over Converged Ethernet
For organizations that don't want to buy specialized InfiniBand hardware, **RoCE (pronounced 'Rocky')** is the middle ground.
  - **What it is:** It allows RDMA to run over standard Ethernet cables and switches.
  - **DevOps Challenge:** To make RoCE work effectively, you must configure "Lossless Ethernet" (PFC - Priority Flow Control) on your switches. If a single packet is dropped, RDMA performance collapses.

## 4. East-West Traffic Patterns
In an AI cluster, traffic patterns are "bursty" and "collective."
  - **All-Reduce:** Every GPU sends its data to every other GPU and waits for the result.
  - **Incast Problem:** When 100 GPUs all try to send data to 1 GPU at the exact same microsecond, it creates a "micro-burst" that can overwhelm standard network buffers.
  - **Infrastructure Solution:** We use **Rail-Optimized** networking, where GPUs in the same "slot" across different racks are connected to the same switch to minimize the number of "hops" a signal takes.

## 5. Identifying Latency Bottlenecks
As a DevOps Engineer, how do you know if your network is the problem?
  1. **NCCL Tests:** Run the `nccl-tests` suite. If your "Bus Bandwidth" is significantly lower than your hardware's rated speed (e.g., getting 20Gbps on a 200Gbps link), your network configuration is wrong.
  2. **GPU Utilization Dips:** If GPUs drop to 0% utilization at the exact same time every few seconds, they are likely stuck in a "Network Wait" state.
  3. **Tail Latency:** Monitor the slowest 1% of your network packets (P99). One slow switch port can slow down an entire 1,024-GPU cluster.

## Lessons Learned
AI networking is about **predictability**. In a web app, a slow packet is a minor annoyance. In an AI cluster, a slow packet is a "block" that stops thousands of expensive GPUs from doing work. Mastering RDMA and high-speed interconnects is what separates a "Cloud Engineer" from an "AI Infrastructure Architect."
