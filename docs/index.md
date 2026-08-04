---
layout: home

hero:
  name: 敲门 Knock
  text: 轻松配置公网访问，更安全
  tagline: 把 NAS、相册、下载器和自建应用放在同一个入口后面。先登录，再访问；有公网 IP 可以直连，没有公网 IP 也能通过隧道接入。
  image:
    src: /logo.png
    alt: fn-knock
  actions:
    - theme: brand
      text: 开始部署
      link: /quick-start/deployment-options
    - theme: alt
      text: 我有公网 IP
      link: /quick-start/subdomain-mode
    - theme: alt
      text: 我没有公网 IP
      link: /quick-start/reverse-proxy-mode

features:
  - title: 一个入口，访问多个服务
    details: 用不同子域访问 NAS 和自建应用，登录、证书与访问策略集中管理。
    link: /guide/subdomain-proxy
  - title: 先确认身份，再进入服务
    details: 支持 TOTP、Passkey、账号密码和外部账号，并提供会话、白名单、WAF 与请求日志。
    link: /guide/auth
  - title: 按你的设备和网络来部署
    details: 支持 fnOS、Docker、OpenWrt、Linux、macOS、群晖与 Windows，也支持 FRP 和 Cloudflared。
    link: /quick-start/deployment-options
---

## 第一次使用，从这里开始

不用先读完所有文档。按下面的顺序接通一个服务，确认可用后再继续添加：

1. 选择 fnOS、Docker、OpenWrt、Linux、macOS、群晖或 Windows，完成[安装与部署](/quick-start/deployment-options)。
2. 根据家里的网络条件，选择[公网 IP 直连](/quick-start/subdomain-mode)或[FRP / Cloudflared 内网穿透](/quick-start/reverse-proxy-mode)。
3. 配置登录。建议先保留一个可恢复的 [TOTP](/guide/totp)，再按需添加 Passkey 或其他登录方式。
4. 接入一个测试服务，配置 [HTTPS 证书](/guide/ssl)，再用手机流量完整走一遍登录和访问流程。
5. 确认稳定后，再通过[服务发现](/guide/service-discovery)添加更多服务，并导出一份[应用备份](/guide/backup-and-restore)。

::: warning 别让其他入口绕过保护
fn-knock 只能保护经过它的流量。如果路由器、容器或云平台仍把 NAS 管理端口、业务原始端口直接暴露到公网，这些请求会绕过 fn-knock 的登录、WAF 和请求日志。
:::

## 按你的情况继续

- **还没安装，不确定该下载哪个包：**从[选择部署与访问方案](/quick-start/deployment-options)开始。
- **家里有可用的公网 IPv4 或 IPv6：**让域名直接指向 fn-knock，参考[公网子域访问](/quick-start/subdomain-mode)。
- **没有公网 IP，或者运营商不允许入站：**使用 FRP 或 Cloudflared，参考[内网穿透访问](/quick-start/reverse-proxy-mode)。
- **必须通过原来的端口访问服务：**先确认当前平台是否支持[直连授权](/quick-start/direct-mode)。
- **已经安装，但登录、证书或反代不正常：**前往[常见问题与排障](/faq)。
- **准备升级、迁移或重装：**先阅读[备份、恢复与数据清理](/guide/backup-and-restore)。
