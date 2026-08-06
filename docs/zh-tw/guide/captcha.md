---
lang: zh-TW
title: "登入前的人機驗證"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: b888d7d3c8efcde6d1418cab1260153f38eff61a8e203ed832c2d68125796c4a
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

PoW 是預設的內建方案。瀏覽器取得 SHA-256 Challenge 後，會在本機計算 Proof；Challenge 有效期為 5 分鐘，且只能成功使用一次。

## PoW 難度

PoW 提供兩個預設值：`標準` 的搜尋上限為 `100000`，`很難` 為 `300000`。從舊版本升級後，如果已儲存其他有效數值，頁面會顯示為自訂值。伺服器接受 `10000`～`1000000`、步長為 `10000` 的整數。

搜尋上限越高，用戶端平均運算量越大，但實際時間仍取決於裝置、瀏覽器與隨機命中位置。提高難度會增加自動化請求成本，也可能明顯影響低效能手機、舊裝置或省電模式下的登入體驗。修改後請分別使用常用桌面端與行動裝置測試。

開啟 `不常用地提高難度` 後，系統會依最近 7 天成功通過驗證的公網 IP，自動學習常用地區：

- 已定位且命中常用地區時使用基礎難度；
- 已定位但不在常用地區時使用不常用地難度；
- 私有網路、本機位址、定位未知或樣本模型尚未形成時，仍使用基礎難度。

不常用地難度不得低於基礎難度。此功能不會依帳號建立固定的「信任位置」清單，也不會直接拒絕新地區，只會提高對應 PoW Challenge 的運算成本。旅行、ISP 出口變更或 IP 定位誤差都可能觸發較高難度；若登入體驗異常，可先關閉此選項，而不是降低其他驗證或存取控制。

選用 Turnstile 前，必須先在 Cloudflare 建立 Widget，再將 `site key` 與 `secret key` 填回 fn-knock。完整步驟請參閱 [Cloudflare Turnstile](/zh-tw/guide/cloudflare-turnstile)。

## 切換與儲存

請在 `系統設定 → Challenge` 選擇 PoW 或 Cloudflare Turnstile。選用 PoW 時先設定基礎難度，並視需要開啟不常用地難度；選用 Turnstile 時，Site Key 與 Secret Key 必須同時填寫，否則前端與後端都會拒絕儲存。

Site Key 會下發至公開登入頁面，用來渲染驗證元件；Secret Key 只會保存在伺服器端，用來向 Cloudflare 驗證 Token。切回 PoW 後，既有的 Turnstile 參數仍會保留在設定中，之後重新選用時可直接沿用。

更換供應商不會銷毀已登入的工作階段，只會影響之後進入身分驗證流程的新請求。已開啟的登入頁面可能仍持有舊 Challenge，請重新整理頁面後再測試。

## 驗證方式的邊界

- 驗證只保護會經過 fn-knock 登入頁面的流量。
- 私有網路與本機來源預設享有本地豁免，不能用區域網路的結果判斷公網驗證是否正常。
- Turnstile 要求瀏覽器能夠存取 Cloudflare 的驗證資源；受限網路或攔截規則可能造成元件無法顯示或驗證失敗。
- 修改驗證方式後，請透過無痕視窗與行動網路完成一次完整登入。

## 疑難排解

1. 確認設定已儲存，再重新開啟登入頁面。
2. PoW 顯示已過期或已使用時，請重新整理頁面以取得新 Challenge；系統時間錯誤也會造成有效期限判斷異常。只有在新地區運算過慢時，請檢查不常用地難度。
3. 使用 Turnstile 時，請檢查 `site key`、`secret key`、Widget 的 Hostname 是否與實際登入網域一致。
4. 檢查登入網域是否已正確解析並使用 HTTPS。
5. 查看瀏覽器開發者主控台、請求記錄與事件中心中的錯誤訊息。

- [身分驗證、工作階段與服務範圍](/zh-tw/guide/auth)
- [Cloudflare Turnstile](/zh-tw/guide/cloudflare-turnstile)
