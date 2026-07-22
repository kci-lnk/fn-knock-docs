---
lang: zh-TW
title: "Cloudflare DDNS"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 8cd64a630840b5b0f7efad9c106a1050b28fdd690c812b9d13d53ec3967cce27
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Cloudflare DDNS

Cloudflare DDNS 透過 API Token 更新指定 Zone 內的 DNS Record。由於 Token 能修改 Record，請只授予目標 Zone 所需的最低 DNS 權限，並比照密碼妥善保存。

## 建立 Token

1. 在 Cloudflare 的 API Tokens 頁面建立 Token，選用或以「Edit zone DNS」範本為基礎建立。
2. 將權限範圍限制在目標 Zone；不要使用 Global API Key。
3. 如有需要，可使用 Cloudflare 提供的 Token 驗證指令確認其狀態。
4. Token 只應填入 fn-knock 的 DDNS 憑證欄位，不要放進螢幕截圖、Log 或公開設定檔。

Cloudflare 的 Token 頁面與權限名稱可能調整，請以 [Token 官方文件](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)為準。

## 在 fn-knock 中設定

在 `動態網域` 中選擇 Cloudflare，並填寫：

| 欄位 | 說明 |
| --- | --- |
| `API Token` | 具備目標 Zone DNS 編輯權限的 Token |
| `Zone ID` | Cloudflare Zone Overview 中顯示的 ID，不是 Zone 名稱 |
| `網域` | 要維護的完整 DNS 名稱；支援單一名稱，或根網域搭配萬用字元網域 |
| `Proxied` | `DNS only` 或 `Orange cloud` |

網域請填寫 `auth.example.com` 這類 DNS 名稱，不要包含 `https://`、路徑或連接埠。設定根網域與萬用字元網域配對時，例如 `example.com` 與 `*.example.com`，fn-knock 會分別更新兩筆 Record，並先透過 Cloudflare API 確認根網域隸屬於所填的 Zone ID。

請依實際網路環境選擇 IPv4、IPv6 或雙協定棧。儲存後先在頁面執行測試，再到 Cloudflare DNS 清單確認 Record Type、名稱與位址。

更新時，fn-knock 會依網域與 Record Type 尋找既有 Record：

- IPv4 對應 `A`；
- IPv6 對應 `AAAA`；
- 找到 Record 時更新，找不到時建立；
- TTL 使用 Cloudflare 的自動值；
- 雙協定棧的 A 與 AAAA 會分別執行，任一項失敗都會記錄在 Log 中。

Zone ID、Token 或網域不相符時，測試會在實際改寫 Record 前回報錯誤。不要用同一個 Zone ID 更新另一個根網域。

## Proxy 狀態

Cloudflare 的「Proxied」狀態會改變連線路徑。閘道使用非標準連接埠或需要直接連回 Origin 時，通常應先選用 DNS only；能否啟用 Proxy，取決於 Cloudflare 支援的連接埠、SSL 模式與目前的服務類型。DDNS 並不強制要求開啟「橘雲」。

開啟橘雲後，外部 DNS 查詢會回傳 Cloudflare Edge IP，而不是家用網路的公網 IP；這是正常行為。此時必須另外設定真實用戶端 IP、Cloudflare SSL 模式、Origin 連接埠與快取規則。若只想用 Cloudflare 託管動態 DNS，選擇 `DNS only` 會比較容易除錯。

## 測試失敗

| 錯誤類型 | 檢查項目 |
| --- | --- |
| Zone 查詢失敗 | Token 是否有效、Zone ID 是否正確、伺服器能否連線至 Cloudflare API |
| Zone 不相符 | 根網域是否確實隸屬於該 Zone，或是否誤填其他帳號／Zone 的 ID |
| 尋找 Record 失敗 | Token 是否具備 Zone DNS Read/Edit 權限、Cloudflare API 是否觸發 Rate Limit |
| 建立或更新失敗 | Record Type 衝突、同名 CNAME、Proxy 狀態限制，以及 API 回傳的詳細資訊 |

DDNS 更新成功後仍需驗證：網域可正常解析、公網能連到入口、TLS 憑證相符，而且請求最終確實由 fn-knock 處理。另可參考 Cloudflare 的[動態 DNS 文件](https://developers.cloudflare.com/dns/manage-dns-records/how-to/managing-dynamic-ip-addresses/)。

- [DDNS 管理](/zh-tw/guide/ddns)
- [憑證與 HTTPS](/zh-tw/guide/ssl)
