---
lang: zh-TW
title: "Cloudflare Turnstile"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: bff7a9896c9cb9682d294bc7410d6890f4a1cc2a185542614228ec82e42fe628
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Cloudflare Turnstile

Turnstile 是 fn-knock 登入頁面可選用的人機驗證方式。它只驗證登入前的瀏覽器請求，無法取代反向 Proxy、CDN 或 WAF。

## 設定步驟

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)，建立一個 Turnstile Widget。
2. Widget Type 可維持一般可見模式。在 Hostname 清單中加入登入頁面使用的網域；不要填入通訊協定、路徑或連接埠。
3. 複製 Widget 的 `Site key` 與 `Secret key`。
4. 開啟 fn-knock 的 `系統設定 → Challenge`，選擇 `Turnstile`，填入兩組 Key 並儲存。
5. 從真實公網開啟身分驗證 Host，完成一次登入測試。

身分驗證 Host 若為 `auth.example.com`，Cloudflare 中就應登錄 `auth.example.com`。如果存取入口經過 CDN 或 Tunnel，請填寫使用者最終在瀏覽器中看到的網域，而不是 `localhost`、Container Name 或閘道的內網位址。

`Site key` 會傳送至瀏覽器；`Secret key` 只會在伺服器端呼叫 Cloudflare Siteverify API 時使用。請勿將 Secret Key 寫入前端程式碼、公開 Issue 或疑難排解截圖。

fn-knock 會將識別到的用戶端 IP 一併交給 Turnstile 驗證。前方若有 CDN 或反向 Proxy，請先確認請求記錄中的用戶端 IP 正確。

## 常見失敗

| 現象 | 優先檢查 |
| --- | --- |
| Widget 未顯示 | Widget Hostname、瀏覽器能否連線至 Cloudflare、登入頁面是否已載入新設定 |
| 顯示設定尚未完成 | 兩組 Key 是否都已儲存、登入頁面是否仍沿用舊設定 |
| Widget 通過後仍然失敗 | `Secret key` 是否屬於同一個 Widget、Cloudflare Siteverify 連線能力、伺服器時間、網域與 Proxy 路徑 |
| 顯示 Token 為空或回應無效 | 瀏覽器是否送出 Widget 結果、反向 Proxy 是否改寫 Request Body |
| 在區域網路中看似未生效 | 私有網路來源可能觸發本地豁免；請改用行動網路驗證 |
| 只透過 IP 位址存取 | Hostname 驗證與 HTTPS Context 通常不適用 Turnstile；請改用網域 |

Cloudflare 驗證服務無法連線時，fn-knock 會拒絕本次身分驗證，而不是略過人機驗證。若網路對 Cloudflare 的連線不穩定，可切回不依賴第三方服務的 PoW。

Cloudflare 的 Widget Type 與後台介面可能變動，實際選項請以 [Turnstile 官方文件](https://developers.cloudflare.com/turnstile/get-started/)為準。

- [登入前的人機驗證](/zh-tw/guide/captcha)
- [身分驗證、工作階段與服務範圍](/zh-tw/guide/auth)
