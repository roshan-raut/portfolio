---
title: "Kubernetes Cheatsheet for DevOps Engineers"
date: 2026-01-15
author: "Roshan Raut"
slug: "kubernetes-cheatsheet"
tags:
  - devops
  - kubernetes
  - kubectl
summary: "Essential kubectl commands for operating, debugging, and managing Kubernetes clusters."
---

## Context
This cheatsheet focuses on kubectl commands used in production operations and incident response.

## Cluster & Context
```bash
kubectl config get-contexts
kubectl config use-context my-cluster
kubectl cluster-info
```

## Namespaces
```bash
kubectl get ns
kubectl create ns dev
kubectl config set-context --current --namespace=dev
```

## Pods
```bash
kubectl get pods
kubectl describe pod pod-name
kubectl delete pod pod-name
kubectl exec -it pod-name -- /bin/sh
```

## Logs
```bash
kubectl logs pod-name
kubectl logs pod-name -c container-name
kubectl logs pod-name --previous
kubectl logs -f pod-name
```

## Deployments
```bash
kubectl get deploy
kubectl rollout restart deploy app
kubectl rollout undo deploy app
```

## Services
```bash
kubectl get svc
kubectl describe svc service-name
kubectl port-forward pod-name 8080:80
```

## ConfigMaps & Secrets
```bash
kubectl get cm
kubectl get secrets
kubectl get secret mysecret -o jsonpath="{.data.key}" | base64 -d
```

## Resource Usage
```bash
kubectl top nodes
kubectl top pods
```

## Lessons Learned
Most Kubernetes outages are caused by configuration mistakes rather than platform failures.
