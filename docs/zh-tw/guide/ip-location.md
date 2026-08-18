---
lang: zh-TW
title: "IP 地理位置服務"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: c7b106ccf83e900b8bc5bbb4d9389bd9fc91eef0ca21ff98d7fa18321312e084
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# IP 地理位置服務

IP 地理位置服務由兩個可獨立設定的資料來源組成：一個負責識別單一公網 IP，另一個則將地區條件解析成 CIDR。它會替工作階段、允許清單、請求與 WAF Log、事件中心、掃描器攔截、SSH 安全性及閘道可見性提供顯示資訊或規則資料。

地理位置結果只用來輔助判斷，不是精確定位，也不應成為高風險入口唯一的身分驗證條件。

## 兩類 API

| API | 用途 |
| --- | --- |
| IP 識別資料庫 | 將單一公網 IP 轉換為國家、省市與電信業者等資訊 |
| CIDR 位址資料庫 | 提供省市清單，並將地區與電信業者條件轉換為規則使用的 CIDR |

兩個 API 可分別選用官方線上服務或自訂服務，也能混合使用。例如，IP 識別使用官方服務，CIDR 查詢則使用內網自架服務。

## 官方線上服務

選擇「官方線上服務」後，系統會使用：

- IP 識別：`https://ipaddress.fnknock.cn/api/v1`
- CIDR 位址資料庫：`https://cidr.fnknock.cn/api/v1`

官方服務所需設定最少，且會自動維護地區資料，但 fn-knock 所在環境必須能解析網域並連線至對應的 HTTPS 服務。離線網路或對外連線受限時，應改用自訂服務。

## 自訂服務

頁面建議的相容實作如下：

| 服務 | 專案 | 預設填入值 |
| --- | --- | --- |
| IP 識別資料庫 | `go-ipaddress-api` | `http://127.0.0.1:30661` |
| CIDR 位址資料庫 | `go-cidr-api` | `http://127.0.0.1:30662` |

在 `系統設定 → 地理位置` 中選擇「自訂服務」，再填寫服務的 Base URL。URL 必須以 `http://` 或 `https://` 開頭，儲存時會移除結尾的斜線。

如果填寫的是網域根 URL，例如 `https://example.test`，fn-knock 會自動補上 `/api/v1` API Path；如果 URL 已包含自訂路徑，例如 `https://example.test/custom/`，則會直接在該路徑下請求 `ip/lookup`、`provinces` 等 API。

在 Docker 中，`127.0.0.1` 指向 fn-knock Container 本身。自架服務位於另一個 Container 或 Host 時，應使用同一個 Docker Network 中的 Service Name、Container 可連線的 Host IP，或明確發布的連接埠。

## 測試與儲存

「測試連線」會使用目前輸入的值，不需要先儲存：

- IP 識別測試會查詢 `8.8.8.8`，並檢查回應是否包含成功狀態與識別結果；
- CIDR 測試會讀取省份清單，再繼續探測電信業者篩選功能。

兩項測試都通過後再儲存。測試成功只代表 API 與回應格式可用，不保證所有 IP 與地區資料都完整。

地區選項可依中國電信、聯通或移動篩選 CIDR。自架 CIDR 位址資料庫必須提供電信業者資料才能使用該篩選；不支援時連線測試會提示更新位址資料庫，但一般省市查詢仍可使用。

## 資料如何載入頁面

IP 地理位置查詢由後台 Queue 非同步執行並快取。第一次開啟工作階段、Log、允許清單或事件詳細資訊時，可能先顯示「解析中」，稍後才補上地理位置。私有網路與 Loopback IP 會略過公網地理位置查詢。

既有記錄中的地理位置可能來自建立時寫入的資料，或後續由 Cache 回填；因此切換資料來源後，不應假設所有歷史記錄都會立即統一更新。

## 驗證與限制

儲存後，請在下列位置抽查同一個公網 IP：

1. 請求記錄或 WAF Log；
2. 工作階段記錄、允許清單或全域封鎖清單；
3. 事件中心；
4. SSH 登入 Log。

不同位置應顯示一致或相近的結果。失敗時請檢查 Base URL、通訊協定、DNS、Container Network、TLS 憑證、服務回應格式與 fn-knock 後台 Log。

如果所有請求都顯示為 CDN、反向 Proxy、私有網路或 Loopback IP，應先修正[真實用戶端 IP](/zh-tw/guide/gateway-proxy-headers)，而不是調整地理位置資料庫。

地理位置資料庫會有延遲，IP 也可能由電信業者重複分配；地區規則還可能誤擋旅行、漫遊或企業出口使用者。請搭配 CIDR、登入驗證與 Log 觀察使用，不要單獨把它當成高風險存取的唯一條件。

- [閘道可見性](/zh-tw/guide/gateway-visibility)
- [SSH 安全性](/zh-tw/guide/ssh-security)
- [掃描器攔截](/zh-tw/guide/scanner-interception)
