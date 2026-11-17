---
title: "Infra for AI – Part 8: MLOps & LLMOps Pipelines — CI/CD for Models"
short: "MLOps & LLMOps"
date: 2026-02-15
updated: 2026-11-17
series: "Infra for AI"
part: 8
summary: "Evaluation-gated delivery, model and prompt registries, GPU runners in GitHub Actions, GitOps rollouts, tracing — and where AI coding agents fit in the pipeline."
tags: [ai, mlops, llmops, cicd, automation]
---

## Context

Classic MLOps was about retraining models on new data. In the LLM era most teams **compose** systems — a base model, prompts, retrieval, tools, maybe a LoRA — and every one of those is a versioned artifact that can regress. The pipeline's job is the same as in DevOps: **make change safe and fast**. The difference is that "tests" become **evals**.

## 1. What gets versioned

| Artifact | Where it lives |
|---|---|
| Code, IaC, prompts | Git |
| Datasets & eval sets | Delta tables / DVC / object storage with versions |
| Model weights & adapters | Model registry (MLflow, Unity Catalog, Hugging Face) |
| Container images | OCI registry, signed |
| Experiments & traces | MLflow 3 / Weights & Biases / Langfuse |

The rule: **every production response should be traceable** to a commit, a model version, a prompt version and a dataset version.

## 2. The pipeline

```text
PR opened
  ├─ lint, unit tests, IaC plan
  ├─ offline evals (golden set + LLM-as-judge) ── gate on quality & cost thresholds
  └─ build + sign image
merge to main
  ├─ (optional) fine-tune job on GPU runners / Databricks / Kueue
  ├─ register model + eval report
  └─ GitOps: Argo CD rolls out canary
production
  ├─ online evals on sampled traffic, user feedback
  └─ drift / regression alerts → open an issue / retrain
```

## 3. GPU jobs from GitHub Actions

Don't run training on hosted runners. Either:

- **Self-hosted GPU runners on Kubernetes** with Actions Runner Controller (ARC), scaled by Karpenter on spot capacity, or
- **Trigger a managed job** (Databricks Jobs, SageMaker, Azure ML) and wait for its result.

```yaml
jobs:
  eval:
    runs-on: [self-hosted, gpu-l4]
    steps:
      - uses: actions/checkout@v4
      - run: uv sync --frozen
      - name: Run eval suite
        run: uv run python -m evals.run --model "$MODEL_URI" --out report.json
      - name: Gate
        run: uv run python -m evals.gate report.json --min-score 0.85 --max-cost-per-1k 0.40
```

## 4. Evals are the tests

- **Golden datasets** of real inputs with expected properties.
- **Deterministic checks** — JSON schema, tool-call correctness, latency, cost per request.
- **LLM-as-judge** for open-ended quality, calibrated against human labels.
- **Regression tracking** — compare against the current production version, not an absolute bar.

MLflow 3, Databricks Agent Evaluation, promptfoo, DeepEval and Ragas all plug into CI.

## 5. Orchestration

**Apache Airflow 3** remains the workhorse for data and batch-ML pipelines (asset-aware scheduling, DAG versioning). **Databricks Workflows** if you're on the lakehouse; **Kubeflow Pipelines** or **Ray** when everything is Kubernetes-native.

## 6. Observability in production

Instrument with **OpenTelemetry GenAI semantic conventions**: model, tokens in/out, latency, cost, tool calls. Store traces (MLflow, Langfuse, Arize, your APM) and sample them into online evals. Alert on quality drops, not just 5xx.

## 7. AI agents in the pipeline

Coding agents like **Claude Code** now run inside CI (e.g. the Claude Code GitHub Action) to review PRs, fix failing tests, update Terraform or write the eval for a bug that was just reported. Treat them like any other automation:

- least-privilege tokens, scoped to the repo;
- changes land as **PRs that humans review**;
- they're bound by the same eval gates as everyone else.

## Lessons learned

LLMOps is DevOps with **evals as the test suite** and **models and prompts as versioned artifacts**. Gate every change on evals and cost, roll out with GitOps canaries, and trace everything in production.
