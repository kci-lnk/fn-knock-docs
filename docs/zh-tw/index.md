---
layout: home

hero:
  name: fn-knock
  text: 集中管理 HomeLab 的公開入口
  tagline: 將 NAS、相簿、下載器與自架服務放在同一個閘道後方。先驗證身分，再存取服務；有公網 IP 可直接連線，位於 CGNAT 後方也能透過 FRP 或 Cloudflare Tunnel 串接。
  image:
    src: /logo.png
    alt: fn-knock
  actions:
    - theme: brand
      text: 開始部署
      link: /zh-tw/quick-start/deployment-options
    - theme: alt
      text: 我有公網 IP
      link: /zh-tw/quick-start/subdomain-mode
    - theme: alt
      text: 我在 CGNAT 後方
      link: /zh-tw/quick-start/reverse-proxy-mode

features:
  - title: 一個入口，多個自架服務
    details: 以不同子網域存取 NAS 與自架應用，集中管理登入、TLS 憑證與存取原則。
    link: /zh-tw/guide/subdomain-proxy
  - title: 先驗證身分，再連入服務
    details: 支援 TOTP、Passkey、帳號密碼與外部 IdP，並提供工作階段、IP 允許清單、WAF 與請求記錄。
    link: /zh-tw/guide/auth
  - title: 配合既有設備與網路拓撲
    details: 支援 fnOS、Docker、OpenWrt、Linux、macOS、Synology DSM 與 Windows，也可搭配 FRP 或 Cloudflare Tunnel。
    link: /zh-tw/quick-start/deployment-options
---

## 第一次使用

依照下列順序接通一項服務，確認完整鏈路可用後，再繼續加入其他服務：

1. 選擇 fnOS、Docker、OpenWrt、Linux、macOS、Synology DSM 或 Windows，完成[安裝與部署](/zh-tw/quick-start/deployment-options)。
2. 依照家用網路條件，選擇[公網 IP 直連](/zh-tw/quick-start/subdomain-mode)或 [FRP / Cloudflare Tunnel 內網穿透](/zh-tw/quick-start/reverse-proxy-mode)。
3. 設定登入方式。建議保留一組可復原的 [TOTP](/zh-tw/guide/totp)，再視需求加入 Passkey 或外部 IdP。
4. 串接一項測試服務並設定 [TLS 憑證](/zh-tw/guide/ssl)，再以行動網路走完一次登入與存取流程。
5. 確認穩定後，透過[服務探索](/zh-tw/guide/service-discovery)加入更多服務，並匯出一份[應用程式備份](/zh-tw/guide/backup-and-restore)。

::: warning 不要留下繞過閘道的公開入口
fn-knock 只能保護經過它的流量。若路由器、容器平台或雲端防火牆仍將 NAS 管理介面或服務原始連接埠直接開放至公網，這些請求將繞過 fn-knock 的登入、WAF 與請求記錄。
:::

## 依照目前環境繼續

- **尚未安裝，無法確定套件：**從[選擇部署與存取方案](/zh-tw/quick-start/deployment-options)開始。
- **家中有可用的公網 IPv4 或 IPv6：**讓網域直接指向 fn-knock，參考[公網子網域存取](/zh-tw/quick-start/subdomain-mode)。
- **沒有公網 IP 或 ISP 阻擋入站連線：**使用 FRP 或 Cloudflare Tunnel，參考[內網穿透存取](/zh-tw/quick-start/reverse-proxy-mode)。
- **必須使用服務原本的連接埠：**先確認目前平台是否支援[原始連接埠直連](/zh-tw/quick-start/direct-mode)。
- **登入、TLS 或反向代理運作異常：**前往[常見問題與疑難排解](/zh-tw/faq)。
- **準備升級、遷移或重新安裝：**先閱讀[備份、還原與資料清理](/zh-tw/guide/backup-and-restore)。
