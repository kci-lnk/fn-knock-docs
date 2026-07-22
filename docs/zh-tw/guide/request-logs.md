---
lang: zh-TW
title: "請求記錄"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: aa4b4677da4800f95014eb136d37d5fb3ac346ce024fde174ea86b03c77f555c
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 請求記錄

請求記錄會記下經過閘道的 HTTP Request，用來確認請求是否到達 fn-knock、命中哪個 Host 或路徑，以及最終轉送至何處。它不是登入記錄，也不會記下未進入閘道的原始連接埠連線。

請在 `系統設定 → 記錄` 啟用閘道請求記錄並設定保留週期，最少保留 1 天。Go 閘道會在 Runtime 目錄下的 `logs` 目錄，依日期寫入結構化 JSON 檔案；後台的 `請求記錄` 頁面則依日期讀取、搜尋並顯示詳細資訊。記錄功能會增加儲存空間與寫入負擔，完成疑難排解後，請依實際需求設定保留時間。

寫入作業採用非同步 Queue。設定頁面顯示累計捨棄數時，代表 Queue 曾經壅塞，部分請求未寫入磁碟；此數字不是遭閘道拒絕的請求數量。閘道因反向 Proxy Rate Limit 而直接中斷的請求，也不會寫入 Access Log。

## 解讀一筆記錄

| 欄位 | 用途 |
| --- | --- |
| 用戶端 IP／連線來源 IP | 比對真實訪客與閘道實際 TCP Peer，排查 CDN、反向 Proxy 與 Docker 連線路徑 |
| 方法、Host、路徑 | 判斷請求命中哪個服務 |
| 路由類型、上游 Target | 判斷 Host／路徑規則是否命中正確目標 |
| 驗證狀態 | 判斷結果來自工作階段、允許清單、本地豁免、進階驗證臨時憑據，或未授權 |
| 子網域規則組 ID／臨時憑據狀態 | 進階驗證命中時，確認實際規則組，以及憑據為已簽發、已續期或已重複使用 |
| Status Code、處理時間 | 區分閘道拒絕、上游錯誤與回應緩慢 |

請求記錄可能包含存取路徑、Query、來源 IP、User-Agent、驗證結果與上游 URL，應視為敏感維運資料處理。分享疑難排解片段前，請移除 Token、Query Parameter、內部 URL 與可識別個人的資訊。

## 建議的疑難排解順序

1. 從外網送出一次可重現問題的請求。
2. 搜尋對應的 Host 與路徑，確認請求是否到達閘道。
3. 比對用戶端 IP，確認沒有將 Proxy IP 誤認為訪客。
4. 檢查驗證狀態與存取原則。
5. 再檢查上游 Target、Status Code 與應用程式本身的 Log。

如果記錄中完全找不到請求，問題通常發生在 DNS、CDN、Tunnel、路由器或連接埠發布等更前端的環節；不要一開始就修改映射規則。

如果只有部分請求缺少記錄，請檢查閘道 Rate Limit 是否直接中斷連線，以及記錄設定頁面是否出現 Queue 捨棄警告。若 Status Code 來自閘道而非上游，請繼續檢查身分驗證、可見性、WAF 與映射；若已顯示正確的上游 Target，再轉往應用程式本身的 Log。

啟用子網域進階驗證後，驗證結果 `子網域規則放行` 代表請求透過進階驗證臨時憑據放行。詳細資訊中的規則組 ID 可用來定位觸發設定；憑據狀態為 `已簽發` 表示本次新建憑據，`已續期` 表示重新計算閒置有效期，`已重複使用` 表示繼續沿用既有憑據。規則行為請參閱[子網域進階驗證](/zh-tw/guide/advanced-auth)。

## 處理可疑 IP

確認為實際攻擊來源後，可從記錄直接前往全域封鎖清單或 IP 允許清單進行處置。操作前請先排除共用出口與前置 Proxy IP，並保留時間、Host、路徑等 Context。

- [安全邊界與基準設定](/zh-tw/guide/security)
- [全域封鎖清單](/zh-tw/guide/general-blacklist)
- [WAF](/zh-tw/guide/waf)
