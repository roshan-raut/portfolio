---
title: "Foundations – Part 10: The Linux Directory Structure"
short: "Linux directory structure"
date: 2026-11-17
updated: 2026-11-17
series: "Foundations"
part: 10
featured: false
summary: "A tour of the Filesystem Hierarchy Standard: what lives in /etc, /var, /usr, /proc, /sys, /dev and friends, the /usr merge, and the paths that matter for containers and Kubernetes nodes."
tags: [basics, linux]
---

## Context

Nearly every server, container and Kubernetes node runs Linux. The filesystem layout looks arbitrary at first, but it follows the **Filesystem Hierarchy Standard (FHS)**. Once you know where config, logs, binaries and runtime state live, you can find your way around any distro.

## 1. Everything hangs off `/`

Linux has a **single tree**. There are no drive letters. Disks, partitions, network shares and virtual filesystems are **mounted** at directories inside it.

```text
/
├── bin → usr/bin      user commands (merged into /usr)
├── sbin → usr/sbin    system admin commands
├── lib → usr/lib      shared libraries, kernel modules
├── boot               kernel, initramfs, bootloader
├── dev                device files
├── etc                system-wide configuration
├── home               users' home directories
├── root               root user's home
├── opt                add-on software packages
├── proc               process & kernel info (virtual)
├── sys                devices & kernel tunables (virtual)
├── run                runtime state since boot (tmpfs)
├── srv                data served by this system
├── tmp                temporary files
├── usr                installed software (read-mostly)
├── var                variable data: logs, caches, databases, spools
├── mnt, media         temporary / removable mounts
```

## 2. The important directories

### `/etc`: configuration

Plain-text, system-wide config. If you're changing how a service behaves, it's probably here.

| Path | What |
|---|---|
| `/etc/hosts` | Static name → IP mappings, checked before DNS |
| `/etc/resolv.conf` | Which DNS resolver to use (Part 5) |
| `/etc/passwd`, `/etc/group`, `/etc/shadow` | Users, groups, password hashes |
| `/etc/ssh/sshd_config` | SSH server settings |
| `/etc/systemd/system/` | Your systemd unit files and overrides |
| `/etc/os-release` | Which distro and version this is |
| `/etc/ssl/certs/` | The trusted CA bundle (Part 7) |

### `/usr`: installed software

The bulk of the OS lives here and is read-mostly: `/usr/bin` for commands, `/usr/lib` for libraries, `/usr/share` for docs and data, and `/usr/local` for software **you** compiled or installed by hand, which package managers won't touch.

**The /usr merge.** Modern distros (Fedora, Debian 12+, Ubuntu, Arch, RHEL 9) make `/bin`, `/sbin` and `/lib` symlinks into `/usr`. One place for the OS makes immutable and image-based systems easier.

### `/var`: data that changes

| Path | What |
|---|---|
| `/var/log/` | Logs (plus the systemd journal: read with `journalctl`) |
| `/var/lib/` | Persistent state of services: `/var/lib/docker`, `/var/lib/containerd`, `/var/lib/postgresql`, `/var/lib/kubelet` |
| `/var/cache/` | Re-creatable caches (package downloads) |
| `/var/tmp/` | Temp files that survive reboots |

A full `/var` (usually logs or container images) is one of the most common causes of a node going unhealthy.

### `/home` and `/root`

Each user's personal files and dotfiles (`~/.bashrc`, `~/.ssh/`, `~/.kube/config`, `~/.config/`). `root` gets `/root`, kept separate so it's available even if `/home` is on a failed mount.

### `/tmp` and `/run`

- **`/tmp`** holds scratch space for everyone. It's often a RAM-backed `tmpfs` and cleared on reboot.
- **`/run`** holds runtime state: PID files and sockets such as `/run/containerd/containerd.sock` and `/run/docker.sock`. It's always `tmpfs`.

### `/opt` and `/srv`

- **`/opt`** holds self-contained third-party packages, e.g. `/opt/google/chrome`.
- **`/srv`** holds data this machine serves (web roots, FTP). It's rarely used in practice.

## 3. The virtual filesystems

These aren't on disk. The kernel generates them on the fly.

### `/proc`: processes and kernel state

```bash
cat /proc/cpuinfo        # CPU details
cat /proc/meminfo        # memory
cat /proc/1/cmdline      # how PID 1 was started
ls -l /proc/$$/fd        # open files of your shell
cat /proc/sys/net/ipv4/ip_forward   # a kernel tunable (also via sysctl)
```

Tools like `ps`, `top` and `free` just read `/proc`.

### `/sys`: devices and drivers

A structured view of hardware and kernel subsystems. **cgroups** (how containers get CPU and memory limits) live under `/sys/fs/cgroup/`.

### `/dev`: devices as files

"Everything is a file": disks (`/dev/sda`, `/dev/nvme0n1`), terminals, `/dev/null` (a bit bucket), `/dev/zero`, `/dev/urandom`, and GPUs (`/dev/nvidia0`, `/dev/dri/`). This is how containers are given access to hardware.

## 4. Mounts

```bash
lsblk                 # disks and partitions
df -h                 # usage per mounted filesystem
findmnt               # the mount tree
cat /etc/fstab        # what mounts at boot
```

A *mount point* is just a directory. Mounting a disk at `/data` hides whatever was in `/data` before.

## 5. Containers and Kubernetes nodes

A container image is its own small root filesystem (`/bin`, `/etc`, `/usr`, …) layered with **overlayfs**. Paths worth knowing on a node:

| Path | What |
|---|---|
| `/var/lib/containerd/` | Image layers and container snapshots |
| `/var/lib/kubelet/` | Pod volumes, plugin sockets, kubelet state |
| `/var/log/pods/`, `/var/log/containers/` | Container stdout/stderr logs (what `kubectl logs` reads) |
| `/etc/kubernetes/` | Kubelet config, static pod manifests, PKI (on kubeadm clusters) |
| `/etc/cni/net.d/`, `/opt/cni/bin/` | CNI network config and plugins |
| `/run/containerd/containerd.sock` | The runtime socket. Mounting it into a pod is effectively root on the node |

## 6. Permissions in one table

```text
-rwxr-x---  1 roshan devops  4096  deploy.sh
 │└┬┘└┬┘└┬┘
 │ │  │  └── others: no access
 │ │  └───── group (devops): read + execute
 │ └──────── owner (roshan): read + write + execute
 └────────── type: - file, d directory, l symlink
```

```bash
chmod 750 deploy.sh      # rwx r-x ---
chown roshan:devops deploy.sh
```

## Lessons learned

`/etc` is config, `/usr` is software, `/var` is changing data (logs and state), `/home` belongs to users, `/tmp` and `/run` are temporary, and `/proc`, `/sys` and `/dev` are the kernel talking to you through files. Learn those and you can debug any Linux box or container. Next, the finale: **what happens when you type a URL**, where every part of this series comes together.
