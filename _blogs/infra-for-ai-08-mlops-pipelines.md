---
layout: default
title: "Infra for AI – Part 8: MLOps Pipelines"
date: 2026-03-22
author: "Roshan Raut"
slug: "infra-for-ai-08-mlops-pipelines"
tags:
  - ai
  - mlops
  - cicd
  - automation
summary: "Automating the AI lifecycle: Model registries, feature stores, and cost-optimized CI/CD workflows."
---

## Context
A model is not a static binary; it is a living entity that evolves as new data arrives. Without a structured MLOps pipeline, you end up with "Shadow AI"—models running in production that nobody knows how to retrain or roll back. MLOps is the bridge that brings DevOps discipline to the Data Science "Wild West."

## 1. The Model Registry: Versioning the Weights
In DevOps, we have Docker Hub; in AI, we have the **Model Registry** (e.g., MLflow, WandB, or AWS SageMaker Registry).
  - **What it stores:** Not just the `.bin` or `.safetensors` files, but the metadata: who trained it, what dataset was used, and the evaluation scores (Accuracy, F1, Perplexity).
  - **DevOps Rule:** Never deploy a model directly from a laptop. Every model in production must have a "Lineage" back to a specific Git commit and dataset version.

## 2. The Feature Store: Data Consistency
One of the biggest causes of model failure is "Training-Serving Skew"—using one version of data for training and a different version for real-time inference.
  - **Feature Store (e.g., Feast, Hopsworks):** Acts as a central repository for "Features" (processed data). It ensures that the same logic used to calculate a user's "average spend" during training is exactly what is used when the model makes a prediction in real-time.

## 3. CI/CD Automation for AI
AI CI/CD pipelines are triggered by two things: **Code Changes** or **Data Changes**.
  - **Continuous Integration (CI):** Instead of just unit tests, the pipeline runs "Model Checks"—ensuring the model doesn't output biased results or hallucinate on a gold-standard test set.
  - **Continuous Deployment (CD):** When a new model is registered, the pipeline automatically triggers a "Shadow Deployment" where the new model receives traffic but its predictions aren't shown to users yet (A/B Testing for AI).

## 4. Spot Instance Cost Control
Training is expensive. As a DevOps Engineer, you can save 70-90% of costs by using **Spot Instances**.
  - **The Challenge:** Spot instances can be reclaimed by the cloud provider at any time.
  - **The Solution:** Implement **Automated Checkpointing**. Your pipeline must save the model state to S3 every 30 minutes. If the instance is killed, the CI/CD pipeline should automatically restart the job on a new instance, resuming from the last checkpoint.

## 5. Production Promotion Workflows
You don't just "push to prod" in AI. You use a tiered promotion strategy:
  1. **Experimental:** Data scientists iterate in notebooks.
  2. **Staging:** The model is evaluated against a "Hold-out" dataset.
  3. **Canary:** The model is deployed to 5% of users. We monitor "Token Latency" and "User Feedback."
  4. **Production:** If the metrics look good, the model becomes the "Challenger" that replaces the current "Champion."

## Lessons Learned
MLOps is about **reproducibility**. If you can't recreate a production model from scratch using your automation, you don't have a pipeline—you have a manual process. By integrating Model Registries and Feature Stores into your CI/CD, you turn AI development into a predictable engineering discipline.
