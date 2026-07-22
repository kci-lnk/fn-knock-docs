---
lang: zh-TW
title: "為什麼打造 fn-knock"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 5dd44afd0472d7e38bba48232ebc4839b57ac05b1a23c0c05d41f20aba14a52d
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 為什麼打造 fn-knock

許多人買 NAS，是想把照片、檔案及自己的服務留在自己手上。裝好設備後，很快就會碰到一個問題：人在外面時，要怎麼連回家裡的 NAS？

最直接的做法是設定 Port Forwarding。相簿開一個 Port、下載器開一個 Port、管理後台再開一個 Port，用起來確實方便。但這些 Port 一旦直接暴露到公網，面對的就不只有你和家人，還有 24 小時不間斷掃描公網位址的 Bot。你看到的是家裡的服務，它們看到的則是一批可以持續嘗試入侵的入口。

我們打造 `敲門 Knock`，是希望讓公網存取更簡單：服務照常使用，入口統一交由敲門接管；訪客先完成登入，確認具備權限後，閘道才會把 Request 轉送至 NAS。

## 為什麼要在服務前再加一道門

2026 年初，飛牛 fnOS 發生了一起嚴重的資安事件。飛牛團隊在後續的[事件說明](https://club.fnnas.com/forum.php?mod=viewthread&tid=28887)中確認，當時發現並修補了越權存取、Path Traversal 及 Authentication Bypass 三項漏洞。部分攻擊手法公開後，尚未更新的裝置開始遭到大規模探測與攻擊。

奇安信 XLab 對惡意 Sample 的[分析](https://blog.xlab.qianxin.com/netdragon/)顯示，部分受感染裝置被納入 Netdragon Botnet，用來發動 DDoS 及執行遠端指令。惡意程式還會修改防火牆規則與 `hosts` 檔，干擾裝置取得更新。

這起事件帶來一個很現實的提醒：登入頁與雙因素驗證只能保護正常登入流程。若漏洞發生在登入之前，或攻擊者能繞過原有驗證，增加再多登入 Factor 也擋不住那條 Request。

這並不是飛牛獨有的問題。NAS 系統、第三方應用程式與 Docker Container 都會更新程式碼，也都可能出現新的漏洞。該更新時仍要及時更新，但不能把所有希望都寄託在「我已經是最新版」。少暴露一個入口，攻擊者就少一個能直接碰到服務的地方。

## 再加一層 Basic Auth 就夠了嗎

Lucky、Nginx 等工具都能很方便地替頁面加上 Basic Auth。若只是暫時保護頁面，或擋掉一些沒有特定目標的 Scanner，它確實很好用。

但 Basic Auth 通常就是一組長期使用的帳號密碼。它在網路上傳遞的憑據只有 Base64 Encoding，並未加密，因此必須搭配 HTTPS；[MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication)也明確提醒了這一點。憑據一旦外洩，取得的人就能繼續使用。

實際使用時也會遇到相容性問題。瀏覽器、WebDAV、Player 及手機 App 對 Authentication Header 的處理方式不盡相同，常見情況是登入視窗反覆跳出，或某個 Client 完全無法使用，最後只能不斷依 Path 與 Client 加入例外。

Basic Auth 可以繼續作為補強措施，但我們不希望它成為 NAS 公網存取的唯一憑據。敲門使用獨立的登入憑據與工作階段，可以加入 TOTP、Passkey 及外部帳號，也能檢視、撤銷工作階段，並限制每組憑據可以存取哪些服務。

## 已經有 WAF，還需要敲門嗎

雷池（SafeLine）這類 WAF 很適合保護公開網站。網站原本就要接待所有訪客，WAF 負責從 Request 中辨識 SQL Injection、XSS、Path Traversal 及惡意 Bot。

NAS 管理後台、下載器及私人相簿通常不需要接待陌生訪客。與其讓所有 Request 先碰到服務，再判斷它像不像攻擊，我們更希望未登入的人完全連不到服務。

兩者可以搭配使用。敲門本身也提供 WAF、Scanner 攔截、封鎖清單及 Rate Limit。登入負責確認訪客是否具有權限，WAF 則繼續檢查已進入閘道的異常 Request，各自處理不同層級的問題。

## 為什麼不直接使用 Tailscale 或 ZeroTier

Tailscale、ZeroTier、EasyTier 及 WireGuard 都是成熟的 Mesh VPN 方案。如果使用的裝置相對固定，而且每台裝置都能安裝 Client，它們提供的網路隔離會更完整。

問題在於，手機、平板與電腦都必須先加入虛擬網路。臨時更換裝置，或想分享某項服務給家人時，都要多做一次 Client 設定。裝置上已經執行其他 VPN 或 Proxy 時，還可能遇到 Routing、DNS 或系統 VPN 權限衝突。

敲門面向的是另一種使用方式：開啟瀏覽器、輸入自己的網域，登入後直接使用。它不要求每台裝置安裝 Mesh VPN Client，也不會接管整台裝置的網路出口。

這兩類方案沒有絕對的優劣。如果完全不想提供公網入口，可以選擇虛擬組網；如果希望家人也能方便使用相簿、影音庫等 Web 服務，則可以將敲門放在公網入口前。

## 敲門實際做了什麼

以 Web 服務為例，可以為每個服務分配一個子網域：

```text
auth.example.com     登入入口
nas.example.com      NAS
media.example.com    影音庫
download.example.com 下載器
```

這些網域都會先進入敲門閘道。尚未登入時，閘道會將訪客帶到驗證頁面；登入成功後，再把 Request 轉送到對應的內網服務。外部只需要一個統一入口，不必把每個應用程式的原始 Port 都轉送到公網。

家中沒有 Public IP 時，可以透過 FRP 或 Cloudflared 建立[內網穿透](/zh-tw/quick-start/reverse-proxy-mode)，登入與服務映射的使用方式不變。少數必須保留 TCP / UDP 原始 Port 的服務，則可以在支援 Host 防火牆控制的平台上使用[直連授權](/zh-tw/quick-start/direct-mode)。

一次存取大致會經過下列流程：

1. 閘道檢查 Scanner 行為、封鎖/允許清單及存取來源；
2. 要求登入的服務檢查目前工作階段；
3. 使用者透過 TOTP、Passkey、帳號密碼或外部帳號登入；
4. 閘道確認這組憑據是否有權存取目前服務；
5. Request 通過 WAF 等檢查後，轉送到內網應用程式；
6. 存取結果寫入 Request Log，異常狀況可以傳送通知。

若某個映射已啟用登入保護，沒有有效工作階段時，Request 就不會送給 Upstream。要讓這套保護真正生效，所有公網流量都必須經過敲門，原本的服務 Port 也不能繼續獨立暴露。

## Request 如何流動

```text
訪客
  ↓
DNS / Router / CDN / Tunnel
  ↓
敲門 Knock 閘道
  ├─ 登入、工作階段、允許清單、WAF、Request Log
  └─ 依網域、Path 或 Protocol 選擇內網服務
  ↓
NAS、檔案服務、媒體服務或其他應用程式
```

管理後台只供管理員設定敲門，不是一般訪客的服務入口。實際執行由三個部分協同運作：

| 元件 | 負責內容 |
| --- | --- |
| Rust Service | 管理後台、登入驗證、安全政策、憑證、DDNS、Tunnel 及維運工作 |
| Go 閘道 | 接收外部 Request，執行登入檢查、服務路由及 Reverse Proxy |
| SQLite | 保存設定與 Runtime 資料，不需要另外安裝 Redis |

管理頁面已經打包在安裝套件與 Image 中，正常執行時不需要安裝 Node.js。各平台的 Management Port、Gateway Port 及監聽範圍不同，部署時請參考[連接埠、入口與存取路徑](/zh-tw/quick-start/ports-and-entrypoints)。

## 敲門能管理什麼，又不能管理什麼

敲門只能保護經過閘道的 Request。若 Router 仍轉送原本的 Management Port，或 Cloud Platform 仍保留另一條 Origin 位址，攻擊者依然能繞過去。

安裝完成後，還需要做好下列事項：

- 及時更新 NAS 系統、Docker Image 及服務應用程式；
- 關閉不再使用的公網 Port 及 Origin 位址；
- 正確設定 Router、CDN 及 Reverse Proxy 傳遞的訪客 IP；
- 為不同帳號分配真正需要的服務，不要共用高權限憑據；
- 定期備份設定、憑證及重要資料；
- 使用行動網路測試一次完整的公網登入流程。

敲門預設會放行部分區域網路、Loopback 及 Private Network 來源，讓使用者在家中可以直接使用。因此，在 LAN 中能開啟頁面，不代表公網登入已正確設定，務必切換到真實外部網路測試。

## 先通過門禁，再存取服務

安全工具常見兩個問題：簡單的功能不夠用，專業的工具又很難設定。許多使用者只是想在手機上安全地開啟家中的相簿與檔案，並不想先從頭學習 Reverse Proxy、防火牆、憑證及各種驗證協定。

敲門希望將這些環節整合在一起，讓使用者透過手機也能完成安裝、登入、服務映射及基本防護。服務出現漏洞的可能性不會消失，但先讓未登入的人碰不到服務，就能減少很大一部分風險。

我們不會承諾裝上敲門就絕對安全，也不會建議任何人因此停止更新系統。這項產品只做一件務實的事：先確認訪客是誰，再決定是否開門。

可以先接入一項服務試用：

- [選擇部署方式](/zh-tw/quick-start/deployment-options)
- [選擇公網直連或內網穿透](/zh-tw/quick-start/run-modes)
- [了解入口、連接埠與存取路徑](/zh-tw/quick-start/ports-and-entrypoints)

## 參考資料

- [飛牛：近期安全事件的完整說明與深刻反思](https://club.fnnas.com/forum.php?mod=viewthread&tid=28887)
- [奇安信 XLab：針對飛牛 NAS 的 Botnet Netdragon 快速分析](https://blog.xlab.qianxin.com/netdragon/)
- [飛牛資安揭露與處置建議](https://help.fnnas.com/articles/v1/safety/vulnerability-report)
- [MDN：HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication)
- [SafeLine README](https://github.com/chaitin/SafeLine)
