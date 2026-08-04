---
lang: ja-JP
title: "macOS へデプロイ（Intel / Apple Silicon）"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 0912ae4a2d36e245cbe4770888063c9d343483a9a8a72e20b7573ef7a8a48ac9
---

# macOS へデプロイ（Intel / Apple Silicon）

macOS 版はコマンドラインインストーラーと `knock` 管理コマンドを使用し、`.app`、`.pkg`、メニューバーアプリは提供しません。macOS 13 以降を対象に、Intel と Apple Silicon のネイティブパッケージを個別に配布します。

管理画面はデフォルトで `127.0.0.1:7991` だけを待ち受けます。macOS ランタイムは `iptables` を呼び出さず、macOS のホストファイアウォールも変更しません。

## インストール要件

- macOS 13 以降。
- `sudo` を使用できるアカウント。
- `cdn.fnknock.cn` と GitHub Release への HTTPS 接続。
- `7991`、`7996`、`7997`、`7998`、`7999` が未使用であること。競合を検出するとインストーラーが変更を案内します。

アーキテクチャは自動判定されます。

| Mac | リリースアーキテクチャ | アーカイブ名 |
| --- | --- | --- |
| Intel（`x86_64`） | `amd64` | `fn-knock-macos-<バージョン>-amd64.tar.gz` |
| Apple Silicon（`arm64`） | `arm64` | `fn-knock-macos-<バージョン>-arm64.tar.gz` |

Apple Silicon 上の Rosetta ターミナルから実行しても、実機のアーキテクチャを検出して `arm64` を選択します。サービスを導入する前に、パッケージ内の Mach-O アーキテクチャも検証します。

## 1 行でインストール

「ターミナル」で実行します。

```bash
curl -fsSL https://cdn.fnknock.cn/macos/install.sh | sudo bash
```

インストーラーは現在のアーキテクチャ向け安定版をダウンロードし、サイズと SHA-256 を検証して root LaunchDaemon を登録し、管理サービスとゲートウェイの準備完了まで待機します。Homebrew は不要です。

完了後に `sudo knock status` を実行し、この Mac のブラウザーで `http://127.0.0.1:7991/` を開きます。初回アクセスで設定するパネルパスワードは、ゲートウェイ利用者の TOTP、ユーザー名とパスワード、パスキーとは別です。

### 別のコンピューターから管理する

`7991` は意図的にループバック専用です。一時的なリモート管理には、クライアントから SSH 転送を作成します。

```bash
ssh -L 7991:127.0.0.1:7991 <macOSユーザー>@<Macのアドレス>
```

SSH 接続を維持したまま、クライアントのブラウザーで `http://127.0.0.1:7991/` を開きます。常設する場合は `sudo knock nginx` の HTTPS リバースプロキシ例を基にアクセス制御を追加してください。

## 未署名リリースと Gatekeeper

macOS アーカイブは Apple Developer ID で署名されておらず、Apple の公証も受けていません。コマンドラインインストーラーは安定版ポインターに記録されたサイズと SHA-256 を検証します。手動ダウンロードでは、公式 GitHub Release からアーカイブと `SHA256SUMS` を取得して次を実行します。

```bash
shasum -a 256 fn-knock-macos-<バージョン>-<amd64またはarm64>.tar.gz
```

結果は `SHA256SUMS` の同名エントリーと完全に一致する必要があります。ブラウザー経由のファイルに quarantine が付いた場合は、検証後に限り解凍先で次を実行できます。

```bash
xattr -dr com.apple.quarantine /path/to/fn-knock
```

インストーラーが quarantine を暗黙に削除することはありません。未検証のファイルに `xattr` を実行しないでください。

## ポートとネットワーク境界

| デフォルトポート | 待ち受け範囲 | 用途 |
| --- | --- | --- |
| `7991` | `127.0.0.1` | 管理画面 |
| `7998` | ループバック | Rust 管理バックエンド |
| `7997` | ループバック | 認証サービス |
| `7996` | ループバック | Go ゲートウェイ管理インターフェース |
| `7999` | ゲートウェイ設定による。デフォルトのサービス入口 | fn-knock を通過するサービス通信 |

`7996`、`7997`、`7998` は公開しないでください。`7999` の LAN / インターネット到達性は macOS ファイアウォール、ルーターまたは NAT、IPv6 ファイアウォール、ISP の着信制限にも依存し、fn-knock はこれらを変更しません。

自動 HTTPS とプロトコルマッピングが設定するのは fn-knock 自身の待ち受けとルーティングだけです。macOS ファイアウォール、ルーターのポート、クラウドのセキュリティグループは管理者が手動で許可します。

## `knock` で管理する

引数なしの `sudo knock` で対話メニューを開きます。

| コマンド | 用途 |
| --- | --- |
| `sudo knock status` | LaunchDaemon、主要プロセス、ポート、メモリーを確認 |
| `sudo knock start` / `stop` / `restart` | サービスを制御 |
| `sudo knock config` | 5 つの実行ポートを変更して競合を確認 |
| `sudo knock logs` / `logs --follow` | ログを表示または追跡 |
| `sudo knock update` / `update --yes` | 同一アーキテクチャの更新を対話式または非対話式で導入 |
| `sudo knock rollback` | 保持された前バージョンへ切り替えて検証 |
| `sudo knock nginx` | 管理画面用 HTTPS リバースプロキシ例を表示 |
| `sudo knock reset-panel-password` | パネルパスワードを消去して再設定 |
| `sudo knock version` | インストール済みバージョンを表示 |

更新はダウンロードと検証の後に `current` シンボリックリンクを原子的に切り替えます。ヘルスチェックに失敗すると、バージョンリンク、管理コマンド、LaunchDaemon 設定、以前の起動状態を復元します。更新前にはアプリバックアップもエクスポートしてください。

## ファイルの場所

| 内容 | パス |
| --- | --- |
| バージョン | `/Library/Application Support/FnKnock/releases/<バージョン>` |
| 現在と前のバージョン | `/Library/Application Support/FnKnock/current`、`previous` |
| 実行設定 | `/Library/Application Support/FnKnock/config/fn-knock.env` |
| アプリデータ | `/Library/Application Support/FnKnock/data` |
| サービスログ | `/Library/Logs/FnKnock` |
| 管理コマンド | `/usr/local/bin/knock` |
| LaunchDaemon | `/Library/LaunchDaemons/cn.fnknock.service.plist` |

LaunchDaemon は root で動作し、ログイン前に起動できます。再起動後に自動ロードされ、主要プロセスが異常終了すると launchd がサービス群全体を再起動します。

## プラットフォームの機能境界

macOS は Host / パスのリバースプロキシ、認証、証明書と ACME、WAF、監視、深度監視、内蔵 FRP / Cloudflared をサポートします。次は提供しません。

- `iptables` または macOS ホストファイアウォールの管理。
- ダイレクトモード許可とスマート接続。
- SSH セキュリティ管理、Web ターミナル、fnOS 証明書ストア同期、fnOS 固有のネットワーク調整。
- Web 画面からの更新導入。`sudo knock update` を使用します。

macOS でもホワイトリストはゲートウェイのアクセスポリシーに使われますが、ホストの元ポートを開放することはできません。

## アンインストール

設定、データ、ログを残してプログラムとサービスだけを削除します。

```bash
sudo knock uninstall
```

すべてを完全に削除する場合：

```bash
sudo knock uninstall --purge
```

完全削除には対話ターミナルで `DELETE` の入力が必要です。先にアプリバックアップをエクスポートしてください。

## トラブルシューティング

```bash
sudo knock status
sudo launchctl print system/cn.fnknock.service
sudo knock logs
```

- 管理画面を開けない：fn-knock をインストールした Mac 上で `127.0.0.1` を使い、`7991` を変更していないか確認します。
- サービスが準備完了にならない：`/Library/Logs/FnKnock/stdout.log` と `stderr.log`、5 ポートの競合を確認します。
- 外部からゲートウェイへ到達できない：`7999` の待ち受け、macOS ファイアウォール、ルーター/NAT、IPv6、ISP 制限を確認します。
- 更新に失敗した：自動復元の結果をログで確認し、`previous` が存在する場合だけ `sudo knock rollback` を実行します。
- アーキテクチャ不一致：強制せず、1 行インストーラーを再実行してネイティブパッケージを選びます。

続けて [ポートとエンドポイント](/ja/quick-start/ports-and-entrypoints)、[デプロイ方法とアクセス構成](/ja/quick-start/deployment-options)、[ダッシュボードとシステム更新](/ja/guide/dashboard-and-update)を参照してください。
