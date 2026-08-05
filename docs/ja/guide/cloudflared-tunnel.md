---
lang: ja-JP
title: "cloudflared による Cloudflare Tunnel"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: bff0db45d864b571554efb273368b024d0a2ba556678b1503ed9a5a32cc1ac9f
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# cloudflared による Cloudflare Tunnel

cloudflared は LAN 内から Cloudflare Tunnel へ接続し、外部リクエストを fn-knock ゲートウェイへ届けます。推奨するのは fn-knock の管理モードです。Cloudflare API Token を入力すると、Zone と Account の検出、Tunnel の作成または接続、ワイルドカード DNS と Ingress の管理、Tunnel Token の取得、cloudflared の起動まで自動化されます。通常の構成では、Cloudflare Dashboard で Public Hostname を一つずつ追加する必要はありません。

新規構築では `トンネル → サブドメインマッピング` を使用します。Cloudflare が元の Host を維持し、fn-knock が `auth.example.com`、`nas.example.com` などをローカルサービスへ振り分けます。パスモードは既存の単一ドメイン・パス入口を維持する場合だけ使用します。

## 準備

1. `システム設定 → Cloudflared` でリソースをダウンロードし、準備完了を確認します。
2. `システム設定 → モード` で `トンネル → サブドメインマッピング` を選びます。
3. ルートドメイン、認証サービス、1 件以上のサービスマッピングを保存します。
4. 対象の Account と Zone に限定した Cloudflare Account API Token を作成します。

### 推奨：Account API Token を作成する

Account API Token は個人ユーザーではなく Cloudflare Account に属します。作成者が Account から離れても、それだけで無効にならないため、fn-knock のような常時稼働サービスに適しています。作成には対象 Account の Super Administrator 権限が必要です。権限がない場合だけユーザー API Token を使用します。

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログインします。
2. `Manage Account → Account API Tokens` を開き、Zone を所有する Account を選びます。
3. `Create Token` からカスタム Token を作成し、たとえば `fn-knock Cloudflare Tunnel` と命名します。
4. 下記の Account／Zone 権限を追加します。
5. `Account Resources` では現在の Account だけを選び、`Zone Resources` では fn-knock のルートドメインを含む Zone だけを選びます。
6. 必要に応じて有効期限を設定します。Client IP 制限はデバイスの外向き公開 IP が固定の場合だけ使用してください。回線変更で Token が突然使えなくなることがあります。
7. `Continue to summary` で余分な権限やリソースがないことを確認し、`Create Token` を選びます。
8. Secret の表示は一度だけです。fn-knock の `API 接続` 欄へ直接コピーして接続し、文書、スクリーンショット、チャットへ保存しないでください。

現在の Dashboard 手順は Cloudflare の [Account API Token 公式ドキュメント](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/)を参照してください。ユーザー API Token は `My Profile → API Tokens` から作成できますが、個人アカウントのライフサイクルに従うため、長期運用より一時的なテスト向けです。

基本の管理構成には次の権限が必要です。

- `Account / Cloudflare Tunnel / Edit`
- `Zone / Zone / Read`
- `Zone / DNS / Edit`

最適化 Beta を有効にする場合は、さらに次が必要です。

- `Zone / SSL and Certificates / Edit`

Token はルートドメインを含む有効な Zone を読み取れる必要があります。ルートには Zone 自体だけでなく下位ドメインも指定できます。たとえば `tu.example.com` の場合、fn-knock は上位の `example.com` Zone も検索します。API Token と Account API Token の両方に対応しています。Global API Key や Token をスクリーンショット、Issue、公開ログに載せないでください。漏えいした Token は直ちにローテーションします。

## 管理モードの設定

`トンネル → Cloudflared` を開きます。すべてのセクションは折りたためます。実行状態とログは先頭にあり、デフォルトで展開されます。

### 1. Cloudflare に接続する

`API 接続` を展開し、API Token を貼り付けて接続します。成功すると検出した Zone が表示されます。その後の読み取り API から平文 Token が返ることはありません。

接続できない場合は、Zone の状態と Token のリソース範囲を確認します。Zone は読めても DNS 編集権限がない Token は、接続に成功してもプレビューまたは適用で失敗することがあります。

### 2. Tunnel を選ぶ

`Tunnel とドメイン同期` を展開します。

- `専用 Tunnel`：推奨。fn-knock がインスタンス識別子付きの Tunnel を作成し、自分の設定だけを管理します。
- `既存 Tunnel`：Cloudflare にあるリモート管理の Cloudflared Tunnel を再利用します。他の Ingress とその順序を維持し、fn-knock のワイルドカードルールを終端ルールの直前に配置します。

`プレビュー` を実行すると、作成、更新、維持される Tunnel、Ingress、DNS、最適化リソースが表示されます。プレビューの有効時間は 10 分です。適用前にリモート設定が変化した場合は、もう一度プレビューしてください。同名で fn-knock 所有ではないリソースは競合として表示され、個別に引き継ぎを承認した場合だけ変更されます。

基本構成は自動的に次を維持します。

```text
*.example.com  -> <tunnel-id>.cfargotunnel.com（プロキシ CNAME）
*.example.com  -> fn-knock 専用のローカル Tunnel 入口（Ingress）
最後のルール   -> HTTP 404
```

適用後、fn-knock は Cloudflare の公式 API から Tunnel Token を取得し、権限 `0600` の Token ファイルで cloudflared を起動します。プロセス引数に Token は現れません。

### 3. 外部アクセスを確認する

管理 Cloudflare Tunnel の公開 URL は標準 HTTPS です。

```text
https://auth.example.com/
https://nas.example.com/
```

末尾に `:7999` を付けないでください。古い公開 HTTPS ポートが設定に残っていても、Cloudflare Tunnel モードではサブドメイン一覧、認証 URL、ログインリダイレクトから省略されます。外部の `443` は Cloudflare が処理し、ローカル Tunnel 入口は fn-knock が自動管理します。

サービス Host を新たに保存した後も、ワイルドカード Tunnel ですぐに利用でき、Dashboard に Public Hostname を追加する必要はありません。最適化が有効な場合、完全一致ドメインのリソースはバックグラウンドで同期され、完了まではワイルドカード Tunnel が処理します。

## 最適化 Beta

最適化は現在のデバイスから Cloudflare Anycast IPv4 への実際の品質を測定し、Cloudflare for SaaS Custom Hostname で完全一致のサービスドメインに優先入口を重ねます。標準のワイルドカード Tunnel は常にフォールバックとして残ります。

### 有効化手順

1. `Tunnel とドメイン同期` で `最適化 Beta` を有効にします。
2. `プレビュー` を実行し、プラン機能、権限、変更、競合を確認します。
3. プレビューを適用します。「先に Cloudflare の同期プランで最適化を有効にしてください」と表示される場合、この手順が未完了です。
4. `最適化 Beta` を展開し、速度テストを実行します。
5. 推奨 IP、または検証済みの別候補を適用します。

fn-knock は隔離したホスト名で、現在の Zone における Custom Hostname、証明書発行、SNI 直接接続を先に検証します。対応していない場合は最適化だけを無効にし、基本 Tunnel には影響しません。

### 候補の取得元

候補は次から取得できます。

- Cloudflare 公式 IPv4 範囲の決定的サンプリング。
- 組み込み公開ホスト名：スウェーデン政府 `www.gov.se`、米国議会図書館 `www.loc.gov`、ICANN `www.icann.org`、Visa `www.visa.com`。
- ユーザー定義の公開候補ホスト名（最大 16 件）。

公開ホスト名は Cloudflare IPv4 候補の検出だけに使われます。サービス CNAME をこれらへ向けたり、これらの Host / SNI で業務トラフィックを送ったりしません。無効、プライベート、一般的な Fake IP は除外されます。ローカル DNS が Fake IP モードの場合は、実際の解析結果を返せる別の取得元を追加してください。

IP レジストリや GeoIP に「米国」と表示されても、通信が米国へ到達したとは限りません。Cloudflare IPv4 は Anycast で、同じ IP が複数のエッジ拠点から広告されます。結果の `Cloudflare コロケーション` は実際のプローブで得た `CF-Ray` の末尾（`SIN`、`HKG` など）であり、その接続の到達地点をより正確に表します。

### 測定と切り替え

1 回の測定は最大 128 候補、同時実行 32 です。各候補に 3 回の TLS／遅延プローブを行い、上位 8 候補には 1 MiB ダウンロードを 2 回実施します。総ダウンロード量は 20 MiB 以下です。スコアは低いほど良好です。

```text
遅延中央値 + 2 × ジッター + 1500 × 損失率 + 800 / max(ダウンロード Mbps, 1)
```

候補は実際のサービス Host に対する TLS、SNI、Cloudflare エラーページ検査にも合格する必要があります。ping や IP の所在地だけでは適用できません。自動ポリシーは 7 日ごとに再測定し、現在の IP を 15 分ごとに確認します。新候補は 15% 以上改善し、10 分間隔の 2 回の確認で優位を維持した後に切り替わります。

現在の IP が連続して失敗すると、検証済み候補を優先します。候補がない場合は fn-knock 所有の完全一致 CNAME を削除し、ドメインをワイルドカード Tunnel に戻します。いつでも `標準 Tunnel に戻す` を選択できます。

### プランと安全上の境界

最適化には Cloudflare for SaaS Custom Hostname が必要です。利用可否と数量は Zone の実際のプランとクォータに従います。超過したサービスドメインは標準 Tunnel を使います。Custom Hostname と証明書の両方が Active になるまで完全一致 CNAME は公開されません。

プロキシ状態のサービス A レコードを Cloudflare エッジ IP へ直接向けないでください。Cloudflare Error 1000 の原因になります。fn-knock は Custom Hostname、専用オリジンホスト、DNS-only の最適化入口を組み合わせ、機能プローブに失敗した場合はワイルドカード Tunnel を維持します。

## クライアント IP とログインリダイレクト

管理モードはループバックだけで待ち受ける専用 Tunnel 入口を使います。ゲートウェイが Cloudflare の `CF-Connecting-IP` を信頼するのはこの管理経路だけで、訪問者が送信した `X-Forwarded-For` は信頼しません。EdgeOne / ESA の実クライアント IP 設定は Cloudflared には適用されず、現在のモードで利用できない場合は非表示になります。

モバイル回線からログインが必要なサービス Host を開き、リクエストログで次を確認します。

- リダイレクトが `https://auth.example.com/...` で、`:7999` を含まない。
- `redirect_uri` が元のサービス Host で、`:7999` を含まない。
- クライアント IP が訪問者の公開 IP であり、`127.0.0.1`、コンテナ IP、任意の `X-Forwarded-For` ではない。

## 手動 Tunnel Token モード

上級者は `手動 Tunnel Token` を展開し、Cloudflare で取得した Tunnel Token と転送プロトコルを設定できます。`自動`は QUIC を先に試し、失敗すると HTTP/2 へ戻ります。UDP `7844` が明確にブロックされている場合だけ HTTP/2 に固定してください。

手動モードでは Tunnel、DNS、Ingress は作成されません。Cloudflare で Public Hostname とオリジン Service を自分で設定します。独自プロセスや Windows 版も手動構成であり、実際のゲートウェイポートをオリジンにできますが、インストール、Token、ログ、ライフサイクルは管理モードの対象外です。

## 切断とクリーンアップ

API Token を削除しても、今後のリモート管理が止まるだけで Cloudflare リソースは削除されません。`管理リソースを削除` からクリーンアップをプレビューして確認します。

- 既存 Tunnel が自動削除されることはありません。
- fn-knock が作成した専用 Tunnel も明示的な確認後だけ削除されます。
- 最適化リソースの削除時は、完全一致サービスドメインを先にワイルドカード Tunnel へ戻します。

## トラブルシューティング

| 症状 | 最初に確認する項目 |
| --- | --- |
| Zone が見つからない、または無効 | Token の Account／Zone 範囲にルートを含む有効な Zone があるか |
| DNS Edit が必要と表示される | 対象 Zone に `Zone / DNS / Edit` があるか |
| DNS tag クォータが 0 | comment のみの所有情報に対応した版へ更新して再プレビューし、重複レコードを手作業で作らない |
| プレビュー後の適用が 409 | リモート状態またはローカルのルートが変化したため再プレビューする |
| Tunnel はオンラインだがドメインが使えない | 同期競合、ワイルドカード DNS、Ingress、Cloudflared ログ、Host マッピング |
| リダイレクトに `:7999` が残る | `トンネル → サブドメインマッピング`、既定 Tunnel が Cloudflared、標準ポート対応版であること |
| 最適化を有効にできない | SSL 権限、Cloudflare for SaaS、Custom Hostname クォータ、機能プローブ |
| IP 所在地が米国 | スキャンの Cloudflare 拠点コードを確認する。Anycast の登録地は接続先ではない |
| すべてローカルアクセスに見える | リクエストログのクライアント IP と、誤った手動オリジンではなく専用管理入口を使っているか |

全体の実行状態は[トンネル](/ja/guide/tunnel)、Host 設定は[サブドメインマッピング](/ja/guide/subdomain-proxy)を参照してください。
