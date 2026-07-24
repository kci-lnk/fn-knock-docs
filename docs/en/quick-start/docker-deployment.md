---
lang: en-US
title: "Deploy with Docker Compose"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 5dbe558d2335cf9dd862fa1a6258676286d0409d9d7c3351c3025ae79cd554aa
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Deploy with Docker Compose

Choose the image source that works best on your network, then use the complete Compose configuration to run fn-knock on a Linux host or Linux-based NAS.

[Open the original Docker Hub page](https://hub.docker.com/r/kcilnk/fn-knock)

## Image source

| Image source | Image | Recommended network |
| --- | --- | --- |
| Official mirror | `hub.fnknock.cn/kcilnk/fn-knock:latest` | Mainland China; `latest` syncs every 30 minutes |
| Docker Hub | `kcilnk/fn-knock:latest` | Networks with reliable Docker Hub access |

The examples below use the official mirror. To switch sources, replace the image in the pull command and `FN_KNOCK_IMAGE` in `.env`. To pin a release, replace `latest` with a published version tag.

## Network mode

| Network mode | Recommendation | Description |
| --- | --- | --- |
| Host network | Recommended and default | Uses the host network directly so the container can detect real interfaces and IPv6 |
| Bridge network | Optional | Uses an isolated dual-stack bridge and mapped ports, but DDNS may not find the host interfaces or IPv6 |

Use host networking when DDNS must obtain an address from a network interface or when the deployment depends on host IPv6. Choose the bridge only when stronger isolation matters more and host-interface detection is not required.

## One-paste install

Paste the complete script below into a root terminal on the target Linux host. It uses the recommended host network by default, writes the complete Compose configuration, and starts fn-knock.

<!--@include: ../../_shared/docker-quick-install.inc-->

The install directory is `/opt/fn-knock-docker`. If `.env` or `docker-compose.yml` already exists there, the script stops without overwriting it.

## Complete installation

### 01 Check your Docker environment

A Linux host, Docker Engine, and Docker Compose are required.

```bash
docker version
docker compose version
```

The steps below use host networking by default. This mode declares neither `ports` nor a custom bridge; services listen directly on host ports.

### 02 Prepare a directory and pull the image

```bash
mkdir -p /opt/fn-knock-docker
cd /opt/fn-knock-docker
docker pull hub.fnknock.cn/kcilnk/fn-knock:latest
```

### 03 Create `.env`

Save the following as `/opt/fn-knock-docker/.env`:

<!--@include: ../../_shared/docker-env.inc-->

Key settings:

| Setting | Default | Description |
| --- | --- | --- |
| `FN_KNOCK_IMAGE` | `hub.fnknock.cn/kcilnk/fn-knock:latest` | Follows `latest` by default; use the Docker Hub image or a fixed version tag when needed |
| `ADMIN_VIEW_PORT` / `GO_REPROXY_PORT` | `7991` / `7999` | Host ports for the admin panel and public gateway |
| `FN_KNOCK_DOCKER_IPV4_SUBNET` | `172.30.0.0/16` | Bridge mode only; change to another private CIDR if it conflicts |
| `FN_KNOCK_DOCKER_IPV6_SUBNET` | `fd42:fb33:7f7a:100::/64` | Bridge mode only; IPv6 ULA `/64` for the Docker bridge |
| `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` | Empty | Set a proxy egress IP or CIDR only when `7991` is behind a trusted reverse proxy |
| `DOCKER_DISCOVER_LAN_IP` | Empty | Set only when a third-party reverse proxy cannot detect the host LAN address automatically |

### 04 Create `docker-compose.yml`

The recommended configuration uses one `fn-knock` container with host networking so it can access the host's real interfaces and IPv6:

<!--@include: ../../_shared/docker-compose.inc-->

#### Optional: switch to bridge networking

A bridge can prevent DDNS from finding the host's interfaces or IPv6. After confirming that the deployment does not depend on “from interface,” replace `.env` with:

<!--@include: ../../_shared/docker-env-bridge.inc-->

Then replace `docker-compose.yml` with:

<!--@include: ../../_shared/docker-compose-bridge.inc-->

### 05 Start and verify

```bash
docker compose up -d
docker compose ps
docker compose logs -f fn-knock
```

The final command follows the logs. Press `Ctrl+C` to stop following them.

## First access and setup

The default host mode uses the host network namespace directly. The admin panel listens on `7991`, the gateway on `7999`, and the remaining services stay internal or on host loopback.

| Port | Service | Exposure | Purpose |
| --- | --- | --- | --- |
| `7991` | Admin panel | Host network | Set the Docker admin-panel password on your first visit |
| `7999` | Gateway / proxy entry | Host network | Used by external clients to reach proxied services |
| `7998` | Rust backend | Host loopback / internal | Normally leave unchanged |
| `7997` | Authentication frontend | Host loopback / internal | Normally leave unchanged |
| `7996` | Go gateway administration | Host loopback / internal | Normally leave unchanged |

1. Open `http://<host-ip>:7991`, set the Docker admin-panel password, and sign in.
2. Configure reverse proxies, subdomains, certificates, and authentication in the admin panel.
3. Send external application traffic to the gateway on port `7999`.
4. If `7991` is behind a trusted reverse proxy, set `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` in `.env`.
5. Set `DOCKER_DISCOVER_LAN_IP` only when a third-party reverse proxy cannot detect the host LAN address automatically.

## Update to the latest image

Keep `latest` in `.env`, then pull and recreate the container. Persistent volumes are preserved.

```bash
cd /opt/fn-knock-docker
docker compose pull
docker compose up -d
docker compose ps
```

## Automate updates with Watchtower

When `.env` uses `latest`, you can run Watchtower on the same Docker host. By default, it checks all running containers every 24 hours. When the digest behind an image tag changes, Watchtower pulls the new image and recreates the container with its existing configuration. The fn-knock mounted volumes are preserved, but the update causes a brief restart. A fixed version tag is not automatically changed to a different tag.

```bash
docker run -d \
  --name watchtower \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  nickfedor/watchtower
```

Confirm that Watchtower is running and inspect its check history:

```bash
docker ps --filter name=watchtower
docker logs watchtower
```

> This basic configuration manages every running container on the host and receives highly privileged access to Docker through the Docker socket. Use it only on a trusted host, and back up fn-knock before enabling it. If other containers must not be updated automatically, follow the [official Watchtower documentation](https://watchtower.nickfedor.com/) to limit the update scope with container names, labels, or a scope.

## Reset the admin-panel password

If you forget the password, sign in to the Docker host and run:

```bash
cd /opt/fn-knock-docker && docker compose exec -T fn-knock fn-knock-reset-panel-password
```

Your next visit to port `7991` returns to the first-time password setup flow. This command clears only the admin-panel password, login sessions, and failed-login backoff state. It does not remove application settings, proxy rules, certificates, allowlists, logs, or data volumes.

## Continue reading

- [Ports, endpoints, and access paths](/en/quick-start/ports-and-entrypoints)
- [Choose an access mode](/en/quick-start/run-modes)
- [Backup, restore, and data cleanup](/en/guide/backup-and-restore)
- [Dashboard and system updates](/en/guide/dashboard-and-update)
