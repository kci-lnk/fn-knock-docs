# 无公网 IP：通过隧道发布子域

没有公网 IP 时，仍可使用子域映射。关键是让 FRP 或 Cloudflared 把外部请求带到 fn-knock 的网关入口，再由网关按 Host 路由到内网服务。

路径映射仍可用于旧配置，但新部署优先选择“内网穿透 / 子域映射”。

## 前置条件

- 已部署 fn-knock，网关端口在本机可用；
- 已准备 FRP 服务端或 Cloudflare Zero Trust 账号；
- 有可管理的域名，或 Tunnel 提供的公网 Host；
- 已准备登录凭据与真实外网验证条件。

## 配置步骤

1. 在 `系统设置 → 模式` 选择 `内网穿透`，并选择 `子域映射`。
2. 在 `子域映射` 设置根域、认证 Host 和第一个业务 Host。业务 Host 的 Target 填写 fn-knock 所在环境能访问的内网服务地址，默认开启“要求登录”；认证 Host 必须公开。
3. 在 `内网穿透` 安装并配置 FRP 或 Cloudflared，使外部流量转发到 fn-knock 的实际网关端口。
4. 在隧道提供商侧为认证 Host 和业务 Host 配置 DNS / Public Hostname，并保持 Host、WebSocket 和真实客户端 IP 传递正确。
5. 配置对外 HTTPS。由 Tunnel 或前置反代终止 TLS 时，明确回源协议与证书校验方式；不要把内部 `localhost` 地址当成浏览器访问地址。
6. 从移动网络打开认证 Host，完成登录后再访问业务 Host。

## FRP 与 Cloudflared 的差异

| 项目 | FRP | Cloudflared |
| --- | --- | --- |
| 公网入口 | 自有 `frps` 或服务商节点 | Cloudflare 边缘与 Tunnel |
| DNS | 通常指向 FRP 服务端 | Public Hostname 通常创建或关联 DNS |
| 真实来源 IP | HTTP 头或正确配置的 PROXY Protocol | Cloudflare 请求头；需按入口正确配置 |
| fn-knock 中的管理 | 可管理多个 frpc 实例、配置与日志 | 管理资源、Tunnel token、进程与日志 |

若 FRP 只做 TCP 转发，fn-knock 看到的连接来源可能是隧道节点或本地转接地址；应按 FRP 链路配置 PROXY Protocol 或可信真实 IP 头，并在请求日志验证结果。不要因为页面能打开就假定白名单、地区和扫描规则使用了正确的客户端地址。

Cloudflared 的 Public Hostname 应回源到网关入口，例如 `http://127.0.0.1:7999`，而不是直接回源业务服务；否则会绕过 fn-knock 的 Host 路由和认证。

## Target 地址

- fn-knock 与服务在同一主机原生运行时，可使用服务实际监听的 `127.0.0.1:<端口>`。
- Docker 中的 `127.0.0.1` 是 fn-knock 容器本身。宿主机服务应填写容器可达地址，其他容器应通过共享网络名访问。
- 服务位于其他局域网设备时，填写其稳定内网 IP 或内部 DNS 名称。
- Target 使用 HTTPS 时，检查证书名称与信任链；内网证书错误会表现为网关 `502`。

## 为什么不用 DDNS

隧道场景中，公开域名通常解析到 FRP 服务器或 Cloudflare 的边缘网络，而不是家庭宽带地址。此时为同一个 Host 再设置家庭地址 DDNS 会造成解析冲突。只有 DNS 最终需要指向会变化的自有公网入口时，才配置 DDNS。

## 验证链路

依次检查：

1. fn-knock 中隧道资源已安装，实例或 Tunnel 状态为运行中，日志没有持续重连；
2. 公网 DNS 是否指向正确入口；
3. 认证 Host 是否可打开并完成登录；
4. 请求日志是否显示正确 Host 和真实客户端 IP；
5. 业务 Host 是否匹配正确上游。

如果 DNS 能解析但请求日志没有记录，问题在隧道或前置平台；如果日志记录了请求但转发失败，再检查映射和上游服务。

继续测试 WebSocket、上传下载、退出和凭据服务范围。局域网请求可能被判定为 `local_exempt`，最终结果必须在真实外网验证。

## 回退与迁移

切换隧道前导出 fn-knock 配置，并记录旧 DNS、frpc 配置或 Tunnel Public Hostname。需要回退时，先恢复旧入口，再停止新隧道；不要让两个入口长期同时向同一 Host 提供不同的真实 IP 或 TLS 语义。

从路径模式迁移到子域映射时，先并行创建新的业务 Host 并完成验证，再移除旧路径。上游应用若保存了绝对回调 URL，还要同步更新应用设置。

- [内网穿透](/guide/tunnel)
- [Cloudflared 隧道](/guide/cloudflared-tunnel)
- [子域映射](/guide/subdomain-proxy)
