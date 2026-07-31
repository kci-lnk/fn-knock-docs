# OpenWrt 部署

`fn-knock` 的 OpenWrt 包包含 LuCI 配置页、管理后台、认证页、Rust 后端和 Go 网关。安装后从 `服务 → 敲门 Knock` 管理服务；管理后台默认使用 `7991`，网关入口默认使用 `7999`。

先区分固件的软件包格式和架构。格式错了会无法由包管理器安装，架构错了即使 CPU 看起来相近也不能运行。

## 选择正确的软件包

### 格式取决于固件

| 固件的包管理器 | 软件包格式 | 常见 OpenWrt 版本 | 安装命令 |
| --- | --- | --- | --- |
| `opkg` | `.ipk` | `24.10` 及更早版本 | `opkg install /tmp/<文件名>.ipk` |
| `apk` | `.apk` | `25.12` 及更高版本 | `apk add --allow-untrusted /tmp/<文件名>.apk` |

OpenWrt `25.12` 及更高版本通常使用 `apk`，`24.10` 及更早版本通常使用 `opkg`；衍生固件或升级中的设备仍以实际包管理器为准。不要因为系统版本号或文件扩展名猜测，先在路由器上确认：

```bash
ubus call system board
if command -v opkg >/dev/null 2>&1; then
  opkg print-architecture
else
  apk --print-arch
fi
```

### 按固件架构直接下载

以上方命令输出的目标架构为准，再从下表直接下载对应格式的软件包。这里的链接与官网使用同一套稳定下载入口，已包含软件包格式和架构，不需要手动修改 URL。

| 目标架构 | 常见设备 | APK（OpenWrt 25.12+） | IPK（OpenWrt 24.10 及更早） |
| --- | --- | --- | --- |
| `x86_64` | Intel / AMD 64 位软路由、虚拟机 | [下载 APK](https://get.fnknock.cn/?type=apk&arch=x86_64) | [下载 IPK](https://get.fnknock.cn/?type=ipk&arch=x86_64) |
| `aarch64_cortex-a53` | IPQ60xx、Cortex-A53、ImmortalWrt `qualcommax/ipq60xx` | [下载 APK](https://get.fnknock.cn/?type=apk&arch=aarch64_cortex-a53) | [下载 IPK](https://get.fnknock.cn/?type=ipk&arch=aarch64_cortex-a53) |
| `aarch64_generic` | Generic ARM64 路由器和开发板 | [下载 APK](https://get.fnknock.cn/?type=apk&arch=aarch64_generic) | [下载 IPK](https://get.fnknock.cn/?type=ipk&arch=aarch64_generic) |
| `arm_cortex-a7_neon-vfpv4` | 使用对应目标的 32 位 ARMv7 设备 | [下载 APK](https://get.fnknock.cn/?type=apk&arch=arm_cortex-a7_neon-vfpv4) | [下载 IPK](https://get.fnknock.cn/?type=ipk&arch=arm_cortex-a7_neon-vfpv4) |
| `arm_cortex-a5_vfpv4` | Cortex-A5 / VFPv4 路由器 | [下载 APK](https://get.fnknock.cn/?type=apk&arch=arm_cortex-a5_vfpv4) | [下载 IPK](https://get.fnknock.cn/?type=ipk&arch=arm_cortex-a5_vfpv4) |

发布包文件名的末尾是 OpenWrt 目标架构，例如：

```text
fn-knock_<version>-<release>_x86_64.ipk
fn-knock_<version>-r<release>_aarch64_cortex-a53.apk
```

以 `opkg print-architecture` 或 `apk --print-arch` 输出的目标名为准，尤其不要把 `aarch64_generic` 与 `aarch64_cortex-a53` 混用。当前没有对应包的 MIPS、ARMv6 或其他目标不能强行安装。

下载主包 `fn-knock`，不要把应用商店元数据包当作运行包。

## 安装

把匹配的包上传到路由器 `/tmp` 后，按固件类型执行一条命令：

```bash
# opkg 固件
opkg install /tmp/fn-knock_*.ipk

# apk 固件
apk add --allow-untrusted /tmp/fn-knock_*.apk
```

这些通配符命令假定 `/tmp` 中只有一个待安装的 `fn-knock` 主包；保留了多个版本时改用完整文件名。

`apk --allow-untrusted` 只适用于从可信发布页取得、并已核对来源或校验值的本地安装包；它会绕过包仓库签名校验，不能用于来路不明的文件。离线安装前也要确认固件的软件源能够满足依赖项。

安装脚本会启用并启动服务，同时刷新 LuCI 菜单缓存。也可以通过 LuCI 的软件包上传入口安装本地包；命令行路径更容易确认实际使用的格式和架构。

## 首次进入与端口

打开 `服务 → 敲门 Knock`，确认服务状态为“运行中”，再点击“打开管理后台”。默认地址为：

```text
http://<OpenWrt 局域网地址>:7991/
```

首次进入需要设置管理面板密码。它只保护 OpenWrt 上的管理入口，不等同于用户访问业务服务时使用的 TOTP、账号密码或 Passkey。

| 端口 | 监听范围 | 用途 |
| --- | --- | --- |
| `7991` | 可配置，默认管理入口 | 管理后台 |
| `7999` | 网关监听端口 | 对外访问映射服务的入口 |
| `17998` | `127.0.0.1` | Rust 管理后端内部 API |
| `7997` | `127.0.0.1` | 认证服务 |
| `7996` | `127.0.0.1` | 网关内部 gRPC |

LuCI 页面可以修改这些端口、数据目录和网关配置目录。提交配置后，`procd` 会重载服务。端口值必须彼此不同。

不要给 WAN 转发或放行 `7991`。如果需要公网访问，只在明确选择模式、证书和访问策略后，为网关端口 `7999` 建立必要的防火墙规则或上游转发。包本身不会替代 OpenWrt 的 WAN 防火墙策略。

服务和日志检查：

```bash
/etc/init.d/fn-knock status
logread -e fn-knock
```

管理后台可访问仅说明本机服务已启动。配置映射后，用移动网络等真实外部链路验证 `7999` 和域名，避免把 LAN 结果当作公网认证结果。

## 数据与升级

运行配置和数据默认位于：

```text
/etc/config/fn-knock
/etc/fn-knock/gateway
/etc/fn-knock/data
```

`/etc/config/fn-knock` 保存 UCI 端口与目录配置，`/etc/fn-knock/gateway` 保存网关运行配置，`/etc/fn-knock/data` 保存 SQLite、认证密钥及其他持久化数据。升级前将这三处纳入备份；它们含有敏感信息，不应上传到公开位置。

从旧版本升级且 UCI 仍使用默认 `/var/lib/fn-knock` 时，安装脚本会先停止服务，把旧数据复制到 `/etc/fn-knock/data`，再更新 `fn-knock.main.data_dir`。自定义过数据目录的实例不会被强制迁移。升级后先确认 LuCI 中的数据目录、管理登录和原有配置正常，再处理遗留的旧目录；不要在验证前手工删除它。

同时从维护页导出 `.knock` 应用备份。目录备份用于保留 SQLite 和平台运行数据，`.knock` 用于迁移可恢复配置；内容范围、版本限制和恢复验收见[备份、恢复与数据清理](/guide/backup-and-restore)。

OpenWrt 不支持管理后台内安装 FPK 更新。从上方直接下载表取得同一格式、同一固件架构的新包后执行：

```bash
# opkg 固件：安装新版本或显式重装同版本
opkg install --force-reinstall /tmp/fn-knock_*.ipk

# apk 固件
apk add --allow-untrusted /tmp/fn-knock_*.apk

/etc/init.d/fn-knock status
```

若 `/tmp` 中保留了多个版本，使用完整文件名代替通配符，避免一次传给包管理器多个包。

升级不会主动清空上述运行目录。若包管理器询问如何处理已修改的 `/etc/config/fn-knock`，保留现有配置，除非本次升级明确需要恢复默认配置。

忘记 OpenWrt 管理面板密码时，通过 SSH 执行：

```bash
fn-knock-reset-panel-password
```

随后回到 LuCI 的管理后台入口按提示设置新密码。

## OpenWrt 版能力限制

| 能力 | OpenWrt 软件包中的状态 |
| --- | --- |
| 应用内 FPK 更新 | 不支持；使用 `opkg` 或 `apk` 安装匹配的新包 |
| 直连模式、宿主机防火墙管理 | 不支持；使用 OpenWrt 自身的防火墙、VPN 或上级网关控制原始端口 |
| 智能连接 | 不支持；需要分流时在 OpenWrt 的 `dnsmasq`、DHCP 或其他本地 DNS 中自行配置 |
| SSH 安全 | 不支持；使用 OpenWrt 自身的 SSH 日志、防火墙或安全插件 |
| Web 终端 | 不支持 |
| 自动 HTTPS | 当前 OpenWrt 软件包不支持 |

`fn-knock` 不能替代 OpenWrt 固件更新、路由器备份和防火墙最小暴露原则。

继续阅读：

- [端口、入口与访问路径](/quick-start/ports-and-entrypoints)
- [选择访问方案](/quick-start/run-modes)
- [备份、恢复与数据清理](/guide/backup-and-restore)
- [控制台与系统更新](/guide/dashboard-and-update)
