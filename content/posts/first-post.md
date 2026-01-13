---
title: "Optimizing Azure Pipelines with Terraform"
date: 2026-01-14
tags: ["Azure", "Terraform", "CI/CD"]
summary: "How I reduced deployment time by 40% using reusable templates."
---

Here is how I structure my infrastructure code.

### The Terraform Code
```hcl
resource "azurerm_resource_group" "example" {
  name     = "example-resources"
  location = "West Europe"
}