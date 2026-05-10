<h1 align="center">
  <div align="center">
    <img src="./views/images/ambient-logo-color.svg" width="64" align="center" />
  </div>
  Ambient
</h1>

> English README: [README.md](README.md)

Ambient は、YouTube IFrame Player API と HTML5 の audio/video を組み合わせて、
YouTube とローカルメディアをシームレスに再生できるハイブリッド型メディアプレイヤーです。<br>
お気に入りの YouTube 動画と手元のメディアファイルを 1 つのプレイリストで管理し、連続再生できます。<br>
**あなたの Ambient メディア体験を始めましょう。**

<p align="center">
  <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/ka215/ambient">
  <img alt="GitHub" src="https://img.shields.io/github/license/ka215/ambient">
</p>

<p align="center">
  <a href="#概要">概要</a> &middot;
  <a href="#動作環境">動作環境</a> &middot;
  <a href="#インストール">インストール</a> &middot;
  <a href="#プレイリストの作成">プレイリストの作成</a> &middot;
  <a href="#メディアアセット">メディアアセット</a> &middot;
  <a href="#互換性">互換性</a> &middot;
  <a href="#ローカライズ">ローカライズ</a> &middot;
  <a href="#参考">参考</a> &middot;
  <a href="#最後に">最後に</a>
</p>

## 概要

PC で作業中に BGM を流す場合、ローカル音源はローカルプレイヤー、YouTube はブラウザ、と再生環境が分かれがちです。
Ambient はこの分断をなくし、1 つの Web UI で再生管理できるようにするために作られました。

YouTube の埋め込みプレイヤーと HTML の `<audio>` / `<video>` を組み合わせることで、
YouTube とローカルメディアの双方を同じ操作感で扱えます。

![Ambient Media Player](https://ka2.org/assets/2023/10/Ambient_Media_Player_03.jpg)

デモ（クラウド版）:

[Ambient DEMO (cloud ver.)](https://amp.ka2.org/)

## 動作環境

Ambient は Web アプリケーションのため、基本的にはブラウザで利用できます。
ただしローカルメディア再生を含む本来の使い方では、ローカル PC 上で PHP 実行環境と Web サーバー（Apache/Nginx）を用意する必要があります。

- 推奨構成: Windows + XAMPP（または macOS + MAMP）
- PHP: 8.4 以上（推奨）
- URL リライト設定が必要

クラウド版デモではサーバー上にローカルメディアを置かないため、YouTube 再生中心の挙動になります。

## インストール

以下のようにドキュメントルート配下などへ clone します。

```bash
git clone https://github.com/ka215/ambient.git ambient
```

たとえばドキュメントルート直下に配置した場合、`http://localhost/ambient` などでアクセスできます。
clone 後は `.env.example` を `.env` にコピーし、必要に応じて環境依存値を調整してください。
Ambient は現在、以下の設定を `.env` から読み込みます。

- `DEBUG_MODE`: ブラウザおよび PHP のデバッグログ出力の有効/無効
- `ASSETS_DIR`: プロジェクトルートからのアセットディレクトリ
- `LOGS_DIR`: プロジェクトルートからのログディレクトリ
- `ASSET_MODE`: `build` ならビルド済み asset、`dev` なら Vite dev server を使用
- `VITE_DEV_SERVER_URL`: 開発モード時に使用する Vite asset URL

リリースページの ZIP を展開して導入する方法でも問題ありません。

### フロントエンド開発とビルド

Ambient は現在、フロントエンドの asset pipeline に Vite を使用します。

- 開発起動:
  - `npm run dev`
- 型チェック:
  - `npm run typecheck`
- 商用ビルド相当:
  - `npm run build`

Apache の reverse proxy 配下でローカル開発する場合は、以下を設定します。

```env
ASSET_MODE=dev
VITE_DEV_SERVER_URL=https://dev-amp.ka2.org/vite
```

商用ビルド相当のローカル確認では、以下を設定します。

```env
ASSET_MODE=build
```

詳細な運用手順:

- `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook-ja.md`
- `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook.md`

## プレイリストの作成

プレイリストは `assets/` 配下の JSON ファイルです。
初期状態ではテンプレートとして `assets/PlayList.json` が含まれます。
必要に応じてコピーして複数作成してください。

JSON Schema:

- https://ka2.org/schemas/ambient.json

サンプル:

```json
{
  "YouTube Favorites": [
    {
      "title": "Thunder",
      "artist": "Imagine Dragons",
      "videoid": "fKopy74weus",
      "start": "21"
    },
    {
      "title": "Numb",
      "artist": "Linkin Park",
      "videoid": "kXYiU_JCYtU"
    }
  ],
  "Local PC Music": [
    {
      "disc": 1,
      "track": 1,
      "file": "Grandia_Theme.mp3",
      "title": "Unforgettable Adventure",
      "desc": "The Best of Grandia Disc1",
      "artist": "Noritaka Iwadare",
      "image": "The_Best_of_GRANDIA.jpg"
    }
  ],
  "options": {
    "autoplay": true,
    "random": true,
    "seek": true,
    "dark": false
  }
}
```

### メディア項目の主なプロパティ

| Property | Value Type | 説明 |
|:--------:|:----------:|:-----|
| title | string | 再生タイトル。未指定/空文字は無効扱い。 |
| file | string | `assets/media` からの相対パス。 |
| videoid | string | YouTube 動画 ID（`v=` の値）。`file` より優先。 |
| desc | string | 説明・サブタイトル。 |
| artist | string | アーティスト名。 |
| image | string | `assets/images` からの相対パス。YouTube は自動取得。 |
| volume | integer | 個別初期音量（0-100）。 |
| start / end | string/integer | 再生開始/終了時刻（秒または `H:MM:SS`）。 |
| fadein / fadeout | integer/float | フェードイン/フェードアウト時間（秒）。 |
| fs | integer/boolean | メディア単位のフルスクリーン制御。 |
| cc | integer/boolean | 字幕表示の切替（主に YouTube）。 |

### options の主なプロパティ

| Property | Value Type | Default | 説明 |
|:--------:|:----------:|:-------:|:-----|
| autoplay | boolean | true | 自動再生フラグ。 |
| random | boolean | false | ランダム再生。 |
| shuffle | boolean | false | シャッフル再生。 |
| seek | boolean | false | シーク再生有効化。 |
| volume | integer | 100 | 全体の初期音量。 |
| fader | boolean | false | 擬似フェーダー処理。 |
| dark | boolean | false | ダークモード。 |
| background | string | - | 背景画像パス。 |
| caption | string | `%artist% - %title% - %desc%` | キャプション表示フォーマット。 |
| playlist | string | `%artist% - %title%` | プレイリスト表示フォーマット。 |
| fs | boolean | false | 全体のフルスクリーン制御。 |
| cc | boolean | false | 全体の字幕表示制御。 |

## メディアアセット

ローカルメディアを再生する場合は、以下を配置します。

- 再生メディア: `assets/media`
- 画像ファイル: `assets/images`

既存のメディア配置を変えたくない場合は、`assets/media` 配下にシンボリックリンクを作成する運用が便利です。

### Ambient 側でのプレイリスト読み込み

- 起動時に `assets` 配下の JSON を自動探索して有効なプレイリストを読み込み
- 更新後は「Refresh」で再読み込み
- 設定メニューからプレイリストを選択

### 再生操作

- 下部メニューの再生ボタンで再生開始
- 左ドロワーから任意メディアを直接再生
- サムネイル付き前後ボタンで前後候補へ遷移

![Ambient UI](https://ka2.org/assets/2023/10/Ambient_Media_Player_UI.jpg)

## 互換性

### ブラウザ

以下の主要ブラウザで動作確認済みです（HTML5 audio/video と JavaScript が有効であることが前提）。

| Chrome(>=^118) | Firefox(>=^118) | Edge(>=^118) | Safari(>=^16) | Opera(>=^103) |
|:--------------:|:---------------:|:------------:|:-------------:|:-------------:|
| Ok | Ok | Ok | Ok | Ok |

### メディア形式

ローカルメディアは HTML5 `<audio>` / `<video>` で再生可能な形式に準拠します。

| MP3(.mp3) | WAVE(.wav) | MP4(.mp4) | AAC(.aac) | WEBM(.webm) | OGG(.ogg) | M4A(.m4a) | WMA(.wma) |
|:---------:|:----------:|:---------:|:---------:|:-----------:|:---------:|:---------:|:---------:|
| Ok | Ok | Ok | Ok | Ok | Ok | ✕ | ✕ |

## ローカライズ

`assets/lang.json` を翻訳定義で上書き、または `lang-{langCode}.json` を追加することで UI を多言語化できます。
`$language` キーで表示言語名を定義し、各 UI 文言をキーとして翻訳値を設定します。

例: `lang-de.json` を配置すればドイツ語 UI に切り替え可能です。

## 参考

- [YouTube Player API Reference](https://developers.google.com/youtube/iframe_api_reference)
- [tailwindcss](https://tailwindcss.com/docs/installation)
- [Flowbite](https://flowbite.com/docs/getting-started/introduction/)
- [M+FONTS](https://mplusfonts.github.io/)

利用例（ブログ記事）:

- [Introducing the initial release (Japanese)](https://ka2.org/ambient-media-player)
- [About features added in version 1.1.0 (Japanese)](https://ka2.org/released_ambient_demo_version)

## 最後に

Ambient は YouTube IFrame Player API と HTML5 メディア要素を中心に構成されるオープンソースプロジェクトです。
ライセンスは MIT License です。

- Repository: https://github.com/ka215/ambient

フィードバックや Issue は歓迎します。
