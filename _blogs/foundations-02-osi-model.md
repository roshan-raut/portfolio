---
title: "Foundations – Part 2: The OSI and TCP/IP Models"
short: "OSI & TCP/IP models"
date: 2026-11-17
updated: 2026-11-17
series: "Foundations"
part: 2
featured: false
summary: "The seven OSI layers and the four-layer TCP/IP model, encapsulation, which devices and protocols live where, and how to use the layers to debug real problems."
tags: [basics, networking, osi]
---

## Context

When an engineer says "that's an L4 load balancer" or "it's a layer 7 problem", they're using the **OSI model**. It's a mental map that splits networking into layers, each with one job, each relying only on the layer below it.

## 1. The seven OSI layers

| # | Layer | Job | Unit | Examples |
|---|---|---|---|---|
| 7 | **Application** | What the app speaks | message | HTTP, DNS, SMTP, SSH, gRPC |
| 6 | **Presentation** | Encoding, compression, encryption | | TLS*, JSON, UTF-8 |
| 5 | **Session** | Keeping a conversation open | | TLS sessions, RPC sessions |
| 4 | **Transport** | Process-to-process delivery, ports, reliability | segment / datagram | TCP, UDP, QUIC |
| 3 | **Network** | Addressing and routing between networks | packet | IP (v4/v6), ICMP, BGP routes |
| 2 | **Data link** | Delivery on one local network | frame | Ethernet, Wi-Fi (802.11), MAC addresses, VLANs, ARP |
| 1 | **Physical** | Bits on a medium | bit | Copper, fibre, radio |

\*TLS doesn't fit neatly anywhere. In practice people call it "between L4 and L7". A mnemonic for 1→7: **P**lease **D**o **N**ot **T**hrow **S**ausage **P**izza **A**way.

## 2. The model the internet actually uses: TCP/IP

OSI is a teaching model. The real internet is built on the simpler **TCP/IP (Internet) model**:

{% include diagrams/osi-tcpip.html %}

You'll hear "L2, L3, L4, L7" constantly. L5 and L6 are rarely mentioned.

## 3. Encapsulation: envelopes inside envelopes

On the way down the stack, each layer wraps the data from the layer above with its own header:

{% include diagrams/encapsulation.html %}

- **Routers** read the IP header (L3) to decide where to send the packet next, and rewrite the L2 header at every hop.
- **The receiving host** unwraps it in reverse: Ethernet → IP → TCP → TLS → HTTP.
- **Each layer stays independent.** HTTP doesn't care whether it's carried over Wi-Fi or fibre.

## 4. Where devices and cloud services live

| Layer | Device / service | Decides based on |
|---|---|---|
| L2 | Switch, VLAN, Wi-Fi access point | MAC address |
| L3 | Router, VPC route table, IP firewall | IP address |
| L4 | Network load balancer (AWS NLB), security groups, NAT | IP + port + protocol |
| L7 | Application load balancer (ALB), API gateway, reverse proxy (NGINX, Envoy), WAF, service mesh | HTTP host, path, headers, cookies |

In Kubernetes, a `Service` of type ClusterIP is roughly L4 (kube-proxy/eBPF forwarding by IP:port). An `Ingress` or **Gateway API** `HTTPRoute` is L7 (routing by host and path).

## 5. Debug bottom-up

The layers give you a checklist when "it doesn't work":

| Layer | Question | Tool |
|---|---|---|
| L1/L2 | Is the link up? Do I have an IP? | `ip link`, `ip addr` |
| L3 | Can I reach the host? Is the route right? | `ping`, `ip route`, `traceroute`/`mtr` |
| L4 | Is the port open and reachable? | `nc -vz host 443`, `ss -tlnp`, security groups |
| TLS | Does the handshake work? Is the cert valid? | `openssl s_client -connect host:443` |
| L7 | Does the app answer correctly? | `curl -v`, app logs |

"Ping works but `curl` times out" means L3 is fine. Look at L4 (firewall, port) or above.

## Lessons learned

The OSI model is a shared vocabulary: L2 is the local network, L3 is IP routing, L4 is ports and TCP/UDP, L7 is the application. Real networks follow the 4-layer TCP/IP model, but the OSI layer numbers are how engineers talk, and how you debug. Next: **IP addresses, subnets and ports**, the L3/L4 addressing system.
