# 内网穿透

设备没有可达公网入口时，FRP 或 Cloudflared 可以从内网主动建立隧道，把外部请求送到 fn-knock 网关。隧道只改变网络拓扑；请求进入网关后，仍由 Host 或兼容路径路由，再执行访问策略。

进入 `系统设置 → 模式` 选择 `内网穿透`。新部署选择 `子域映射`，已有单域名路径入口才选择标记为不再推荐的 `路径模式`。

群晖 DSM 7 SPK 提供 FRP 与 Cloudflared 的应用内资源和进程管理。Windows x86_64 不包含这些资源；本页中的 `系统设置 → FRP`、`系统设置 → Cloudflared` 步骤不适用于 Windows。若在同一台 Windows 主机自行运行隧道客户端，可让它回源 `127.0.0.1:7999`，但该进程的安装、凭据和生命周期由管理员自行负责。

## 两种隧道

| 方案 | 外部资源 | 适用情况 |
| --- | --- | --- |
| FRP | 一台运行 frps 的公网服务器和远端端口 | 需要自行控制公网地址、端口和传输配置 |
| Cloudflared | Cloudflare Tunnel 与 Public Hostname | 已使用 Cloudflare，希望以域名接入且不维护 frps |

两者的本地目标都是实际网关入口，常见为 `127.0.0.1:7999`；如果修改过端口，应以后台显示和部署配置为准。

## 路由选择

### 子域映射

推荐链路为：

```text
nas.example.com -> FRP / Cloudflared -> fn-knock -> Host nas.example.com -> 飞牛
```

隧道必须保留原始 Host，并把鉴权 Host 与业务 Host 都送到同一网关。Cloudflared 可使用 `*.example.com` Public Hostname；FRP TCP 转发则由 DNS 和远端端口共同指向 frps。

### 路径模式

兼容链路为：

```text
https://example.com/alist -> 隧道 -> fn-knock -> 路径 /alist -> AList
```

它保留旧 URL，但应用可能需要剥离前缀、HTML 改写或根目录模式。新服务不要因为使用隧道就默认选择路径路由。

## FRP

先在 `系统设置 → FRP` 下载资源，再进入 `内网穿透 → FRP`。默认生成的代理通常包含：

```toml
type = "tcp"
localIP = "127.0.0.1"
localPort = 7999
transport.proxyProtocolVersion = "v2"
```

PROXY Protocol v2 用于把公网客户端地址继续传给网关。frps、转发链路或自定义配置若不支持它，网关可能只看到 FRP 节点地址，白名单和登录 IP 授权也会随之失真。

页面提供两种编辑方式：

- `表单模式` 维护服务端地址、端口、Token、本地端口和远端端口。它只覆盖已支持字段，其他合法 TOML 会保留。
- `自定义` 直接编辑 `frpc.toml`。保存前运行 `frpc verify`；语法错误时不能保存，也不能可靠切回表单。

已有自定义配置时先备份原文，再切换编辑方式。

## Cloudflared

先在 `系统设置 → Cloudflared` 下载资源，再到 `内网穿透 → Cloudflared` 保存 Tunnel Token。公网域名和源站 Service 在 Cloudflare Dashboard 配置，不在 fn-knock 中创建。

Host 路由的推荐配置与 TLS 取舍见 [Cloudflared 隧道配置](/guide/cloudflared-tunnel)。

## 访问策略与真实客户端 IP

隧道不会替代 fn-knock 登录、白名单或凭据范围。Host 编辑页通过 `要求登录` 在公开和登录优先之间切换；历史配置中的严格白名单规则仍按来源 IP 执行。路径模式按每条映射决定是否登录。

认证判断以网关最终识别的客户端 IP 为准。私网、回环和链路本地来源会被标记为 `local_exempt` 并跳过常规登录与严格白名单，因此来源传递是隧道安全边界的一部分：

- FRP 优先保留默认 PROXY Protocol v2。
- Cloudflared 使用专用的内网穿透子域链路，不要套用 EdgeOne / ESA 开关。
- 启动后从移动网络访问，并在请求日志确认客户端 IP 是访客公网地址，而不是 `127.0.0.1`、容器地址或隧道节点地址。

## 进程守护与失败诊断

fn-knock 管理的 FRP 和 Cloudflared 进程会显示 `已停止`、`启动中`、`运行中` 或 `等待重启`。已要求持续运行的进程意外退出后，系统会自动重启，并按大约 `1、2、5、10、30、60、120、300` 秒逐步退避（带少量随机抖动）；稳定运行约 `5` 分钟后，连续失败计数会重置。手动停止会取消后续重试。

等待重启时，页面会显示连续失败次数、下次重试时间和最近诊断。日志保留进程 PID、启动与退出时间、运行时长、退出码或信号、失败摘要及最近标准输出/错误输出，可用于区分 Token、TLS、网络、配置和二进制问题。分享日志前仍应遮盖 Token、域名、公网地址和服务端信息。

fn-knock 服务自身重启后，会恢复已保存为持续运行的隧道，并在可验证时接管仍存在的进程。该守护只覆盖 fn-knock 启动的内置 FRP / Cloudflared；Windows 或其他外部独立进程仍由管理员负责。

## 平台边界

- 隧道是出站连接，不依赖 fn-knock 写入宿主机防火墙；Docker 也可使用。
- 运行环境必须有匹配架构的 FRP / Cloudflared 可执行资源。以 `系统设置 → FRP` 或 `系统设置 → Cloudflared` 的就绪状态为准。
- 群晖 DSM 7 SPK 支持这些内置资源；其管理入口仍只在 DSM 桌面 CGI 中提供，业务流量继续进入 `7999` 网关。
- Windows 不提供这些内置资源或就绪状态；自行部署的隧道进程不受 fn-knock 启停和日志管理。
- Docker 内的 `127.0.0.1` 指当前容器。fn-knock 网关与隧道进程在同一容器时可使用它；自建独立隧道容器需要改用服务名或容器网络地址。
- 内网穿透模式不提供智能连接和协议映射。额外 TCP / UDP 服务需在 FRP 或 Cloudflare 平台单独设计。
- 切离内网穿透模式时，系统会尝试停止由 fn-knock 管理的隧道进程；外部独立进程不在其控制范围内。

## 启动与验证

1. 保存路由方式、鉴权 Host 和至少一条业务映射。
2. 保存 FRP 或 Cloudflared 配置并启动。
3. 确认运行状态为已连接；若显示 `等待重启`，查看连续失败次数、下次重试时间和最近诊断，再检查 Token、TLS、网络或端口错误。
4. 从外部网络访问鉴权 Host 和业务 Host。
5. 在请求日志核对 Host、客户端 IP、授权类型和上游 Target。

操作流程见 [内网穿透上手](/quick-start/reverse-proxy-mode) 和 [反代访问教程](/tutorials/reverse-proxy-with-fknock)。
