---
lang: ja-JP
title: "Docker Compose でデプロイ"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 97365fd9d189e2f5d9f1ad5e1489b3c5c982f21395a8897de030ce841e4085e5
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Docker Compose でデプロイ

現在のネットワークに適したイメージソースを選び、完全な Compose 設定を使用して、Linux ホストまたは Linux ベースの NAS で fn-knock を実行します。

[元の Docker Hub ページを開く](https://hub.docker.com/r/kcilnk/fn-knock)

## イメージソース

| イメージソース | イメージ | 推奨ネットワーク |
| --- | --- | --- |
| 公式ミラー | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 中国本土のネットワーク。`latest` は 30 分ごとに同期 |
| Docker Hub | `kcilnk/fn-knock:latest` | Docker Hub に安定して接続できるネットワーク |

以下では公式ミラーを使用します。ソースを切り替える場合は、pull コマンドと `.env` の `FN_KNOCK_IMAGE` を対応するアドレスに変更してください。バージョンを固定する場合は、`latest` を公開済みの固定タグに変更します。

## 一括インストール

対象 Linux ホストの root ターミナルへ以下のスクリプト全体を貼り付けます。Docker を確認し、IPv6 インターフェイス表を読み取ってグローバル IPv6 アドレスを検証してから、IPv6 対応 bridge の作成、完全な Compose 設定の書き込み、fn-knock の起動を行います。

<!--@include: ../../_shared/docker-quick-install.inc-->

インストール先は `/opt/fn-knock-docker` です。`.env` または `docker-compose.yml` がすでにある場合、スクリプトは上書きせず停止します。

## 完全なインストール手順

### 01 Docker 環境を確認

Linux ホスト、Docker Engine、Docker Compose が必要です。

```bash
docker version
docker compose version
```

ホストで IPv6 が有効になっており、`/proc/net/if_inet6` に scope が `00` のグローバル IPv6 レコードが 1 つ以上必要です。この procfs 仮想ファイルの表示サイズは常に `0` なので、`test -s` では確認しないでください。一括インストールスクリプトは内容を直接読み取ります。

### 02 ディレクトリを準備してイメージを取得

```bash
mkdir -p /opt/fn-knock-docker
cd /opt/fn-knock-docker
docker pull hub.fnknock.cn/kcilnk/fn-knock:latest
```

### 03 `.env` を作成

次の内容を `/opt/fn-knock-docker/.env` に保存します。

<!--@include: ../../_shared/docker-env.inc-->

主な設定：

| 設定 | デフォルト | 説明 |
| --- | --- | --- |
| `FN_KNOCK_IMAGE` | `hub.fnknock.cn/kcilnk/fn-knock:latest` | デフォルトでは `latest`。Docker Hub のイメージまたは固定バージョンタグへ変更可能 |
| `ADMIN_VIEW_PORT` / `GO_REPROXY_PORT` | `7991` / `7999` | 管理パネルと公開ゲートウェイのホスト側ポート |
| `FN_KNOCK_DOCKER_IPV4_SUBNET` | `172.30.0.0/16` | Docker bridge の IPv4 サブネット。競合する場合は別のプライベート CIDR に変更 |
| `FN_KNOCK_DOCKER_IPV6_SUBNET` | `fd42:fb33:7f7a:100::/64` | Docker bridge の IPv6 ULA `/64` |
| `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` | 空 | `7991` が信頼済みリバースプロキシの背後にある場合のみ、プロキシの送信元 IP または CIDR を設定 |
| `DOCKER_DISCOVER_LAN_IP` | 空 | サードパーティー製リバースプロキシがホストの LAN アドレスを自動検出できない場合のみ設定 |

### 04 `docker-compose.yml` を作成

現在のデプロイでは、分離された Docker bridge 上で 1 つの `fn-knock` コンテナだけを使用し、`network_mode: host` は使用しません。次の設定は bridge で IPv6 を有効にし、ホストの `/proc/net/if_inet6` を読み取り専用でマウントするため、DDNS の「インターフェイスから取得」で実際のホスト IPv6 インターフェイスを読み取れます。

<!--@include: ../../_shared/docker-compose.inc-->

### 05 起動して状態を確認

```bash
docker compose up -d
docker compose ps
docker compose logs -f fn-knock
```

最後のコマンドはログを継続表示します。終了するには `Ctrl+C` を押します。

## 初回アクセスと設定

Compose がホストにマッピングするのは管理パネルとゲートウェイだけです。`7996`～`7998` はコンテナ内部にとどまり、DDNS は読み取り専用ファイルマウントを通してホストの IPv6 インターフェイスを参照します。

| ポート | サービス | 公開範囲 | 用途 |
| --- | --- | --- | --- |
| `7991` | 管理パネル | ホストにマッピング | 初回アクセス時に Docker 管理パネルのパスワードを設定 |
| `7999` | ゲートウェイ / プロキシ入口 | ホストにマッピング | 外部クライアントがプロキシ対象サービスへアクセスするときに使用 |
| `7998` | Rust バックエンド | コンテナ内部のみ | デフォルトではホストに公開しない |
| `7997` | 認証フロントエンド | コンテナ内部のみ | デフォルトではホストに公開しない |
| `7996` | Go ゲートウェイ管理 | コンテナ内部のみ | デフォルトではホストに公開しない |

1. `http://<ホストIP>:7991` を開き、Docker 管理パネルのパスワードを設定してログインします。
2. 管理パネルでリバースプロキシ、サブドメイン、証明書、認証を設定します。
3. 外部アプリケーションのトラフィックをポート `7999` のゲートウェイへ送ります。
4. `7991` が信頼済みリバースプロキシの背後にある場合は、`.env` で `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` を設定します。
5. サードパーティー製リバースプロキシがホストの LAN アドレスを自動検出できない場合のみ、`DOCKER_DISCOVER_LAN_IP` を設定します。

## 最新イメージへ更新

`.env` の `latest` を維持したまま、イメージを再取得してコンテナを再作成します。永続ボリュームは削除されません。

```bash
cd /opt/fn-knock-docker
docker compose pull
docker compose up -d
docker compose ps
```

## 管理パネルのパスワードをリセット

パスワードを忘れた場合は Docker ホストへログインし、次を実行します。

```bash
cd /opt/fn-knock-docker && docker compose exec -T fn-knock fn-knock-reset-panel-password
```

次にポート `7991` へアクセスすると、初回パスワード設定に戻ります。このコマンドが消去するのは、管理パネルのパスワード、ログインセッション、ログイン失敗時のバックオフ状態だけです。アプリケーション設定、プロキシルール、証明書、許可リスト、ログ、データボリュームは削除されません。

## 関連ドキュメント

- [ポート、入口、アクセスパス](/ja/quick-start/ports-and-entrypoints)
- [アクセス方式を選ぶ](/ja/quick-start/run-modes)
- [バックアップ、復元、データ削除](/ja/guide/backup-and-restore)
- [ダッシュボードとシステム更新](/ja/guide/dashboard-and-update)
