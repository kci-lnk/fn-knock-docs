# Cloudflared 隧道配置

Cloudflared 从内网主动连接 Cloudflare Tunnel，并把 Public Hostname 的请求送到 fn-knock 网关。fn-knock 只管理 Cloudflared 可执行资源、Tunnel Token、传输协议和进程；域名与源站 Service 仍在 Cloudflare Dashboard 配置。

新部署使用 `内网穿透 → 子域映射`，让 Cloudflare 保留 Host，fn-knock 再按 Host 分发。路径模式只用于兼容已有单域名路径入口。

群晖 DSM 7 SPK 提供 Cloudflared 的内置资源、Token 和进程管理。Windows x86_64 不提供这些能力；本页的系统设置步骤不适用于 Windows。如在同一台 Windows 主机自行运行 Cloudflared，可将其 Service 指向 `http://127.0.0.1:7999`，并自行负责进程、日志和更新。

## 1. 准备资源与 Tunnel

1. 在 `系统设置 → Cloudflared` 下载资源，确认状态为已就绪。
2. 打开 [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)，进入 `Networks → Tunnels`。
3. 新建 Cloudflared Tunnel，在安装页面复制 `--token` 后的长字符串。
4. 回到 `内网穿透 → Cloudflared`，粘贴 Token。也可粘贴整条安装命令，页面会尝试提取 Token。
5. 传输协议优先使用 `自动`：先尝试 QUIC，失败时回退 HTTP/2。只有 UDP `7844` 明确被阻断时才固定 HTTP/2。
6. 保存并启动，确认状态和日志显示 Tunnel 已连接。

Token 是隧道接入凭据，应按密码保存，不要放入截图或公开日志。

## 2. 配置 Host 路由

先在 fn-knock 保存根域、鉴权服务和业务 Host，例如：

```text
auth.example.com  -> 认证服务
nas.example.com   -> http://127.0.0.1:5666
alist.example.com -> http://127.0.0.1:5244
```

然后在 Tunnel 的 Public Hostname 中配置：

```text
Public Hostname  *.example.com
Service          http://127.0.0.1:7999
```

若实际网关不是 `7999`，使用后台显示的端口。通配 Public Hostname 负责把各业务 Host 送入同一网关，具体服务仍由本地 Host 映射决定。

Cloudflared 隧道已经保护 Cloudflare 到内网的传输时，本机回源优先使用 HTTP，配置最简单。需要 HTTPS 回源时再按下一节处理证书。

## 3. HTTPS 回源

网关已启用 HTTPS 时，Service 可以写成：

```text
https://localhost:7999
```

Cloudflared 会校验源站证书。自签证书或证书不包含 `localhost` 时，日志可能出现：

```text
certificate is valid for nas.example.com, not localhost
```

这表示 Tunnel 已到达源站，但校验的主机名与证书不匹配。选择一种处理方式：

- 把 Origin Server Name 设为证书覆盖的域名。
- 在明确接受风险时关闭该源站的 TLS 校验。
- 改回 `http://127.0.0.1:7999`，由 Cloudflare 承担外部 HTTPS。

不要把关闭校验描述成修复证书；它只是停止验证。证书管理见 [SSL 证书](/guide/ssl)。

## 路径模式兼容配置

已有 `https://home.example.com/alist` 等 URL 时，可在 `内网穿透 → 路径模式` 保留单个 Public Hostname：

```text
Public Hostname  home.example.com
Service          http://127.0.0.1:7999
```

Cloudflare 只负责把请求送到网关，路径拆分继续由 fn-knock 完成。不要同时在 Cloudflare 和 fn-knock 维护两套互相覆盖的路径改写。

## 客户端 IP 与 `local_exempt`

登录和白名单以网关识别到的客户端 IP 为准。私网、回环和链路本地来源会成为 `local_exempt`，跳过常规登录和已有严格白名单规则的检查。

Cloudflared 连接本机时本身来自回环地址，因此必须让内网穿透子域链路正确使用 Cloudflare 传来的访客信息。配置后从移动网络访问，并在 fn-knock 请求日志确认记录的是访客公网 IP，而不是 `127.0.0.1` 或容器地址。EdgeOne / ESA 的客户端 IP 开关不适用于 Cloudflared。

## 平台边界

- Cloudflared 是出站进程，不要求 fn-knock 管理宿主机防火墙；Docker 可以使用。
- 运行平台必须有匹配架构的 Cloudflared 资源。资源页未就绪时，保存 Token 也不能启动。
- Docker 中 `127.0.0.1` 只指当前容器；独立运行 Cloudflared 容器时，Service 应改为 fn-knock 的容器服务名和端口。
- 群晖 DSM 7 SPK 支持应用内 Cloudflared；管理页从 DSM 桌面套件入口进入，网关回源使用实际端口 `7999`。
- Windows 不提供 Cloudflared 的应用内资源页；独立运行的客户端不受 fn-knock 管理。
- fn-knock 不会创建 Cloudflare DNS、Tunnel、Public Hostname、缓存规则或 Origin Request 设置。

## 排错

1. **进程未启动**：检查资源状态、Token 和传输协议日志。
2. **Tunnel 在线但域名不通**：检查 Public Hostname、DNS 和 Service 的实际端口。
3. **返回 TLS 错误**：核对回源协议、证书信任和 Origin Server Name。
4. **鉴权 Host 可开但业务 Host 404**：确认使用通配 Public Hostname，且请求 Host 已存在本地映射。
5. **所有访问都像同一个来源**：检查请求日志中的客户端 IP，再排查 Cloudflare 到网关的来源传递。
6. **页面开但资源失败**：确认 WebSocket 未被禁用；路径模式再检查去前缀和 HTML 改写。

整体运行状态见 [内网穿透](/guide/tunnel)，完整示例见 [反代访问教程](/tutorials/reverse-proxy-with-fknock)。
