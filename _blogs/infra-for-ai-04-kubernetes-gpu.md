---
title: "Infra for AI – Part 4: Kubernetes for AI — The GPU-Enabled Cluster"
short: "Kubernetes & GPUs"
date: 2026-02-07
updated: 2026-11-17
series: "Infra for AI"
part: 4
featured: true
summary: "From device plugins to Dynamic Resource Allocation (GA in 1.34), GPU sharing with MIG, Kueue for fair queuing, and Karpenter GPU pools in Terraform."
tags: [ai, kubernetes, gpu, terraform, dra]
---

## Context

Kubernetes has become the default control plane for AI — training, batch inference and online serving. But the original GPU model (`nvidia.com/gpu: 1`) was a blunt instrument. 2025–2026 brought the biggest change in years: **Dynamic Resource Allocation (DRA)**.

## 1. The building blocks

| Component | Role |
|---|---|
| **NVIDIA GPU Operator** | Drivers, container toolkit, DCGM exporter, MIG manager, DRA driver |
| **Device plugin** *(classic)* | Advertises GPUs as a countable resource |
| **DRA driver** *(new)* | Advertises GPUs as rich, selectable devices |
| **Node Feature Discovery** | Labels nodes with GPU model, memory, driver |
| **Kueue** | Queueing, quotas and fair sharing for batch/AI jobs |
| **JobSet / LeaderWorkerSet** | Multi-pod training jobs and multi-host inference replicas |

## 2. Device plugin vs. DRA

The device plugin only knows "how many". You can't ask for "a GPU with ≥ 80 GB of memory" or "two GPUs on the same NVLink".

**DRA graduated to GA in Kubernetes 1.34** (`resource.k8s.io/v1`). Drivers publish `ResourceSlices` describing each device's attributes; workloads request devices with **CEL selectors** through a `ResourceClaim`:

```yaml
apiVersion: resource.k8s.io/v1
kind: ResourceClaimTemplate
metadata:
  name: big-gpu
spec:
  spec:
    devices:
      requests:
      - name: gpu
        exactly:
          deviceClassName: gpu.nvidia.com
          selectors:
          - cel:
              expression: device.capacity["gpu.nvidia.com"].memory.compareTo(quantity("80Gi")) >= 0
---
apiVersion: v1
kind: Pod
metadata:
  name: llm-server
spec:
  resourceClaims:
  - name: gpu
    resourceClaimTemplateName: big-gpu
  containers:
  - name: vllm
    image: vllm/vllm-openai:latest
    resources:
      claims:
      - name: gpu
```

Notes from the field:

- NVIDIA's DRA driver needs **K8s ≥ 1.34**, a **R580+** driver, and a CDI-enabled runtime. Disable the classic device plugin on nodes it manages.
- Some DRA driver features (e.g. dynamic MIG, ComputeDomains for multi-node NVLink on GB200) are still maturing — check the release notes for your version.
- Managed offerings (EKS, AKS, GKE) are rolling DRA support out at different speeds. The device plugin isn't going away soon.

## 3. Isolating GPU nodes

```yaml
# GPU nodes carry a taint; only GPU workloads tolerate it
tolerations:
- key: nvidia.com/gpu
  operator: Exists
  effect: NoSchedule
nodeSelector:
  nvidia.com/gpu.product: NVIDIA-H100-80GB-HBM3
```

## 4. Sharing a GPU

Most dev notebooks and small models don't need a whole H100.

- **MIG** — hardware partitions (up to 7 per GPU) with isolated memory and compute. Best for multi-tenant production.
- **Time-slicing** — software sharing, no memory isolation. Fine for dev.
- **MPS** — concurrent kernels from several processes; good for many small inference servers.

With DRA, these become **device configurations on a claim** instead of node-wide settings.

## 5. Queuing: Kueue

GPUs are scarce; you need admission control, not just scheduling.

```yaml
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: ml-team
spec:
  namespaceSelector: {}
  resourceGroups:
  - coveredResources: ["nvidia.com/gpu"]
    flavors:
    - name: h100-ondemand
      resources:
      - name: nvidia.com/gpu
        nominalQuota: 16
    - name: h100-spot
      resources:
      - name: nvidia.com/gpu
        nominalQuota: 32
```

Kueue gives you per-team quotas, borrowing, preemption, and **all-or-nothing (gang) admission** so a 16-GPU training job doesn't start with 12 GPUs and deadlock.

## 6. GPU node pools as code

On EKS, **Karpenter** has largely replaced managed node groups for GPU capacity: it picks the cheapest instance that fits pending pods and scales to zero.

```hcl
resource "kubectl_manifest" "gpu_nodepool" {
  yaml_body = <<-YAML
    apiVersion: karpenter.sh/v1
    kind: NodePool
    metadata:
      name: gpu
    spec:
      template:
        spec:
          requirements:
          - key: karpenter.k8s.aws/instance-family
            operator: In
            values: ["g6e", "p5", "p5en"]
          - key: karpenter.sh/capacity-type
            operator: In
            values: ["spot", "on-demand"]
          taints:
          - key: nvidia.com/gpu
            effect: NoSchedule
          nodeClassRef:
            group: karpenter.k8s.aws
            kind: EC2NodeClass
            name: gpu
      limits:
        nvidia.com/gpu: 64
      disruption:
        consolidationPolicy: WhenEmpty
        consolidateAfter: 5m
  YAML
}
```

On AKS use GPU node pools with the cluster autoscaler (or Node Auto-Provisioning); on GKE, ComputeClasses and DWS for queued capacity.

## 7. Observability

- **DCGM exporter → Prometheus**: `DCGM_FI_DEV_GPU_UTIL`, `DCGM_FI_PROF_SM_ACTIVE`, memory used, power, Xid errors.
- "GPU util 100%" can still mean idle tensor cores — watch **SM active / tensor pipe active** for real efficiency.

## Lessons learned

The 2026 GPU cluster is: **GPU Operator + DRA (or device plugin) + Kueue + Karpenter + DCGM**. DRA is the big shift — start testing it now on a 1.34+ cluster so you're ready when your managed provider makes it the default.
