---
lang: zh-TW
title: "登入前的人機驗證"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 616249dde81c98fe080acfd4f39420ef70ccbc85cb91f8bb71a2b3fb735ba654
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 登入前的人機驗證

人機驗證位於登入流程的最前端，用來減少自動化請求直接打到身分驗證介面。它不能取代登入憑證、IP 允許清單或 WAF。

請在 `系統設定 → Challenge` 選擇驗證方式並儲存。新的登入頁面會套用新設定；既有工作階段不會因此失效。

## 可選方式

| 方式 | 特性 | 適用情境 |
| --- | --- | --- |
| `PoW` | 由瀏覽器完成一次工作量證明，不依賴第三方服務 | 希望減少外部依賴，且可接受少量用戶端運算 |
| Cloudflare Turnstile | 由 Cloudflare 執行驗證 | 已使用 Cloudflare，且希望採用其託管式人機驗證 |

PoW 是預設的內建方案。瀏覽器取得 SHA-256 Challenge 後，會在本機計算 Proof；Challenge 有效期為 5 分鐘，且只能成功使用一次。頁面沒有難度調整選項，目前伺服器端提供的最大搜尋範圍為 100000。

選用 Turnstile 前，必須先在 Cloudflare 建立 Widget，再將 `site key` 與 `secret key` 填回 fn-knock。完整步驟請參閱 [Cloudflare Turnstile](/zh-tw/guide/cloudflare-turnstile)。

## 切換與儲存

請在 `系統設定 → Challenge` 選擇 PoW 或 Cloudflare Turnstile。選用 Turnstile 時，Site Key 與 Secret Key 必須同時填寫，否則前端與後端都會拒絕儲存。

Site Key 會下發至公開登入頁面，用來渲染驗證元件；Secret Key 只會保存在伺服器端，用來向 Cloudflare 驗證 Token。切回 PoW 後，既有的 Turnstile 參數仍會保留在設定中，之後重新選用時可直接沿用。

更換供應商不會銷毀已登入的工作階段，只會影響之後進入身分驗證流程的新請求。已開啟的登入頁面可能仍持有舊 Challenge，請重新整理頁面後再測試。

## 驗證方式的邊界

- 驗證只保護會經過 fn-knock 登入頁面的流量。
- 私有網路與本機來源預設享有本地豁免，不能用區域網路的結果判斷公網驗證是否正常。
- Turnstile 要求瀏覽器能夠存取 Cloudflare 的驗證資源；受限網路或攔截規則可能造成元件無法顯示或驗證失敗。
- 修改驗證方式後，請透過無痕視窗與行動網路完成一次完整登入。

## 疑難排解

1. 確認設定已儲存，再重新開啟登入頁面。
2. PoW 顯示已過期或已使用時，請重新整理頁面以取得新 Challenge；系統時間錯誤也會造成有效期限判斷異常。
3. 使用 Turnstile 時，請檢查 `site key`、`secret key`、Widget 的 Hostname 是否與實際登入網域一致。
4. 檢查登入網域是否已正確解析並使用 HTTPS。
5. 查看瀏覽器開發者主控台、請求記錄與事件中心中的錯誤訊息。

- [身分驗證、工作階段與服務範圍](/zh-tw/guide/auth)
- [Cloudflare Turnstile](/zh-tw/guide/cloudflare-turnstile)
