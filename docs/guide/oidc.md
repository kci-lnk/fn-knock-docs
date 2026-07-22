# 外部账号登录（OIDC / OAuth）

外部账号登录把 QQ、Google、Microsoft、GitHub 或兼容 OIDC 的身份提供商绑定到一个 TOTP 凭据。它只在 `TOTP 登录模式` 下可用；第三方登录成功后仍使用 fn-knock 的会话和服务范围。

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

## 访问范围

OIDC 不是独立管理员身份。它继承所绑定 TOTP 的子域范围；撤销绑定后，第三方账号不能再登录，但不会删除该 TOTP 本身。删除提供商会同时移除该提供商下的外部账号绑定，执行前应确认所有使用者还有 TOTP 或其他恢复方式。

绑定邀请固定有效 30 分钟，并把完成授权的外部身份接到当前 TOTP。邀请链接属于敏感授权材料，不应放在群聊、工单或公开页面。绑定完成后，在快捷登录管理页核对提供商、账号、Subject 和最近使用时间。

## 常见问题

| 现象 | 检查项 |
| --- | --- |
| 登录页没有外部账号按钮 | 当前必须是 TOTP 登录模式，且提供商已启用 |
| 提供商拒绝回调 | Callback URL、HTTPS、允许的 redirect URI、域名和端口 |
| 回调后显示未绑定 | 先在 fn-knock 中完成外部账号与 TOTP 的绑定 |
| 登录后仍被拒绝 | 检查关联 TOTP 的服务范围和目标 Host 策略 |

- [绑定 QQ 快捷登录](/guide/qq-quick-login)
- [TOTP 与密码器](/guide/totp)
- [Passkey](/guide/passkey)
- [认证、会话与服务范围](/guide/auth)
