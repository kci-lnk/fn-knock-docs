# Passkey

Passkey 让已绑定的设备通过系统生物识别或设备解锁完成登录。它只在 `TOTP 登录模式` 下可用，并绑定到一个已有的 TOTP 凭据；TOTP 仍应保留为恢复方式。

## 使用前提

- 使用 HTTPS 和最终会访问的域名；浏览器需要安全上下文。
- 已创建可用 TOTP 凭据。
- 认证 Host、Cookie 域和 Passkey RP 设置与域名规划一致。
- 浏览器或系统支持 WebAuthn。

2.2.1 改进了 Windows Passkey 提供商、Android / Google Password Manager 以及不同浏览器返回格式的兼容性。升级不会改变现有 Passkey 的 RP 绑定；如果旧凭据仍不能使用，先通过 TOTP 登录，在同一最终域名重新绑定测试，不要先删除唯一恢复方式。

子域场景可选择把 Passkey 绑定到认证 Host，或按产品设置使用父域。修改 RP 配置会影响已有 Passkey 的可用性，应在切换前保留可用 TOTP。

## 绑定与登录

用 TOTP 登录后，在状态页按提示绑定 Passkey。设备会要求进行指纹、面容或系统解锁确认。`系统设置 → 功能 → 登录后提示绑定 Passkey` 只控制状态页是否主动显示提示；关闭它不会删除已有 Passkey，也不会禁用登录页的 Passkey。

登录后的状态页会识别当前浏览器是否已经使用或记录过该账号的 Passkey：

- 当前浏览器没有已知 Passkey，账号也尚未绑定时，显示 `开启 Passkey 一键登录`。
- 账号已有 Passkey、但当前浏览器没有已知凭据时，显示 `再添加一个 Passkey`，可为新设备或未同步的密码管理器补充凭据。
- 当前浏览器已有已知 Passkey 时，不再重复显示绑定入口。

这里的“当前浏览器已知”只用于控制绑定提示：页面把凭据 ID 的 SHA-256 摘要保存在浏览器本地存储中，不保存 Passkey 私钥。清理该站点的浏览器数据、禁用本地存储或换用另一浏览器后，绑定提示可能再次出现；这不代表服务端凭据已丢失，可直接尝试 Passkey 登录或按需再添加一个。

TOTP 列表中的 `管理快捷登录` 可查看 Passkey ID、设备名和绑定时间，也可删除单个 Passkey；这里不提供新建 Passkey。该页还管理外部账号绑定；需要绑定 QQ 时，改看[绑定 QQ 快捷登录](/guide/qq-quick-login)。

Passkey 继承关联 TOTP 的服务范围和会话策略。删除单个 Passkey 只撤销该凭据，不会删除 TOTP、其他 Passkey 或外部账号绑定；删除父级 TOTP 则会一并删除关联快捷登录。

## 域名与 RP

WebAuthn 会把 Passkey 绑定到 Relying Party（RP）域。认证 Host、根域和 Passkey RP 需要形成稳定规划：

- 只使用单一认证域时，可让 RP 与认证 Host 对齐。
- 希望同一父域下的多个 Host 复用时，按后台支持的父域方案设置 RP。
- 更换认证域、从 IP 改为域名或改动父域后，已有 Passkey 可能无法使用。

迁移前保留可用 TOTP，并先用新域名绑定一个测试 Passkey。反向代理应保留最终外部 Host 和 HTTPS 协议信息。

## 遇到问题

- 入口不显示：确认仍在 TOTP 登录模式、页面通过 HTTPS 访问且浏览器支持 WebAuthn。
- 绑定后不能登录：检查认证域名与 RP 配置是否一致，改回 TOTP 完成恢复。
- 换了浏览器或设备：取决于系统是否同步该 Passkey；不要假设一定自动迁移。
- 提示创建已取消或超时：重新发起绑定，并完成系统弹出的生物识别或解锁确认。
- 提示系统无法创建：确认设备已设置屏幕锁，浏览器允许 Passkey，且密码管理器或系统凭据服务可用。
- Android 创建失败：系统会在兼容错误下自动改用标准注册参数重试；仍失败时更新浏览器和 Google Play 服务，并确认 Google Password Manager 已启用。
- Windows 没有出现预期的提供商：更新浏览器和系统，确认 Windows Hello 或所用密码管理器已启用，再从状态页重新发起绑定。
- 提示当前设备已有此 Passkey：无需重复绑定，直接在登录页使用 Passkey；若新设备未同步，可从状态页再添加一个。

- [TOTP 与密码器](/guide/totp)
- [绑定 QQ 快捷登录](/guide/qq-quick-login)
- [认证、会话与服务范围](/guide/auth)
