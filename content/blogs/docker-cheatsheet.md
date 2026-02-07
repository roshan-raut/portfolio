---
title: "Docker Cheatsheet for DevOps Engineers"
date: 2026-01-14
author: "Roshan Raut"
slug: "docker-cheatsheet"
tags:
  - devops
  - docker
summary: "A practical Docker command reference for images, containers, networking, volumes, and troubleshooting."
---

## Context
Docker is a core building block of modern DevOps platforms. This cheatsheet focuses on commands used daily in development, CI/CD pipelines, and production debugging.

## Images
```bash
docker images
docker pull nginx:latest
docker build -t myapp:1.0 .
docker rmi image_id
```

## Containers
```bash
docker ps
docker ps -a
docker run -d -p 8080:80 nginx
docker stop container_id
docker rm container_id
docker run -e ENV=prod myapp
```

## Logs & Exec
```bash
docker logs container_id
docker logs -f container_id
docker exec -it container_id /bin/sh
```

## Volumes
```bash
docker volume ls
docker volume create app-data
docker run -v app-data:/data myapp
docker inspect app-data
```

## Networks
```bash
docker network ls
docker network create app-net
docker run --network app-net myapp
```

## Cleanup
```bash
docker system df
docker system prune
docker container prune
docker image prune
```

## Docker Compose
```bash
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## Best Practices
- Use minimal base images
- Avoid running containers as root
- Pin image versions
- Scan images for vulnerabilities

## Lessons Learned
Most Docker issues in production stem from poor image hygiene and missing resource limits.
