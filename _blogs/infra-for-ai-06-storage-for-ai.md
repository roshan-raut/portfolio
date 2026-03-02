---
layout: default
title: "Infra for AI – Part 6: Storage for AI"
date: 2026-03-08
author: "Roshan Raut"
slug: "infra-for-ai-06-storagefor-ai"
tags:
  - ai
  - storage
  - cloud
  - performance
summary: "Feeding the beast: Overcoming GPU starvation with high-throughput storage, FSx for Lustre, and data locality strategies."
---

## Context
When training a model, the GPU needs to "read" millions of small files (images, text snippets, or audio) repeatedly. In traditional DevOps, we optimize for latency. In AI, we optimize for **Aggregate Throughput**. If your storage throughput is 500MB/s but your GPU cluster needs 5GB/s, your training will take 10x longer than necessary.

## 1. Throughput vs. Latency
  - **Latency:** How long it takes to get a single file. (Crucial for web apps).
  - **Throughput:** How much total data can be pushed to the GPU per second. (Crucial for AI).

Training involves "Epochs"—the model reads the *entire* dataset over and over. If the storage is the bottleneck, the GPU utilization will drop, and your costs will skyrocket.

## 2. The S3 Limitation
Object storage like AWS S3 is great for durability and cost, but it is not a "File System."
  - **The Problem:** S3 has high "Time to First Byte" and isn't designed for the random-access patterns required by many ML frameworks.
  - **The Result:** Direct-from-S3 training often leads to "I/O Wait" bottlenecks.

## 3. High-Performance Solutions: FSx for Lustre
Lustre is a parallel file system used by almost all world-class supercomputers.
  - **AWS FSx for Lustre:** Provides a POSIX-compliant file system that links directly to an S3 bucket. It "lazy-loads" data from S3 to a high-speed SSD cache.
  - **DevOps Benefit:** It allows your code to see S3 data as a local folder (`/data/training`), providing millions of IOPS and hundreds of GB/s of throughput.

## 4. Hybrid Cloud & Caching: JuiceFS & Alluxio
If you are running across multiple clouds or on-prem, you need a data orchestration layer:
  - **JuiceFS:** An open-source POSIX file system built on top of Redis and S3. It provides high-performance metadata management, which is often the silent killer in AI storage.
  - **Alluxio:** Acts as a "Virtual Data Layer." It caches hot data close to the compute (Kubernetes nodes), reducing the need to fetch data from remote object stores repeatedly.

## 5. Data Locality Strategy
As a DevOps Engineer, your goal is to bring the data as close to the silicon as possible:
  1. **Host-Path Caching:** Using local NVMe drives on the GPU nodes as a "scratch space" for the current epoch.
  2. **Prefetching:** Loading the next batch of data into RAM while the GPU is still processing the current batch.
  3. **Data Sharding:** Ensuring that in a distributed setup, Node A isn't trying to read data that is physically closer to Node B.

## Lessons Learned
Storage for AI is about keeping the "data pipeline" full. If you see low GPU utilization in your monitoring (Prometheus/Grafana), don't assume the code is slow—check your disk throughput and metadata latency. In the world of AI, **Storage is the new Network.**
