---
lang: ja-JP
title: "Cloudflare DDNS"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 8cd64a630840b5b0f7efad9c106a1050b28fdd690c812b9d13d53ec3967cce27
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Cloudflare DDNS

Cloudflare DDNS は API トークンを使い、指定した Zone の DNS レコードを更新します。トークンにはレコードを変更する権限があるため、対象 Zone に必要な最小限の DNS 権限だけを付与し、パスワードと同様に安全に保管してください。

## トークンの作成

1. Cloudflare の API Tokens ページでトークンを作成し、「Edit zone DNS」テンプレートを選ぶか、それを基に作成します。
2. 権限の対象を目的の Zone に限定します。Global API Key は使用しないでください。
3. 必要に応じて、Cloudflare が案内するトークン検証コマンドで状態を確認します。
4. トークンは fn-knock の DDNS 認証情報にだけ入力し、スクリーンショット、ログ、公開設定ファイルには記載しないでください。

Cloudflare のトークン画面や権限名は変更されることがあります。[公式トークンドキュメント](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)で最新の手順を確認してください。

## fn-knock での設定

`DDNS 管理` で Cloudflare を選び、次の項目を入力します。

| 項目 | 説明 |
| --- | --- |
| `API トークン` | 対象 Zone の DNS 編集権限を持つトークン |
| `Zone ID` | Cloudflare の Zone 概要に表示される ID。Zone 名ではありません |
| `ドメイン` | 管理する完全な DNS 名。単一の名前、またはベースドメインとワイルドカードドメインの組み合わせに対応 |
| `Cloudflare プロキシ` | `DNS のみ` または `プロキシ有効` |

ドメインには `auth.example.com` のような DNS 名を入力し、`https://`、パス、ポートは付けません。`example.com` と `*.example.com` のように、ベースドメインとワイルドカードドメインを組み合わせて設定すると、fn-knock は 2 つのレコードを個別に更新します。その前に Cloudflare API を使い、ベースドメインが入力した Zone ID に属していることも確認します。

実際のネットワークに合わせて IPv4、IPv6、またはデュアルスタックを選びます。保存後はまず画面上でテストを実行し、その後 Cloudflare の DNS 一覧でレコード種別、名前、アドレスを確認してください。

更新時、fn-knock はドメイン名とレコード種別を使って既存レコードを検索します。

- IPv4 は `A` に対応します。
- IPv6 は `AAAA` に対応します。
- レコードが見つかれば更新し、なければ作成します。
- TTL には Cloudflare の自動値を使用します。
- デュアルスタックでは A と AAAA を別々に処理し、どちらかが失敗するとログに記録されます。

Zone ID、トークン、ドメインが一致しない場合、実際にレコードを書き換える前にテストでエラーになります。同じ Zone ID を使って、別のルートドメインを更新しないでください。

## プロキシの状態

Cloudflare の「プロキシ有効」はアクセス経路を変えます。ゲートウェイが標準外ポートを使う場合やオリジンへ直接接続する必要がある場合は、通常はまず「DNS のみ」を使ってください。プロキシを利用できるかどうかは、Cloudflare が対応するポート、SSL モード、サービスの種類によって異なります。「オレンジ色の雲」は DDNS に必須の設定ではありません。

プロキシを有効にすると、外部からの DNS 問い合わせには家庭回線のグローバル IP ではなく、Cloudflare エッジのアドレスが返ります。これは正常な動作です。この場合、実クライアント IP、Cloudflare の SSL モード、オリジン接続ポート、キャッシュルールを別途設定する必要があります。Cloudflare で Dynamic DNS だけを管理したい場合は、`DNS のみ` の方がトラブルシューティングしやすくなります。

## テストに失敗する場合

| エラーの種類 | 確認する項目 |
| --- | --- |
| Zone の検索に失敗 | トークンが有効か、Zone ID が正しいか、サーバーから Cloudflare API へ接続できるか |
| Zone が一致しない | ドメインのルートがその Zone に属しているか、別のアカウントや Zone の ID を入力していないか |
| レコードの検索に失敗 | トークンに Zone DNS Read/Edit 権限があるか、Cloudflare API のレート制限を受けていないか |
| 作成または更新に失敗 | レコード種別の競合、同名の CNAME、プロキシ状態の制限、API レスポンスの詳細 |

DDNS の更新に成功した後も、ドメインを名前解決できること、外部ネットワークから入口へ到達できること、TLS 証明書が一致すること、最終的に fn-knock がリクエストを処理していることを確認してください。Cloudflare には [Dynamic DNS の参考資料](https://developers.cloudflare.com/dns/manage-dns-records/how-to/managing-dynamic-ip-addresses/)があります。

- [DDNS 管理](/ja/guide/ddns)
- [TLS 証明書と HTTPS](/ja/guide/ssl)
