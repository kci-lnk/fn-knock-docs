# Cloudflared 隧道配置

Cloudflared 从内网主动连接 Cloudflare Tunnel，并把公网请求送到 fn-knock 网关。推荐使用 fn-knock 的托管模式：填写 Cloudflare API Token 后，程序会发现 Zone 和 Account、创建或接入 Tunnel、维护通配 DNS 与 Ingress，并取得 Tunnel Token 启动 Cloudflared。常规配置不需要进入 Cloudflare 后台逐项添加 Public Hostname。

新部署应使用 `内网穿透 → 子域映射`。Cloudflare 保留原始 Host，fn-knock 再按 Host 把 `auth.example.com`、`nas.example.com` 等请求分发到本地服务。路径模式只用于兼容已有的单域名路径入口。

## 开始前

1. 在 `系统设置 → Cloudflared` 下载资源，确认状态为已就绪；若提示资源更新，执行后确认托管进程恢复运行。
2. 在 `系统设置 → 模式` 选择 `内网穿透 → 子域映射`。
3. 在 `子域映射` 中保存根域名、鉴权服务和至少一条业务映射。
4. 创建一个限制到目标 Account 和 Zone 的 Cloudflare 账号 API Token。

### 推荐：创建账号 API Token

账号 API Token 属于 Cloudflare Account，而不是某位用户。它不会因为创建者离开 Account 而自动失效，更适合 fn-knock 这类长期运行的服务。创建账号 Token 需要该 Account 的 Super Administrator 权限；没有此权限时，再改用个人 API Token。

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 `Manage Account → Account API Tokens`，选择要托管域名的 Account。
3. 点击 `Create Token`，选择创建自定义 Token，名称可填写 `fn-knock Cloudflare Tunnel`。
4. 添加下方列出的 Account 和 Zone 权限。
5. 在 `Account Resources` 中只选择当前 Account；在 `Zone Resources` 中只选择 fn-knock 根域所在的 Zone。
6. 可按运维策略设置过期时间。只有设备具备固定公网出口 IP 时才设置 Client IP 限制，否则网络变化后 Token 会突然不可用。
7. 点击 `Continue to summary`，检查没有多余权限和资源，再点击 `Create Token`。
8. Token 只显示一次。立即复制到 fn-knock 的 `API 连接` 输入框并完成连接，不要另外保存到文档、截图或聊天记录。

Cloudflare 对账号 API Token 的说明和最新控制台路径见[官方文档](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/)。如果使用个人 API Token，则从 `My Profile → API Tokens` 创建；它会跟随个人账号生命周期，适合临时测试，不是长期部署的首选。

基础托管需要以下权限：

- `Account / Cloudflare Tunnel / Edit`
- `Zone / Zone / Read`
- `Zone / DNS / Edit`

启用“优选 Beta”时还需要：

- `Zone / SSL and Certificates / Edit`

Token 需要能够读取根域所在的有效 Zone。根域可以是 Zone 本身，也可以是其下级域名；例如填写 `tu.example.com` 时，程序会继续查找上级 `example.com` Zone。API Token 与 Account API Token 均可使用。不要把 Global API Key 或 Token 放入截图、Issue 和公开日志；Token 一旦泄露应立即轮换。

## 托管模式配置

进入 `内网穿透 → Cloudflared`。页面中的每个区域都可以折叠，运行状态和日志位于最前面并默认展开。

### 1. 连接 Cloudflare

展开 `API 连接`，粘贴 API Token 并连接。连接成功后页面会显示识别到的 Zone；Token 明文不会在后续读取接口中返回。

若连接失败，先根据错误检查 Zone 状态和 Token 的资源范围。认证错误表示已保存的 API Token 本身无效，应在 `API 连接` 中更换 Cloudflare API Token；不要填 Tunnel Token。仅能读取 Zone、但没有 DNS 编辑权限的 Token，可能在连接时成功，却会在预检或应用时失败，此时页面会按缺失权限提示处理。

### 2. 选择 Tunnel

展开 `Tunnel 与域名同步`：

- `专用 Tunnel`：推荐。fn-knock 创建一个带实例标识的 Tunnel，并只管理自己的配置。
- `已有 Tunnel`：用于复用 Cloudflare 中现有的远程托管 Cloudflared Tunnel。fn-knock 会保留其他 Ingress 及其顺序，把自己的通配规则放在终止规则之前。

点击 `预检` 后，页面会列出将创建、更新或保留的 Tunnel、Ingress、DNS 和优选资源。预检计划有效期为 10 分钟；应用前如果远端配置已变化，需要重新预检。遇到同名但不属于当前实例的资源时，页面会报告冲突，只有明确标记为可接管并逐项确认后才会修改。若本地托管配置曾被重建，但已保存的多个资源标记仍一致指向同一根域和实例，程序会恢复原托管身份；证据不足或混有其他实例时不会自动认领。

预检指纹会忽略 Cloudflare 返回顺序、更新时间和验证状态等正常变化，但会保留 DNS 内容、代理状态、资源归属和 Ingress 等安全相关字段。应用前这些字段发生变化时，旧计划会失效并要求重新预检，不会沿用过时的接管确认。Custom Hostname 所需的所有权或证书验证 TXT 会按“名称 + 内容”分别维护；同名但内容不同的第三方 TXT 不会仅因名称相同而被覆盖。一个名称下存在多条无法安全判断归属的 CNAME / A / AAAA 时，应先在 Cloudflare 手工整理，再重新预检。

应用计划会提交为后台对账任务，页面显示执行进度；刷新页面或应用请求的响应因 Tunnel 重配而中断后，重新进入页面会继续跟踪同一个任务，不要重复点击应用。服务端同一时间只运行一个对账任务，并在真正修改前再次校验远端指纹和接管确认；同一计划以相同确认重复提交会返回原任务，不同确认则拒绝。任务失败后先阅读错误并重新预检，不要假设部分远端资源已经自动回滚。

基础托管会自动维护：

```text
*.example.com  -> <tunnel-id>.cfargotunnel.com（代理 CNAME）
*.example.com  -> fn-knock 的专用本地 Tunnel 入口（Ingress）
最后一条       -> HTTP 404
```

应用成功后，fn-knock 通过 Cloudflare 官方接口取得 Tunnel Token，并使用权限为 `0600` 的 Token 文件启动 Cloudflared。Token 不会出现在进程参数中。

### 3. 验证公网访问

托管 Cloudflare Tunnel 对访客提供标准 HTTPS 地址：

```text
https://auth.example.com/
https://nas.example.com/
```

不要在这些地址后补 `:7999`。即使旧配置中仍保存了公网 HTTPS 端口，Cloudflare Tunnel 模式下的子域列表、鉴权地址和登录跳转也会省略该端口。Cloudflare 负责外部 `443`，fn-knock 自动管理本地 Tunnel 入口。

保存新业务 Host 后，通配 Tunnel 已能立即接收请求，不需要再去 Cloudflare 后台添加一条 Public Hostname。若启用了优选，精确域资源会在后台继续对账；完成前仍由通配 Tunnel 正常服务。

## 优选 Beta

优选会测试从当前设备到 Cloudflare Anycast IPv4 的实际质量，再为已配置的精确业务域叠加 Cloudflare for SaaS Custom Hostname。标准通配 Tunnel 始终保留作为回退。

### 启用顺序

1. 在 `Tunnel 与域名同步` 中打开 `优选 Beta`。
2. 先执行 `预检`，确认套餐能力、权限、资源变化和冲突。
3. 应用预检计划。看到“需要先在 Cloudflare 对账计划中启用优选”时，表示尚未完成这一步。
4. 展开 `优选 Beta`，运行测速并查看候选结果。
5. 应用推荐 IP，或选择一个已通过验证的候选。

程序会先用隔离子域探测当前 Zone 是否支持 Custom Hostname、证书签发和 SNI 直连。能力不支持时只停用优选，不会影响基础 Tunnel。

### 候选来源

测速候选可来自：

- Cloudflare 官方 IPv4 网段的确定性抽样。
- 内置公共域名：瑞典政府 `www.gov.se`、美国国会图书馆 `www.loc.gov`、ICANN `www.icann.org` 和 Visa `www.visa.com`。
- 用户添加的公共候选域名，最多 16 个。
- 用户填写的 `自定义优选 IP`，仅接受 Cloudflare 官方 IPv4 网段内的地址。

这些公共域名只用于解析可能的 Cloudflare IPv4。fn-knock 不会把业务 CNAME 指向它们，也不会用它们的 Host 或 SNI 发送业务流量。解析不会使用本机 DNS，而是并发查询 Cloudflare、Google、腾讯 DNSPod 和 AliDNS 的加密 DoH；结果只保留 Cloudflare 官方 IPv4 网段内的地址，并优先排列被多个解析器共同返回的候选。单个解析器失败不会终止扫描，页面会保留最近一次扫描的解析器状态、成功/失败次数和回退路径。

自定义优选 IP 会强制进入测速短名单，但不会绕过 Cloudflare 网段、延迟、下载、业务域名 TLS、SNI 和 Ray ID 验证；全部通过时才会成为本轮推荐候选。若自定义地址失败，页面会保留失败说明，仍可从其他已验证候选中手动选择。

如果全部 DoH 都不可用，启用了“Cloudflare 官方 IPv4 网段”时会自动改用官方网段确定性抽样；关闭官方网段时，会验证现有的自定义优选 IP 和当前已发布候选，两者都不存在时本次扫描不可用。候选仍需通过后续业务域名 TLS、SNI、Cloudflare 错误页和 Ray ID 验证，因此 DNS 刚传播、单个解析器异常或本地 Fake IP 不会直接决定发布结果。

一个地址的注册机构或 GeoIP 显示“美国”，不代表请求落地在美国。Cloudflare IPv4 是 Anycast 地址，同一个 IP 会从多个边缘机房广播。结果中的 `Cloudflare 机房` 来自实际探测响应的 `CF-Ray` 后缀，例如 `SIN`、`HKG`；它比 IP 归属地更能说明本次连接的落地点。

### 测速与切换

单次测速最多选择 128 个候选，并发不超过 32。每个候选进行 3 次 TLS/延迟探测，延迟较好的 8 个候选再进行两次 1 MiB 下载，单次总下载量不超过 20 MiB。评分越低越好：

```text
中位延迟 + 2 × 抖动 + 1500 × 丢包率 + 800 / max(下载 Mbps, 1)
```

候选还必须针对实际业务 Host 通过 TLS、SNI 和 Cloudflare 错误页检查，不能只凭 ping 或 IP 归属地应用。自动策略每 7 天重新测速，每 15 分钟检查当前 IP；新候选至少好 15%，并在相隔 10 分钟的两轮确认中保持领先后才会切换。

当前 IP 连续失败时，程序优先切到已经验证的候选；没有可用候选时会移除 fn-knock 管理的精确 CNAME，让域名恢复匹配通配 Tunnel。也可以随时点击 `回退标准 Tunnel`。

### 套餐与安全边界

优选依赖 Cloudflare for SaaS Custom Hostname。可用数量以当前 Zone 的实际套餐和配额为准；超过配额的业务域会显示为标准 Tunnel 回退。Cloudflare 的 Orange-to-Orange 激活过程中，程序可能暂时发布一条指向标准 Tunnel 源站的精确 CNAME，以完成 Custom Hostname 和证书验证；两者同时激活前不会把业务域切到优选边缘。处于标准 Tunnel 回退时，验证完成后会移除这条临时精确记录，让请求继续匹配通配 Tunnel。

不要手工把代理状态的业务 A 记录直接指向 Cloudflare 边缘 IP，这可能触发 Cloudflare Error 1000。fn-knock 使用 Custom Hostname、专用源站域和 DNS-only 优选入口组合，并在能力探测失败时保持通配 Tunnel。

## 客户端 IP 与登录跳转

托管模式使用只监听回环地址的专用 Tunnel 入口。网关只在这条受控链路上信任 Cloudflare 的 `CF-Connecting-IP`，不会把访客自行发送的 `X-Forwarded-For` 当成可信来源。EdgeOne / ESA 的真实 IP 开关不适用于 Cloudflared，在当前模式不可用时界面会隐藏该设置。

如果 Cloudflare 的 `Pseudo IPv4` 设置为 `Overwrite Headers`，IPv6 访客的 `CF-Connecting-IP` 会变成 `240.0.0.0/4` 的 Class E 地址。托管专用入口会严格校验单值头，并从 `CF-Connecting-IPv6` 恢复有效的公网 IPv6，用于会话、可见性、WAF 和请求日志；缺失、重复、私网或格式异常时会保留 Pseudo IPv4，不会信任其他转发头。这个恢复只适用于 fn-knock 托管入口；手动 Cloudflare 回源建议把 Pseudo IPv4 设为 `Off` 或 `Add Header`。

从移动网络访问一条要求登录的业务 Host，并在请求日志确认：

- 登录跳转是 `https://auth.example.com/...`，没有 `:7999`。
- `redirect_uri` 仍是原业务 Host，也没有 `:7999`。
- 客户端 IP 是访客公网地址，而不是 `127.0.0.1`、容器地址或自定义 `X-Forwarded-For`。

## 手动 Token 模式

高级用户仍可展开 `手动 Tunnel Token`，粘贴从 Cloudflare 取得的 Tunnel Token，并选择传输协议。`自动`会优先尝试 QUIC，失败时回退 HTTP/2；只有 UDP `7844` 明确被阻断时才固定 HTTP/2。

手动模式不会自动创建 Tunnel、DNS 或 Ingress，需要自行在 Cloudflare 配置 Public Hostname 和回源 Service。自管进程或 Windows 版本也属于这一类；它们可以回源实际网关端口，但其安装、Token、日志和生命周期不由托管流程负责。

## 删除与清理

删除 API Token 只会停止后续远端管理，不会删除 Cloudflare 资源。需要移除资源时，使用 `移除托管资源` 生成清理预检并确认：

- 已有 Tunnel 永远不会被自动删除。
- fn-knock 创建的专用 Tunnel 也只有在明确勾选确认后才会删除。
- 清理优选资源会先让精确业务域恢复通配 Tunnel。

## 排错

| 症状 | 优先检查 |
| --- | --- |
| Zone 未找到或未激活 | 根域是否属于 Token 可访问的有效 Zone；Token 是否限制到错误 Account / Zone |
| API Token 认证失败 | 在 `API 连接` 中更换有效的 Cloudflare API Token；确认没有误填 Tunnel Token，并允许当前 Account 与 Zone |
| 提示缺少 DNS Edit | Token 是否具有 `Zone / DNS / Edit`，并允许目标 Zone |
| DNS tag 配额为 0 | 更新到已支持 comment-only 标记的版本后重新预检；不要手工创建重复记录 |
| 预检后应用返回 409 | 远端配置或本地根域已变化，重新执行预检 |
| 应用时页面刷新或连接中断 | 重新打开 Cloudflared 页面继续跟踪后台对账任务；不要用另一份确认重复提交同一计划 |
| 资源更新后进程未恢复 | 查看资源更新结果和 Cloudflared 日志；程序会尝试回滚旧文件，确认旧进程状态后再重试 |
| Tunnel 在线但域名不通 | 查看对账冲突、通配 DNS、Ingress、Cloudflared 日志和业务 Host 映射 |
| 跳转仍包含 `:7999` | 确认当前模式为 `内网穿透 → 子域映射`、默认 Tunnel 为 Cloudflared，并使用最新可用程序与资源后重新应用配置 |
| 优选无法启用 | 检查 SSL 权限、Cloudflare for SaaS 是否可用、Custom Hostname 配额和能力探测结果 |
| 候选域名全部解析失败 | 展开最近一次解析器诊断；允许官方网段时确认是否已自动回退，否则启用官方网段后重新测速 |
| 自定义优选 IP 未被采用 | 确认属于 Cloudflare 官方 IPv4 网段，并查看延迟、下载、业务域名 TLS、SNI 与 Ray ID 验证结果 |
| IP 归属地显示美国 | 查看测速结果中的 Cloudflare 机房代码；Anycast IP 的注册地不是连接落地点 |
| 日志中的 IPv6 变成 `240.0.0.0/4` | 托管模式升级到支持 Pseudo IPv4 恢复的版本；手动回源将 Cloudflare Pseudo IPv4 改为 `Off` 或 `Add Header` |
| 所有访问都像本地来源 | 查看请求日志中的客户端 IP，并确认使用托管专用入口而非错误的自管回源 |

整体运行状态见[内网穿透](/guide/tunnel)，Host 配置见[子域映射](/guide/subdomain-proxy)。
