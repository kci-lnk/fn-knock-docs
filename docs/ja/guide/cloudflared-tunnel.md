---
lang: ja-JP
title: "cloudflared による Cloudflare Tunnel"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: eec0d64b8afa9b973302d46c06e9eba28248e07035de9d98c29f37c41e520c0e
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# cloudflared による Cloudflare Tunnel

cloudflared は LAN 内から Cloudflare Tunnel へ外向きに接続し、Public Hostname へのリクエストを fn-knock ゲートウェイへ届けます。fn-knock が管理するのは、cloudflared の実行ファイル、Tunnel Token、トランスポートプロトコル、プロセスだけです。ドメインとオリジンの Service は引き続き Cloudflare Dashboard で設定します。

新規構築では `リバースプロキシモード → サブドメインマッピング` を使用し、Cloudflare で Host を維持して、fn-knock から Host ごとに振り分けます。パスモードは、既存の単一ドメインを使ったパス入口との互換性が必要な場合にだけ使用します。

Synology DSM 7 SPK には、Cloudflared リソース、Token、プロセスを管理する機能が組み込まれています。Windows x86_64 ではこれらの機能を利用できないため、このページのシステム設定手順は適用されません。同じ Windows ホストで cloudflared を自分で実行する場合は、Service を `http://127.0.0.1:7999` へ向け、プロセス、ログ、更新を別途管理してください。

## 1. リソースと Tunnel の準備

1. `システム設定 → その他のリソース → Cloudflared` でリソースをダウンロードし、状態が `準備完了` になっていることを確認します。
2. [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/) を開き、`Networks → Tunnels` へ進みます。
3. Cloudflared Tunnel を新規作成し、インストール画面で `--token` の後にある長い文字列をコピーします。
4. `トンネル → Cloudflared` に戻り、Token を貼り付けます。インストールコマンド全体を貼り付けても構いません。画面が Token の抽出を試みます。
5. トランスポートプロトコルには `自動（推奨）` を優先します。最初に QUIC を試し、失敗すると HTTP/2 へフォールバックします。UDP `7844` が明確にブロックされている場合にだけ HTTP/2 へ固定してください。
6. 保存して起動し、状態とログに Tunnel の接続が表示されることを確認します。

Token はトンネルへ接続するための認証情報です。パスワードと同様に保管し、スクリーンショットや公開ログには含めないでください。

## 2. Host ルートの設定

先に fn-knock でルートドメイン、認証サービス、サービス用 Host を保存します。例：

```text
auth.example.com  -> 認証サービス
nas.example.com   -> http://127.0.0.1:5666
alist.example.com -> http://127.0.0.1:5244
```

次に、Tunnel の Public Hostname を設定します。

```text
Public Hostname  *.example.com
Service          http://127.0.0.1:7999
```

実際のゲートウェイポートが `7999` でない場合は、管理画面に表示されるポートを使用します。ワイルドカードの Public Hostname は各サービス用 Host を同じゲートウェイへ届け、実際の転送先はローカルの Host マッピングが決定します。

Cloudflared Tunnel によって Cloudflare から LAN 内までの通信がすでに保護されている場合は、ローカルのオリジン接続に HTTP を使うのが最も簡単です。HTTPS でオリジンへ接続する必要がある場合は、次の節に従って証明書を設定してください。

## 3. HTTPS でのオリジン接続

ゲートウェイで HTTPS が有効な場合、Service は次のように指定できます。

```text
https://localhost:7999
```

cloudflared はオリジン証明書を検証します。自己署名証明書を使っている場合や、証明書に `localhost` が含まれていない場合、ログに次のエラーが記録されることがあります。

```text
certificate is valid for nas.example.com, not localhost
```

これは Tunnel からオリジンへ到達できているものの、検証対象のホスト名と証明書が一致していないことを示します。次のいずれかで対処します。

- Origin Server Name に、証明書がカバーするドメインを指定する。
- リスクを明確に理解したうえで、そのオリジンの TLS 検証を無効にする。
- `http://127.0.0.1:7999` へ戻し、外部向け HTTPS を Cloudflare に任せる。

検証を無効にしても証明書が修復されるわけではなく、検証を停止するだけです。証明書の管理については、[TLS 証明書](/ja/guide/ssl)を参照してください。

## パスモードの互換設定

`https://home.example.com/alist` のような既存 URL がある場合は、`リバースプロキシモード → パスモード` で単一の Public Hostname を維持できます。

```text
Public Hostname  home.example.com
Service          http://127.0.0.1:7999
```

Cloudflare はリクエストをゲートウェイへ届けるだけで、パスの振り分けは引き続き fn-knock が行います。Cloudflare と fn-knock の両方で、互いに競合するパス書き換えを管理しないでください。

## クライアント IP と `local_exempt`

ログインと IP 許可リストの判定には、ゲートウェイが識別したクライアント IP が使われます。プライベートネットワーク、ループバック、リンクローカルの送信元は `local_exempt` となり、通常のログインと既存の厳格な許可リストルールの確認をスキップします。

cloudflared からローカルホストへの接続自体はループバックアドレスから届くため、トンネル経由のサブドメイン経路では Cloudflare が渡す利用者情報を正しく使う必要があります。設定後にモバイル回線からアクセスし、fn-knock のリクエストログに `127.0.0.1` やコンテナのアドレスではなく、利用者のグローバル IP が記録されていることを確認してください。EdgeOne / ESA 用の実クライアント IP 設定は Cloudflared には適用されません。

## プラットフォームごとの制約

- Cloudflared は外向きに接続するプロセスなので、fn-knock がホストのファイアウォールを管理する必要はありません。Docker でも利用できます。
- 実行環境には、アーキテクチャが一致する Cloudflared リソースが必要です。リソース画面が準備完了でなければ、Token を保存しても起動できません。
- Docker 内の `127.0.0.1` は現在のコンテナだけを指します。Cloudflared を別のコンテナで実行する場合、Service には fn-knock のコンテナサービス名とポートを指定してください。
- Synology DSM 7 SPK はアプリ内 Cloudflared に対応しています。管理画面には DSM デスクトップのパッケージ入口から入り、ゲートウェイへのオリジン接続には実際のポート `7999` を使用します。
- Windows にはアプリ内 Cloudflared リソース画面がありません。別途実行するクライアントは fn-knock の管理対象外です。
- fn-knock は Cloudflare DNS、Tunnel、Public Hostname、キャッシュルール、Origin Request 設定を作成しません。

## トラブルシューティング

1. **プロセスが起動しない**：リソースの状態、Token、トランスポートプロトコルのログを確認します。
2. **Tunnel はオンラインだがドメインへ接続できない**：Public Hostname、DNS、Service の実際のポートを確認します。
3. **TLS エラーが返る**：オリジン接続のプロトコル、証明書の信頼、Origin Server Name を確認します。
4. **認証用 Host は開くがサービス用 Host が 404 になる**：ワイルドカードの Public Hostname を使用していることと、リクエスト先 Host のローカルマッピングが存在することを確認します。
5. **すべてのアクセスが同じ送信元に見える**：リクエストログのクライアント IP を確認し、Cloudflare からゲートウェイへの送信元情報の引き継ぎを調べます。
6. **ページは開くがリソースの読み込みに失敗する**：WebSocket が無効になっていないことを確認します。パスモードでは、プレフィックスの除去と HTML 書き換えも確認してください。

全体の実行状態については[トンネル](/ja/guide/tunnel)、完全な例については[トンネル経由のアクセス手順](/ja/tutorials/reverse-proxy-with-fknock)を参照してください。
