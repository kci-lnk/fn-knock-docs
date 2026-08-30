---
lang: zh-TW
title: "靜態檔案與目錄回應"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2c754fabb62c6c787287d338960000098393c7294baaec65a6d51dcbd32fa454
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 靜態檔案與目錄回應

Host 映射不必經過反向代理，可直接使用 fn-knock 閘道所在檔案系統中的單一檔案或目錄回應請求。此功能適合發佈下載檔案、靜態文件、小型站台或唯讀檔案目錄，不必另外執行 Web Server。

靜態回應仍是完整的 Host 路由：`要求登入`、進階驗證、閘道可見性、WAF、排程開放、請求記錄與閘道節流，都會在讀取檔案前生效。它不提供伺服器端 Rewrite 或單頁應用程式（SPA）Fallback；若需要讓任何未知路徑都回傳 `index.html`，應繼續使用支援此功能的上游 Web Server。

## 選擇回應類型

新增或編輯服務 Host 時，請在 `回應類型` 中選擇：

| 回應類型 | 請求行為 | 常見用途 |
| --- | --- | --- |
| `反向代理` | 將請求轉送至 HTTP、HTTPS 或 WebSocket Target | 動態 Web 應用程式與 API |
| `單一檔案` | 只在目前 Host 的根路徑 `/` 回傳指定檔案 | 下載入口、說明文件、固定資源 |
| `目錄` | 將 URL 路徑映射至指定目錄中的檔案與子目錄 | 靜態站台、文件與檔案瀏覽 |

從反向代理切換至靜態回應時，頁面會要求確認，並清除僅屬於代理的 Target、路徑回應、上游 Basic Auth、保留 Host 與目標路徑模式。Host 的驗證、可見性、WAF、開放時段、標題、圖示與分組都會保留。在關閉編輯視窗前切回反向代理，可還原本次尚未儲存的代理草稿。

靜態映射不會從檔案內容自動擷取標題或圖示。若希望在傳送門、映射清單或書籤中顯示友善名稱，請手動填入 `顯示標題` 並上傳自訂圖示。

## 設定步驟

1. 使用 `子網域模式` 或 `內網穿透 → 子網域映射`，並確保服務 Host 已進入 fn-knock 閘道。
2. 在 `子網域映射` 中新增或編輯服務 Host，選擇 `單一檔案` 或 `目錄`。
3. 在 `伺服器路徑` 中填入 fn-knock Runtime 環境內的絕對路徑，而不是目前瀏覽器所在電腦上的路徑。
4. 按下 `檢查路徑`，確認路徑存在、類型相符，且閘道處理程序可以讀取。
5. 目錄回應可視需要調整預設文件、目錄列表與 README 轉譯。
6. 設定 `要求登入`、閘道可見性、WAF、開放時段、標題與圖示，然後儲存。
7. 從實際存取路徑請求根路徑、一個檔案與一個不存在的路徑，並在[請求分析](/zh-tw/guide/request-logs)中核對路由類型與 Status Code。

`檢查路徑` 是即時檢查，不會鎖定檔案或掛載點。新增靜態映射，或修改伺服器路徑、回應類型時，儲存作業也會探測路徑；只調整目錄選項時不會重複探測。即使儲存時檢查通過，之後路徑仍可能遭到刪除、取代或失去讀取權限；閘道會在每次請求時重新開啟並驗證。

## 單一檔案回應

單一檔案映射只會回應 Host 根路徑：

```text
download.example.com/        -> /srv/downloads/manual.pdf
download.example.com/other   -> 404
```

閘道會依伺服器檔案名稱的副檔名設定 `Content-Type`，並支援 `GET`、`HEAD`、Range Request 與常見的條件式快取請求。檔案內容變更後，`ETag` 與修改時間會隨檔案狀態更新。URL 不需要包含伺服器檔案名稱；Query Parameter 也不會改變所選檔案。

## 目錄回應

目錄映射會將請求路徑逐層映射至設定的根目錄：

```text
docs.example.com/                 -> /srv/docs/
docs.example.com/assets/app.css   -> /srv/docs/assets/app.css
docs.example.com/manual/          -> /srv/docs/manual/
```

請求命中目錄，但 URL 結尾沒有 `/` 時，閘道會永久重新導向至含斜線的標準位址；請求命中一般檔案，但 URL 結尾多了 `/` 時，則會永久重新導向至移除斜線的位址。兩種重新導向都會保留 Query Parameter。進入目錄後，會依設定順序尋找預設文件；初始順序為 `index.html`、`index.htm`，最多可設定 `16` 個。名稱只能是可見的單一檔案名稱，不可包含路徑分隔符號；清空清單會停用預設文件搜尋。

找不到預設文件時：

- `目錄列表` 關閉：回傳 `404`；
- `目錄列表` 開啟：產生目前目錄的檔案清單；
- `轉譯 README.md` 只可在目錄列表開啟時使用，並會在清單下方安全轉譯目前目錄中的 `README.md`。

目錄列表預設依名稱排序，並一律將目錄排在一般檔案之前。頁面可依名稱、大小或修改時間切換升冪與降冪排序，並提供麵包屑導覽、明暗主題及前後翻頁；每頁最多顯示 `100` 個項目。索引介面目前使用英文標籤，修改時間固定依北京時間（UTC+8）顯示。它不會顯示隱藏名稱、特殊檔案或無法安全開啟的項目。

README 使用 GitHub Flavored Markdown，單一檔案大小上限為 `1 MiB`。原始 HTML 與不安全內容會被過濾；圖片只允許同源相對位址，外部連結則會加上安全屬性。只有在未命中預設文件，且實際顯示目錄列表時才會轉譯 README。

目錄回應不會執行副檔名 Rewrite、動態壓縮、尾端路徑 Fallback 或 SPA History Fallback，也沒有可為靜態目標設定自訂 Response Header 或快取原則的入口。請求的檔案不存在時，會直接回傳 `404`。

## 驗證、WAF、記錄與快取

靜態 Host 與反向代理 Host 使用相同的 Inbound 原則：

- `要求登入` 與進階驗證會在讀取檔案前檢查；區域網路來源仍可能命中 `local_exempt`，公網原則應從真實外部網路驗證。
- 閘道可見性、通用封鎖清單、掃描攔截、反向代理節流與開放時段都會繼續生效。
- 目前 Host 的 `啟用 WAF` 已開啟，且全域 WAF 也已啟用時，請求會先經過 WAF，再讀取靜態內容。
- 請求記錄與 WAF 記錄會將路由類型分別記為 `靜態檔案` 或 `靜態目錄`，上游 Target 為空；記錄不會寫入伺服器檔案系統路徑。

公開靜態檔案採用需要重新驗證的公用快取原則。需要驗證或已帶有驗證結果的回應則使用 `private, no-store`，避免受保護內容進入共享 Cache。產生的目錄列表、重新導向與錯誤回應也不會進入公用 Cache。

## 檔案系統安全邊界

`伺服器路徑` 必須是絕對路徑，並指向可見的一般檔案或目錄。閘道會拒絕檔案系統根目錄、隱藏目標、上層目錄穿越、控制字元、Windows UNC／裝置 Namespace，以及與 fn-knock 設定、資料、記錄、金鑰或系統目錄重疊的路徑。過於寬泛、會涵蓋受保護目錄的上層目錄也會遭到拒絕。

目錄內只會回應可見的一般檔案與子目錄；Dotfile、Dot Directory 與 `.well-known` 都無法使用。Symbolic Link 必須在靜態根目錄內解析至安全目標；若逸出根目錄、進入隱藏位置，或在驗證期間發生變化，請求就會失敗。FIFO、Socket、Device File 等特殊類型不會作為下載內容開啟。

這些限制無法判斷業務內容是否適合公開。仍應為每個站台準備獨立的最小目錄、使用唯讀權限，並避免將備份、環境變數、私密金鑰、資料庫或應用程式設定複製至靜態根目錄。公開目錄列表前，應先檢查所有子目錄，以及 README 中的連結與圖片。

## Docker 與平台路徑

路徑一律從 fn-knock 處理程序的視角解讀：

- Docker 必須先將 Host 內容唯讀掛載至 Container，再填入 Container 內的路徑；無法直接使用 Host 路徑本身。
- Linux、macOS、OpenWrt、飛牛 FPK / Lite 與 Synology 都需要讓對應軟體套件帳號具備目錄 Traversal 與檔案讀取權限。
- Windows 使用本機磁碟機的絕對路徑，例如 `C:\Sites\docs`；不支援網路共享路徑與裝置 Namespace。

Docker Compose 範例：

```yaml
services:
  fn-knock:
    volumes:
      - /srv/public-site:/srv/public-site:ro
```

管理後台的目錄路徑請填入 `/srv/public-site`。修改掛載後重新建立 Container，再執行 `檢查路徑`。請勿為了讀取靜態內容，而將 Host 根目錄、`/etc` 或 fn-knock Data Volume 整體掛載至 Container。

靜態映射只會讀取既有檔案，不會建立 DNS Record、開放防火牆連接埠或變更 Container 掛載。外部可達性仍取決於目前部署平台的閘道入口、DNS、憑證、路由器或 Tunnel。

## Status Code 與疑難排解

| 現象 | 檢查項目 |
| --- | --- |
| 儲存時提示路徑無法使用 | 絕對路徑、檔案／目錄類型、讀取權限、受保護路徑與 Docker 掛載 |
| 根路徑回傳 `503` | 設定的根目錄或單一檔案目前不存在、無法讀取或已不再安全；回應會帶有短暫重試提示 |
| 子路徑回傳 `404` | 檔案不存在、名稱遭安全規則隱藏、目錄列表已關閉，或單一檔案映射收到非根路徑 |
| 回傳 `405` | 靜態回應只接受 `GET` 與 `HEAD` |
| 目錄顯示列表而非站台首頁 | 預設文件名稱或優先順序不正確，或對應檔案無法讀取 |
| 重新整理頁面後前端路由回傳 `404` | 靜態目錄沒有 SPA Fallback；請改用支援 History Fallback 的上游 Web Server |
| 請求記錄沒有上游位址 | 靜態回應由閘道直接讀取檔案，這是預期行為 |

疑難排解時，請先在編輯視窗重新執行 `檢查路徑`，再從 fn-knock Runtime 環境確認權限與掛載，最後查看請求記錄中的 Host、路由類型、驗證結果、WAF 動作與 Status Code。請勿擴大至系統目錄，或授予不必要的 root 權限來繞過路徑檢查。

相關設定請參閱[子網域映射](/zh-tw/guide/subdomain-proxy)、[Docker Compose 部署](/zh-tw/quick-start/docker-deployment)、[WAF](/zh-tw/guide/waf)與[安全邊界與基準設定](/zh-tw/guide/security)。
