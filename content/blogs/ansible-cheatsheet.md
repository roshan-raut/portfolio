---
title: "Ansible Cheatsheet for DevOps Engineers"
date: 2026-01-16
author: "Roshan Raut"
slug: "ansible-cheatsheet"
tags:
  - devops
  - ansible
  - automation
summary: "Common Ansible commands, playbook patterns, and operational best practices."
---

## Context
This cheatsheet focuses on practical Ansible usage for configuration management and automation.

## Inventory
```bash
ansible-inventory --list -i inventory.ini
```

```ini
[web]
server1
server2
```

## Ad-Hoc Commands
```bash
ansible all -m ping -i inventory.ini
ansible web -m shell -a "uptime"
ansible web -m apt -a "name=nginx state=present"
```

## Playbooks
```bash
ansible-playbook site.yml -i inventory.ini
ansible-playbook site.yml --check
ansible-playbook site.yml --diff
```

## Variables
```yaml
vars:
  app_port: 8080
```

```bash
ansible-playbook site.yml -e "app_port=9090"
```

## Roles
```bash
ansible-galaxy init webserver
```

## Vault
```bash
ansible-vault create secrets.yml
ansible-vault edit secrets.yml
ansible-playbook site.yml --ask-vault-pass
```

## Best Practices
- Keep playbooks idempotent
- Use roles for reuse
- Separate secrets from code

## Lessons Learned
Ansible excels at predictable automation but requires strong structure to scale.
