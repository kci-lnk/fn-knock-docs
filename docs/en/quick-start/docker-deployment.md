---
lang: en-US
title: "Deploy with Docker Compose"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 97365fd9d189e2f5d9f1ad5e1489b3c5c982f21395a8897de030ce841e4085e5
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

## One-paste install

Paste the complete script below into a root terminal on the target Linux host. It checks Docker, reads the IPv6 interface table and verifies a global IPv6 address, then creates an IPv6-enabled bridge, writes the complete Compose configuration, and starts fn-knock.

<!--@include: ../../_shared/docker-quick-install.inc-->

The install directory is `/opt/fn-knock-docker`. If `.env` or `docker-compose.yml` already exists there, the script stops without overwriting it.

## Complete installation

### 01 Check your Docker environment

A Linux host, Docker Engine, and Docker Compose are required.

```bash
docker version
docker compose version
```

IPv6 must also be enabled on the host, and `/proc/net/if_inet6` must contain at least one global IPv6 record with scope `00`. This procfs virtual file always reports a size of `0`, so do not check it with `test -s`; the one-paste installer reads its contents instead.

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
| `FN_KNOCK_DOCKER_IPV4_SUBNET` | `172.30.0.0/16` | Docker bridge IPv4 subnet; change to another private CIDR if it conflicts |
| `FN_KNOCK_DOCKER_IPV6_SUBNET` | `fd42:fb33:7f7a:100::/64` | Docker bridge IPv6 ULA `/64` |
| `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` | Empty | Set a proxy egress IP or CIDR only when `7991` is behind a trusted reverse proxy |
| `DOCKER_DISCOVER_LAN_IP` | Empty | Set only when a third-party reverse proxy cannot detect the host LAN address automatically |

### 04 Create `docker-compose.yml`

The current deployment uses one `fn-knock` container on an isolated Docker bridge; it does not use `network_mode: host`. The configuration below enables IPv6 on the bridge and mounts the host's `/proc/net/if_inet6` read-only so DDNS “from interface” can read real host IPv6 interfaces.

<!--@include: ../../_shared/docker-compose.inc-->

### 05 Start and verify

```bash
docker compose up -d
docker compose ps
docker compose logs -f fn-knock
```

The final command follows the logs. Press `Ctrl+C` to stop following them.

## First access and setup

Compose maps only the admin panel and gateway to the host. Ports `7996`–`7998` stay internal, while a read-only file mount gives DDNS access to the host's IPv6 interfaces.

| Port | Service | Exposure | Purpose |
| --- | --- | --- | --- |
| `7991` | Admin panel | Mapped to host | Set the Docker admin-panel password on your first visit |
| `7999` | Gateway / proxy entry | Mapped to host | Used by external clients to reach proxied services |
| `7998` | Rust backend | Container only | Not exposed to the host by default |
| `7997` | Authentication frontend | Container only | Not exposed to the host by default |
| `7996` | Go gateway administration | Container only | Not exposed to the host by default |

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
