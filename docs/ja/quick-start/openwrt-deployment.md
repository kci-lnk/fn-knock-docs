---
lang: ja-JP
title: "OpenWrt へデプロイ"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 277cb83222e1e08a1c6745b3936c716b103813a63d9127565fb6b5647479b338
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# OpenWrt へデプロイ

OpenWrt 向けの `fn-knock` パッケージには、LuCI 設定画面、管理画面、認証画面、Rust バックエンド、Go ゲートウェイが含まれます。インストール後は `サービス → fn-knock` から管理します。管理画面のデフォルトポートは `7991`、ゲートウェイ入口は `7999` です。

最初に、ファームウェアが採用しているパッケージ形式とターゲットアーキテクチャを確認してください。形式が違えばパッケージマネージャーでインストールできず、アーキテクチャが違えば CPU が似ていても実行できません。

## 正しいパッケージを選ぶ

### パッケージ形式はファームウェアで決まる

| ファームウェアのパッケージマネージャー | パッケージ形式 | 主な OpenWrt バージョン | インストールコマンド |
| --- | --- | --- | --- |
| `opkg` | `.ipk` | `24.10` 以前 | `opkg install /tmp/<ファイル名>.ipk` |
| `apk` | `.apk` | `25.12` 以降 | `apk add --allow-untrusted /tmp/<ファイル名>.apk` |

OpenWrt `25.12` 以降では通常 `apk`、`24.10` 以前では通常 `opkg` を使用します。ただし、派生ファームウェアやアップグレード途中の機器では、実際に入っているパッケージマネージャーを基準にしてください。バージョン番号や拡張子から推測せず、先にルーター上で確認してください。

```bash
ubus call system board
if command -v opkg >/dev/null 2>&1; then
  opkg print-architecture
else
  apk --print-arch
fi
```

### ファームウェアのアーキテクチャ別に直接ダウンロード

上記コマンドの出力からターゲット名を確認し、下表の該当パッケージを直接ダウンロードしてください。各リンクは公式サイトと同じ安定したダウンロード URL で、形式とアーキテクチャが指定済みのため、URL を手作業で変更する必要はありません。

| ターゲットアーキテクチャ | 主な機器 | APK（OpenWrt 25.12 以降） | IPK（OpenWrt 24.10 以前） |
| --- | --- | --- | --- |
| `x86_64` | Intel / AMD 64 ビットのソフトウェアルーター、仮想マシン | [APK をダウンロード](https://get.fnknock.cn/?type=apk&arch=x86_64) | [IPK をダウンロード](https://get.fnknock.cn/?type=ipk&arch=x86_64) |
| `aarch64_cortex-a53` | IPQ60xx、Cortex-A53、ImmortalWrt `qualcommax/ipq60xx` | [APK をダウンロード](https://get.fnknock.cn/?type=apk&arch=aarch64_cortex-a53) | [IPK をダウンロード](https://get.fnknock.cn/?type=ipk&arch=aarch64_cortex-a53) |
| `aarch64_generic` | Generic ARM64 ルーター、開発ボード | [APK をダウンロード](https://get.fnknock.cn/?type=apk&arch=aarch64_generic) | [IPK をダウンロード](https://get.fnknock.cn/?type=ipk&arch=aarch64_generic) |
| `arm_cortex-a7_neon-vfpv4` | 対応ターゲットの 32 ビット ARMv7 機器 | [APK をダウンロード](https://get.fnknock.cn/?type=apk&arch=arm_cortex-a7_neon-vfpv4) | [IPK をダウンロード](https://get.fnknock.cn/?type=ipk&arch=arm_cortex-a7_neon-vfpv4) |
| `arm_cortex-a5_vfpv4` | Cortex-A5 / VFPv4 ルーター | [APK をダウンロード](https://get.fnknock.cn/?type=apk&arch=arm_cortex-a5_vfpv4) | [IPK をダウンロード](https://get.fnknock.cn/?type=ipk&arch=arm_cortex-a5_vfpv4) |

リリースパッケージのファイル名末尾には OpenWrt のターゲットアーキテクチャが入ります。例：

```text
fn-knock_<version>-<release>_x86_64.ipk
fn-knock_<version>-r<release>_aarch64_cortex-a53.apk
```

`opkg print-architecture` または `apk --print-arch` が出力するターゲット名を基準にします。特に、`aarch64_generic` と `aarch64_cortex-a53` を取り違えないでください。現在パッケージを提供していない MIPS、ARMv6、その他のターゲットへ無理にインストールすることはできません。

実行用のメインパッケージ `fn-knock` をダウンロードしてください。アプリストア用のメタデータパッケージは実行パッケージではありません。

## インストール

適合するパッケージをルーターの `/tmp` へアップロードし、ファームウェアに合うコマンドを 1 つ実行します。

```bash
# opkg ファームウェア
opkg install /tmp/fn-knock_*.ipk

# apk ファームウェア
apk add --allow-untrusted /tmp/fn-knock_*.apk
```

このワイルドカードを使うコマンドは、`/tmp` にインストール対象の `fn-knock` メインパッケージが 1 つだけあることを前提とします。複数バージョンを置いている場合は、完全なファイル名を指定してください。

`apk --allow-untrusted` を使用できるのは、信頼できるリリースページから入手し、配布元またはチェックサムを確認済みのローカルパッケージだけです。このオプションはパッケージリポジトリの署名検証を迂回するため、出所不明のファイルには使わないでください。オフラインインストールの前には、依存パッケージをファームウェアのリポジトリから取得できることも確認します。

インストールスクリプトはサービスを有効化して起動し、LuCI のメニューキャッシュも更新します。LuCI のパッケージアップロード画面からローカルパッケージを入れることもできますが、コマンドラインの方が実際の形式とアーキテクチャを確認しやすくなります。

## 初回アクセスとポート

`サービス → fn-knock` を開き、サービスの状態が「実行中」であることを確認してから、「管理画面を開く」をクリックします。デフォルトの URL は次のとおりです。

```text
http://<OpenWrtのLAN内アドレス>:7991/
```

初回アクセス時に管理パネルのパスワードを設定します。このパスワードが保護するのは OpenWrt 上の管理画面だけで、利用者がサービスへアクセスするときに使う TOTP、ユーザー名とパスワード、パスキーとは別の認証情報です。

| ポート | 待ち受け範囲 | 用途 |
| --- | --- | --- |
| `7991` | 設定可能。デフォルトの管理入口 | 管理画面 |
| `7999` | ゲートウェイ待ち受けポート | 外部からマッピング済みサービスへアクセスする入口 |
| `17998` | `127.0.0.1` | Rust 管理バックエンドの内部 API |
| `7997` | `127.0.0.1` | 認証サービス |
| `7996` | `127.0.0.1` | ゲートウェイ内部の gRPC |

LuCI 画面では、これらのポート、データディレクトリ、ゲートウェイ設定ディレクトリを変更できます。設定を適用すると `procd` がサービスをリロードします。各ポートには異なる番号を指定してください。

WAN 側から `7991` へ転送したり、ファイアウォールで許可したりしないでください。外部公開が必要な場合は、動作モード、証明書、アクセスポリシーを決めてから、ゲートウェイポート `7999` に必要なファイアウォールルールまたは上流からの転送だけを設定します。このパッケージは OpenWrt の WAN ファイアウォールポリシーを置き換えるものではありません。

サービスとログの確認：

```bash
/etc/init.d/fn-knock status
logread -e fn-knock
```

管理画面へアクセスできても、ルーター上のサービスが起動したことしか確認できません。マッピングを設定した後は、モバイル回線など実際の外部ネットワークから `7999` とドメインを検証し、LAN 内の結果をインターネット経由の認証結果と取り違えないでください。

## データとアップグレード

実行設定とデータは、デフォルトで次の場所に保存されます。

```text
/etc/config/fn-knock
/etc/fn-knock/gateway
/var/lib/fn-knock
```

ゲートウェイディレクトリには SQLite データベースが保存され、実行データのディレクトリにはシークレット、トンネル関連リソース、更新状態などが保存される場合があります。アップグレード前に、この 3 か所をバックアップしてください。機密情報を含むため、外部から読める場所へアップロードしてはいけません。

併せて、メンテナンス画面から `.knock` アプリバックアップをエクスポートします。ディレクトリのバックアップは SQLite とプラットフォーム固有の実行データを保持し、`.knock` は復元可能な設定の移行に使います。収録範囲、バージョン上の制約、復元後の確認項目は[バックアップ・復元・データ消去](/ja/guide/backup-and-restore)を参照してください。

OpenWrt 版は、管理画面からの FPK 更新に対応していません。上記の直接ダウンロード表から、同じ形式かつ同じファームウェアアーキテクチャ向けの新しいパッケージを取得して、次のコマンドを実行します。

```bash
# opkg ファームウェア：新しいバージョンの導入、または同じバージョンの明示的な再インストール
opkg install --force-reinstall /tmp/fn-knock_*.ipk

# apk ファームウェア
apk add --allow-untrusted /tmp/fn-knock_*.apk

/etc/init.d/fn-knock status
```

`/tmp` に複数バージョンが残っている場合は、ワイルドカードではなく完全なファイル名を指定し、複数パッケージを一度にパッケージマネージャーへ渡さないようにします。

アップグレードによって上記の実行ディレクトリが自動的に消去されることはありません。変更済みの `/etc/config/fn-knock` をどう扱うかパッケージマネージャーから尋ねられた場合は、今回の更新でデフォルト設定への復元が明示的に必要なケースを除き、既存設定を保持してください。

OpenWrt の管理パネルパスワードを忘れた場合は、SSH から次のコマンドを実行します。

```bash
fn-knock-reset-panel-password
```

その後、LuCI の管理画面入口へ戻り、案内に従って新しいパスワードを設定します。

## OpenWrt 版の機能制限

| 機能 | OpenWrt パッケージでの対応状況 |
| --- | --- |
| アプリ内 FPK 更新 | 非対応。`opkg` または `apk` で適合する新パッケージをインストールします |
| 直接接続モード、ホストのファイアウォール管理 | 対応。サービスを root で実行する必要があります。先に LuCI またはローカルコンソールからの復旧経路を確保してください |
| スマート接続 | 対応。`dnsmasq` がインストール済みかつ稼働中で、メイン設定から `/etc/dnsmasq.d/` を読み込む必要があります。画面上の `apt-get` による自動インストールは OpenWrt では使えません |
| SSH セキュリティ | 非対応。OpenWrt 自体の SSH ログ、ファイアウォール、セキュリティ系パッケージを使用します |
| Web ターミナル | 非対応 |
| 自動 HTTPS | 現在の OpenWrt パッケージでは非対応 |

スマート接続を有効にすると `/etc/dnsmasq.d/fn-knock-smart-connect.conf` が書き込まれ、`service dnsmasq restart` でサービスが再起動します。初めて有効にする前に、SSH から `dnsmasq` が正常に動作していることを確認し、LuCI またはコンソールから復旧できる経路を残してください。画面に `dnsmasq` のインストール案内が表示された場合は、画面のインストールボタンに頼らず、現在のファームウェアに合う `opkg` または `apk` で手動インストールします。

`fn-knock` は、OpenWrt ファームウェアの更新、ルーター設定のバックアップ、ファイアウォールで公開範囲を最小限に抑える運用を置き換えるものではありません。

次に読むページ：

- [ポート・入口・アクセス経路](/ja/quick-start/ports-and-entrypoints)
- [アクセス構成を選ぶ](/ja/quick-start/run-modes)
- [バックアップ・復元・データ消去](/ja/guide/backup-and-restore)
- [ダッシュボードとシステム更新](/ja/guide/dashboard-and-update)
