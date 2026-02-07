---
title: "Linux Directory Structure Explained for DevOps Engineers"
date: 2026-01-17
author: "Roshan Raut"
slug: "linux-directory-structure"
tags:
  - devops
  - linux
  - fundamentals
summary: "A practical explanation of the Linux filesystem hierarchy and what DevOps engineers should know about each directory."
---

## Why This Matters for DevOps

Understanding the Linux directory structure is critical for:
- Debugging production issues
- Writing automation scripts
- Managing containers and servers
- Passing interviews 😄

Most cloud workloads ultimately run on Linux.

---

## / (Root)

The root directory is the top-level of the filesystem hierarchy.

Everything in Linux starts from `/`.

```bash
/
├── bin
├── etc
├── home
├── var
├── usr
└── opt
```

---

## /bin – Essential User Binaries

Contains essential commands needed for system operation.

Common binaries:
```bash
ls
cp
mv
rm
cat
bash
```

---

## /sbin – System Binaries

System administration commands, typically used by root.

```bash
ip
mount
reboot
shutdown
fsck
```

---

## /etc – Configuration Files

Contains system-wide configuration files.

Examples:
```bash
/etc/nginx/nginx.conf
/etc/ssh/sshd_config
/etc/systemd/system/
```

Best practice: store only configuration here, never binaries.

---

## /home – User Home Directories

Each user gets a personal directory:

```bash
/home/roshan
/home/ec2-user
```

---

## /var – Variable Data

Stores data that changes frequently.

Important locations:
```bash
/var/log
/var/lib
/var/tmp
```

Examples:
- Logs: `/var/log/syslog`
- Docker: `/var/lib/docker`
- Kubernetes: `/var/lib/kubelet`

---

## /usr – User Space Programs

Contains applications and libraries.

```bash
/ usr/bin
/ usr/sbin
/ usr/lib
```

Most installed software lives here.

---

## /opt – Optional Software

Third-party and vendor software.

```bash
/opt/prometheus
/opt/sonarqube
```

---

## /tmp & /var/tmp – Temporary Files

```bash
/tmp       # cleared on reboot
/var/tmp   # persists after reboot
```

---

## /proc – Kernel & Process Info (Virtual FS)

```bash
/proc/cpuinfo
/proc/meminfo
/proc/1
```

Used for debugging and monitoring.

---

## /dev – Device Files

Hardware represented as files.

```bash
/dev/sda
/dev/null
/dev/random
```

---

## /mnt & /media – Mount Points

```bash
/mnt/data
/media/usb
```

---

## Practical DevOps Tips

- Monitor `/var` disk usage
- Understand `/proc` for performance debugging
- Keep `/etc` under version control where possible
- Avoid manual changes in `/usr`

---

## Interview Tip

Where do Linux logs live?

Answer:
```bash
/var/log
```

---

## Final Thoughts

Understanding the Linux directory structure is foundational for every DevOps engineer and critical for reliable system operations.
