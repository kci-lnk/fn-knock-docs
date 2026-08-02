# 外部账号登录（OIDC / OAuth / LDAP）

外部账号登录把 QQ、Google、Microsoft、GitHub、兼容 OIDC 的身份提供商，或 LDAP / Active Directory 目录账号绑定到一个 TOTP 凭据。它只在 `TOTP 登录模式` 下可用；登录成功后仍使用 fn-knock 的会话、服务范围和登录后 IP 授权策略。

OIDC / OAuth 由浏览器跳转到第三方站点完成授权；LDAP 由 fn-knock 服务端通过 LDAPS 或 StartTLS 连接目录。两者都必须先绑定到现有 TOTP，不能自动创建 fn-knock 身份。

## QQ 使用内置接入

QQ 是 fn-knock 的内置公共提供商，不需要注册 QQ 应用，也不需要填写 Client ID、Client Secret、Issuer 或手工登记 Callback URL。添加后仍要为每个使用者把 QQ 账号绑定到目标 TOTP 凭据。

完整的前提、绑定邀请、回调要求与撤销方式见[绑定 QQ 快捷登录](/guide/qq-quick-login)。

## Google、Microsoft、GitHub 与自定义 OIDC

1. 确认认证 Host 已配置为可从公网访问的 HTTPS 地址。
2. 在认证配置顶部操作菜单的 `OIDC 配置` 中添加提供商。
3. 将 fn-knock 显示的 Callback URL 原样填入第三方提供商的回调地址列表。
4. 填入提供商要求的 Client ID、Client Secret；Microsoft 可指定 `common`、`organizations` 或租户 ID，自定义 OIDC 还需要 Issuer。
5. 检查 Scopes。输入支持空格或逗号分隔，至少保留提供商完成身份识别所需的 `openid` 及必要用户信息范围。
6. 在目标 TOTP 凭据的 `管理快捷登录 → 外部账号绑定` 中生成邀请，完成授权绑定。
7. 用无痕窗口从登录页验证，再检查该 TOTP 的服务范围。

Callback URL 必须使用访问者实际可见的认证 Host。`localhost`、容器名、内网 IP 或错误端口会导致第三方提供商拒绝回调。QQ 的动态回调由系统处理，不适用本段的手工登记步骤。

一般提供商在必填连接参数完整时创建为启用状态；缺少参数时会保存为 `待配置` 草稿。编辑时 Client Secret 留空表示保留现值。停用提供商会隐藏或拒绝该登录入口，但保留配置以便重新启用。

## LDAP / Active Directory

进入 `认证配置 → OIDC 配置`，在 `LDAP / Active Directory 提供商` 中添加 OpenLDAP、Active Directory 或自定义 LDAP。目录连接始终验证 TLS 证书，不支持明文 LDAP；使用私有 CA 时，把签发链的 PEM 证书填入 `私有 CA PEM`。

| 设置 | 行为 |
| --- | --- |
| 服务器 URL | 每行一个；LDAPS 使用 `ldaps://ldap.example.com:636`，StartTLS 使用 `ldap://ldap.example.com:389`。按顺序尝试不可用的服务器 |
| `Base DN` | 用户搜索的根 DN，例如 `dc=example,dc=com` |
| `搜索后绑定` | 先用服务账号在 Base DN 下按过滤器找到唯一用户，再用该用户 DN 和用户密码验证 |
| `直接绑定` | 先按 `{username}` 模板生成 DN 或 UPN 并验证用户密码，再在 Base DN 下读取身份属性 |
| 用户过滤器 | 必须包含 `{username}`；输入会按 LDAP 过滤器规则转义 |
| 稳定 ID 属性 | 用于持续识别同一目录身份；OpenLDAP 默认 `entryUUID`，Active Directory 默认 `objectGUID` |

启用前先点击 `测试`。搜索后绑定会测试连接与服务账号；直接绑定需要输入一个目录账号完成一次性测试，测试凭据不会保存。连接超时、证书名称不匹配、私有 CA 缺失、Base DN 错误或过滤器返回零个/多个用户都会导致登录失败。

### 绑定目录账号

1. 在 `认证配置` 中打开目标 TOTP 的 `快捷登录`。
2. 在 `外部账号绑定` 中生成邀请，选择已启用的 LDAP 提供商。
3. 让目录账号使用者在 30 分钟内打开邀请链接，完成人机验证并输入目录用户名和密码。
4. 返回快捷登录页确认提供商、账号、Subject 和最近使用时间，再用无痕窗口验证登录。

邀请链接会把验证成功的目录身份绑定到指定 TOTP，属于敏感授权材料。一个目录身份不能通过同一提供商同时绑定到多个 TOTP。删除绑定只移除 fn-knock 中的关联，不会修改目录账号；删除提供商会同时删除该提供商下的所有绑定。

## 访问范围

OIDC 和 LDAP 都不是独立管理员身份。它们继承所绑定 TOTP 的子域与协议映射范围；撤销绑定后，外部账号不能再登录，但不会删除该 TOTP 本身。删除提供商会同时移除该提供商下的外部账号绑定，执行前应确认所有使用者还有 TOTP 或其他恢复方式。

绑定邀请固定有效 30 分钟，并把完成授权的外部身份接到当前 TOTP。邀请链接属于敏感授权材料，不应放在群聊、工单或公开页面。绑定完成后，在快捷登录管理页核对提供商、账号、Subject 和最近使用时间。

## 常见问题

| 现象 | 检查项 |
| --- | --- |
| 登录页没有外部账号入口 | 当前必须是 TOTP 登录模式，且提供商已启用并完成必填配置 |
| 提供商拒绝回调 | Callback URL、HTTPS、允许的 redirect URI、域名和端口 |
| 回调后显示未绑定 | 先在 fn-knock 中完成外部账号与 TOTP 的绑定 |
| LDAP 显示服务不可用 | 从 fn-knock 所在环境检查目录 DNS、端口、TLS 证书链和系统时间 |
| LDAP 凭据正确但仍失败 | 检查 Base DN、用户过滤器、绑定模式，以及稳定 ID 和用户名属性；搜索结果必须唯一 |
| 登录后仍被拒绝 | 检查关联 TOTP 的服务范围和目标 Host 策略 |

- [绑定 QQ 快捷登录](/guide/qq-quick-login)
- [TOTP 与密码器](/guide/totp)
- [Passkey](/guide/passkey)
- [认证、会话与服务范围](/guide/auth)
