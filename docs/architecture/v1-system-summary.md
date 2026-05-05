# Ambient v1 システムアーキテクチャサマリ

> 作成日: 2026-05-03  
> 対象バージョン: v1.2.3（package.json より）  
> 目的: v2 開発における設計・実装・レビューエージェントのリファレンス

---

## 1. アプリケーション概要

### 目的

Ambient は、ローカル環境またはセルフホスト環境で動作するメディアプレイヤー Web アプリケーション。  
JSON 形式のプレイリストファイルを読み込み、ローカルメディアファイルまたは YouTube 動画を再生する。  
複数プレイリスト・多言語・カテゴリ選択・ループ/シャッフル/シーク再生などの機能を持つ。

### 技術スタック

| 区分 | 技術 |
|------|------|
| サーバーサイド | PHP（名前空間・Trait・Singleton パターン） |
| テンプレートエンジン | PHP インクルードベース（フレームワーク不使用） |
| フロントエンド CSS | Tailwind CSS v3 + Flowbite v1（JIT モード） |
| フロントエンド JS | バニラ JavaScript（`src/scripts/ambient.js`） |
| データ形式 | JSON（プレイリスト・翻訳データ） |
| ビルドツール | npm（tailwindcss CLI） |
| 対象 Web サーバー | Apache / Nginx（URL リライト設定が前提） |

### 動作環境

- PHP 8.x 以降（型宣言・`mixed` 型等の使用を含む）
- ローカル開発環境: XAMPP（Windows）が主要な想定環境
- リモートホストでの `create_symlink` は意図的に無効化されている（`is_local()` によるガード）
- YAML 対応は PECL yaml 拡張が必要なため、コメントアウトされており実質未対応

---

## 2. ディレクトリ構成と各役割

```
amp/
├── index.php              エントリポイント。定数定義・オートロード・Ambient 起動
├── autoload.php           spl_autoload_register による名前空間オートローダー
├── functions.php          グローバル関数定義（ビューヘルパー等）。任意ロード
├── custom.php             ユーザー固有のカスタマイズフック。レンダリング直前にロード
├── package.json           npm スクリプト定義・バージョン情報
├── tailwind.config.js     Tailwind CSS ビルド設定
│
├── src/                   PHP ソースコード
│   ├── Ambient.php        メインクラス（Singleton）。3 Trait を use
│   ├── api.php            Trait api。API エンドポイント実装
│   ├── render.php         Trait render。テンプレート描画・JS データ受け渡し
│   ├── utils.php          Trait utils。ユーティリティ・翻訳・プレイリスト検索等
│   ├── _index.php         旧エントリポイント（v1 以前の遺物。現在は未使用）
│   ├── scripts/
│   │   └── ambient.js     フロントエンド JavaScript
│   └── styles/
│       ├── tailwindcss.css    Tailwind ビルド入力ファイル（@tailwind ディレクティブ）
│       ├── ambient.scss       カスタム SCSS
│       └── ambient.css        コンパイル済み CSS
│
├── views/                 PHP テンプレート（UI コンポーネント）
│   ├── layout.php         HTML 骨格。各コンポーネントを組み込む
│   ├── player.php         プレイヤー UI コンポーネント
│   ├── menu.php           下部メニュー
│   ├── drawer-left.php    左ドロワー（プレイリスト）
│   ├── drawer-right.php   右ドロワー（設定・オプション）
│   ├── carousel.php       カルーセル（ジャケット画像）
│   ├── collapse.php       折り畳みコンポーネント
│   ├── modal.php          モーダル（メディア追加等）
│   ├── notice.php         エラー・通知表示
│   ├── css/               ビュー固有 CSS（`views/css/ambient.css`）
│   ├── fonts/             フォントファイル置き場
│   └── images/            UI 用画像（favicon 等）
│
├── assets/                静的アセット・データファイル
│   ├── *.json             プレイリスト JSON（lang-*.json 以外）
│   ├── lang.json          英語翻訳テキスト定義（ベース言語）
│   ├── lang-ja.json       日本語翻訳テキスト定義
│   ├── PlayList.json      テンプレート用プレイリストサンプル
│   ├── images/            メディアカバー画像置き場
│   └── media/             メディアファイル置き場（サブディレクトリ・シンボリックリンク可）
│
├── dist/                  Tailwind CSS ビルド出力先（tailwindcss.css / tailwindcss.min.css）
├── logs/                  デバッグログ（debug.log）
├── refuges/               旧プレイリスト JSON のバックアップ・サンプル
└── docs/                  設計・仕様ドキュメント（本ファイルを含む）
```

---

## 3. クラス・Trait 構成と責務

### クラス図（概念）

```
Magicmethods\Ambient
  ├── use utils    (src/utils.php)
  ├── use api      (src/api.php)
  └── use render   (src/render.php)
```

### `Ambient` クラス（src/Ambient.php）

| 項目 | 内容 |
|------|------|
| 名前空間 | `Magicmethods` |
| パターン | Singleton（`get_instance()` / `private __construct()`） |
| エントリ | `setup()` メソッドが初期化シーケンスの起点 |
| 主要プロパティ | `$package_info`, `$languages`, `$translation_data`, `$current_lang`, `$playlists`, `$amp_error` |
| エラー管理 | `error_handler()`, `set_error()`, `set_warn()`, `set_notice()`, `is_error()` |
| ルーティング | `route_endpoint()` 内で HTTP メソッド + パス名からメソッドを決定 |

**`setup()` の処理順序:**

1. `clear_log()` — ログファイルをリセット
2. `register_shutdown_function()` — シャットダウンフック登録
3. `load_translation_data()` — 翻訳データ・言語設定の読み込み
4. `set_error_handler()` — カスタムエラーハンドラ登録
5. `package_info` へ `package.json` を読み込み
6. `find_playlist()` — プレイリスト JSON の検索
7. `set_localize_script()` — PHP → JS へのデータ注入（`AmbientData` グローバル変数）
8. `route_endpoint()` — URL に基づく API ルーティング
9. `render_template()` — HTML ビュー出力

---

### Trait `api`（src/api.php）

API エンドポイントの実装を担う。  
`api_request_handler()` が `call_user_func_array()` で対象メソッドを動的呼び出し。

| メソッド | HTTP | パス | 説明 |
|----------|------|------|------|
| `get_playlist()` | GET | `/playlist/` | 全プレイリスト一覧の返却 |
| `get_playlist($file)` | GET | `/playlist/{filename}` | 指定プレイリスト JSON の読み込み・返却 |
| `get_filepath($filename)` | GET | `/filepath/{filename}` | MEDIA_DIR 内のファイルパス検索 |
| `upsert_playlist($category)` | POST | `/playlist/{category}` | プレイリストへのメディア追加 |
| `create_symlink($dir, $name)` | POST | `/symlink` | ローカル環境でのシンボリックリンク作成 |
| `pre_processing_requested_api()` | — | — | API 前処理フック（認証実装ポイント） |
| `return_response()` | — | — | `api_response` を JSON 出力して `die()` |

**レスポンス共通スキーマ:**

```json
{
  "state": "ok" | "error",
  "code": 200 | 404 | 401 | 500,
  "data": <payload>
}
```

---

### Trait `render`（src/render.php）

| メソッド | 説明 |
|----------|------|
| `render_template()` | `custom.php` を読み込み後、`views/layout.php` をインクルード |
| `get_component($component)` | 指定コンポーネントテンプレートをインクルード |
| `set_localize_script($var, $data)` | PHP 配列を JS グローバル変数 `var $var = {...}` として静的プロパティに保存 |
| `amp_localize_script()` (static) | `<script>` タグとして文字列を返す |

`$menu_type` プロパティ（デフォルト `2`）で下部メニューの表示形式を制御。

---

### Trait `utils`（src/utils.php）

| メソッド | 説明 |
|----------|------|
| `filter_params()` | POST/GET パラメータをサニタイズして返却 |
| `load_translation_data()` | `assets/lang*.json` を検索・読み込み、Cookie `lang` で言語決定 |
| `find_playlist()` | `assets/` 内の JSON ファイルを検索（lang*.json を除外） |
| `filter_media($media)` | プレイリストの `start`/`end`/`image`/`file` フィールドを正規化 |
| `filter_seeking($point)` | `H:MM:SS` 形式の時刻を秒数（float）に変換 |
| `recursive_glob($pattern)` | ディレクトリを再帰的に検索してファイル一覧を返却 |
| `__($text)` | 翻訳データに基づいてテキストを返却（翻訳なければ原文） |
| `get_version()` | `package.json` からバージョン文字列を返却 |
| `is_local()` (static) | SERVER_ADDR と REMOTE_ADDR のサブネット比較でローカル判定 |
| `logger(...$args)` | `DEBUG_MODE` 有効時に `logs/debug.log` へ追記 |
| `clear_log()` | ログファイルを空にする（`type nul >` / `: >`） |
| `minify_css($css)` (static) | インライン CSS を簡易ミニファイ |
| `set_property($name, $value)` | プロパティ名指定での動的プロパティ設定 |

---

### グローバル関数（functions.php）

`functions.php` はビューテンプレートから呼び出せるラッパー関数群を提供する。  
`$GLOBALS['ambient']` 経由で `Ambient` インスタンスに委譲する。

| 関数 | 説明 |
|------|------|
| `amp_set_var($name, $value)` | `Ambient::set_property()` のラッパー |
| `is_local()` | `Ambient::is_local()` のラッパー |
| `__($text)` | `Ambient::__()` のラッパー（翻訳） |
| `amp_head()` | CSS・アイコン・スクリプト注入の `<head>` 内容を生成 |
| `amp_footer()` | JS ファイルの読み込みタグを生成 |
| `amp_component($name)` | `Ambient::get_component()` を呼び出しコンポーネントを描画 |

---

### カスタマイズフック（custom.php）

`render_template()` が `views/layout.php` をインクルードする直前に読み込まれる。  
`amp_set_var()` を使って `Ambient` インスタンスのプロパティを上書きできる。

現在の利用例:
- `menu_type` の変更（メニュー表示形式制御）
- `translation_data` の差し替え（翻訳テキストの上書き）

---

## 4. リクエスト処理フロー

### 4-1. 通常アクセス（ページ表示）

```
ブラウザ → index.php
  → autoload.php（クラスオートロード登録）
  → functions.php（グローバル関数定義）
  → Ambient::get_instance()（Singleton 生成、セッション開始）
  → Ambient::setup()
      → clear_log()
      → load_translation_data()（lang*.json 読み込み、言語決定）
      → package.json 読み込み
      → find_playlist()（assets/*.json 検索）
      → set_localize_script('AmbientData', {...})（JS 変数注入）
      → route_endpoint()
          → リクエスト解析（メソッド + パス名）
          → ルートが "Normal access" の場合: 何もしない
      → render_template()
          → custom.php 読み込み
          → views/layout.php インクルード
              → amp_head()（CSS・スクリプト出力）
              → amp_component('player') ... 各コンポーネント描画
              → amp_footer()（JS 読み込み）
  → HTML レスポンス返却
```

### 4-2. API リクエスト

```
ブラウザ/JS → index.php（URL リライト経由）
  → Ambient::setup()
      → （通常アクセスと同様の初期化）
      → route_endpoint()
          → URL パース: HTTP メソッド + パス名 → $request_route
          → switch で $method, $args を決定
          → api_request_handler($method, $args)
              → pre_processing_requested_api()（認証フック）
              → call_user_func_array([this, $method], $args)
                  → get_playlist() / get_filepath() / create_symlink() / upsert_playlist()
                  → $this->api_response を設定
              → return_response() を呼び出し
                  → header('Content-type: application/json')
                  → echo json_encode($api_response)
                  → die()（以降の処理を中断）
```

**ルーティングテーブル:**

| request_route | メソッド | 説明 |
|---|---|---|
| `get:playlist` | `get_playlist()` | プレイリスト取得 |
| `get:filepath` | `get_filepath()` | メディアファイルパス取得 |
| `post:playlist` | `upsert_playlist()` | プレイリストへのメディア追加 |
| `post:symlink` | `create_symlink()` | シンボリックリンク作成 |
| その他 | なし | 通常アクセスとして処理 |

---

## 5. データ構造

### 5-1. プレイリスト JSON スキーマ

プレイリストは `assets/` ディレクトリ直下に配置する JSON ファイル。  
ファイル名は任意（`lang*.json` を除く）。

**トップレベル構造:**

```json
{
  "<カテゴリ名>": [ <メディアアイテム>, ... ],
  "options": { <オプションオブジェクト> }
}
```

**メディアアイテムのフィールド:**

| フィールド | 型 | 説明 |
|------------|-----|------|
| `file` | string | `assets/media/` からの相対パス（空文字でローカルファイルなし） |
| `title` | string | メディアタイトル |
| `desc` | string | 説明・サブタイトル |
| `artist` | string | アーティスト名 |
| `videoid` | string | YouTube 動画 ID（空文字で YouTube なし） |
| `image` | string | カバー画像ファイル名（`assets/images/` 配下） |
| `start` | string \| number | 再生開始位置（秒数 または `H:MM:SS` 形式） |
| `end` | string \| number | 再生終了位置（同上） |
| `volume` | number \| string \| null | 再生ボリューム（任意。検証は JS 側で実施） |
| `track` / `id` | number | トラック番号（任意。アイテム識別用） |

**サーバーが `filter_media()` で正規化する内容:**
- `start` / `end` を秒数（float）に変換
- `image` が `IMAGES_DIR` に存在しない場合は空文字にリセット
- `image` に対応するサムネイル（`{filename}_thumb.{ext}` 等）が存在する場合 `thumb` フィールドを追加
- `file` が `MEDIA_DIR` に存在する場合は相対パスに変換（存在しない場合は空文字にリセット）

---

### 5-2. `options` スキーマ

プレイリスト JSON の `options` キーに格納されるプレイバックオプション。

| フィールド | 型 | デフォルト | 説明 |
|------------|-----|-----------|------|
| `autoplay` | bool | — | 自動再生 |
| `random` | bool | false | ランダム再生 |
| `seek` | bool | false | シーク再生（`start`/`end` を有効化） |
| `dark` | bool | false | ダークモード初期値 |
| `background` | string | `""` | 背景画像 URL または色 |
| `caption` | string | `"%artist% - %title% - %desc%"` | キャプション書式（`%field%` プレースホルダー） |
| `playlist` | string | `"%artist% - %title%"` | プレイリスト表示書式 |

---

### 5-3. `AmbientData` JS グローバル変数スキーマ

PHP → JavaScript へ `set_localize_script()` で渡されるデータ。

```js
var AmbientData = {
  playlists: {          // キー: JSONファイル名, 値: 相対パス
    "example.json": "./assets/example.json",
    ...
  },
  currentPlaylist: "example.json",  // プレイリストが1つの場合のみ設定
  imageDir: "./assets/images/",     // 画像ディレクトリ（画像が存在する場合のみ）
  debug: true                       // DEBUG_MODE が true の場合のみ
};
```

---

### 5-4. 翻訳 JSON スキーマ

`assets/lang*.json` に配置する。ファイル名のパターンでキーが決定される。

| ファイル名 | 言語キー | 説明 |
|-----------|---------|------|
| `lang.json` | `origin` | ベース言語（英語） |
| `lang-ja.json` | `ja` | 日本語翻訳 |
| `lang-{suffix}.json` | `{suffix}` | 任意言語 |

**ファイル内部構造:**

```json
{
  "$language": "日本語",       // 言語表示名（UI に表示）
  "原文テキスト": "翻訳テキスト",
  ...
}
```

`$language` キーはロード時に除去され `languages[$key]['name']` に格納される。  
翻訳テキストが空文字の場合は原文が使用される（`__()` の挙動）。

---

## 6. 設定・定数一覧

`index.php` で定義される定数:

| 定数名 | 値（デフォルト） | 説明 |
|--------|----------------|------|
| `APP_ROOT` | `realpath('./').'/'` | アプリケーションルートの絶対パス |
| `ASSETS_DIR` | `APP_ROOT.'assets/'` | アセットディレクトリの絶対パス |
| `MEDIA_DIR` | `ASSETS_DIR.'media/'` | メディアファイルディレクトリの絶対パス |
| `IMAGES_DIR` | `ASSETS_DIR.'images/'` | 画像ディレクトリの絶対パス |
| `VIEWS_DIR` | `APP_ROOT.'views/'` | ビューディレクトリの絶対パス |
| `LOGS_DIR` | `APP_ROOT.'logs/'` | ログディレクトリの絶対パス |
| `DEBUG_MODE` | `true` | デバッグモードフラグ（本番時は `false` 推奨） |

**注意:** `DEBUG_MODE` が `true` の場合、リクエストごとにログが消去・再作成される（`clear_log()` による）。

---

## 7. 多言語対応の仕組み

### 言語ファイルの検出と読み込み

1. `load_translation_data()` が `assets/` ディレクトリ内の `lang*.json` を `glob()` で検索
2. ファイル名から言語キーを抽出（`lang.json` → `origin`, `lang-ja.json` → `ja`）
3. 各ファイルを `$this->languages[$key]` に格納（`file`, `name`, `data` の連想配列）
4. `origin` が先頭になるようにソート

### 現在言語の決定

優先順位:
1. Cookie `lang` が設定されている場合はその値を使用
2. Cookie がない場合はデフォルト `origin`（英語）

セッション（`$_SESSION['lang']`）によるキャッシュはコード上でコメントアウトされており、現在は未使用。

### 翻訳テキストの使用

- PHP テンプレート: `__('text')` グローバル関数（`functions.php` 経由）
- 翻訳定義に存在しないキーはデバッグログに `Undefined translated text:` として記録される

### 言語の切り替え

JS 側から Cookie `lang` を設定し、ページをリロードすることで切り替える。  
`custom.php` から `amp_set_var('translation_data', ...)` で翻訳データを丸ごと上書きすることも可能。

---

## 8. 既知の課題・技術的負債

### セキュリティ

| 課題 | 箇所 | 詳細 |
|------|------|------|
| シェルコマンドインジェクションリスク | `create_symlink()` | `exec()` で `mklink`/`ln` を実行。引数は `FILTER_SANITIZE_FULL_SPECIAL_CHARS` でサニタイズされているが、`is_local()` の判定精度（サブネット一致）が粗い |
| `DEBUG_MODE` デフォルト `true` | `index.php` | 本番デプロイ時に手動で `false` に変更する必要がある。設定ファイル外部化の仕組みがない |
| CSRF 対策なし | `api.php` / POST エンドポイント | `upsert_playlist()` / `create_symlink()` に CSRF トークン検証が存在しない |
| 認証機構の未実装 | `pre_processing_requested_api()` | 認証フックのスタブが存在するが実装されていない（常に `$result = true`） |

### アーキテクチャ

| 課題 | 箇所 | 詳細 |
|------|------|------|
| URL リライト設定の依存 | `route_endpoint()` | Apache `.htaccess` または Nginx リライト設定がないと API ルーティングが機能しない。設定ファイルが同梱されていない（`nginx-sample.conf` は参考のみ） |
| 旧エントリポイントの残存 | `src/_index.php` | v1 以前の実装と思われるファイルが残存。`APP_ROOT`/`LOGS_DIR` 等の定数が未定義の状態で参照されており、単体ではエラーになる |
| Singleton の強依存 | `$GLOBALS['ambient']` | `functions.php` 内でグローバル変数経由でインスタンスにアクセスしており、テストが困難 |
| Trait への責務集中 | `utils.php` | ファイル I/O・ロギング・翻訳・フィルタリング等が 1 つの Trait に混在。300 行超 |
| JS へのデータ受け渡しが静的プロパティ | `render.php` | `$amp_scripts` が `static` であるため、複数インスタンス想定時に衝突する可能性がある（Singleton なので現状は問題ないが設計として脆弱） |

### 機能的な制約

| 課題 | 箇所 | 詳細 |
|------|------|------|
| YAML 対応未完了 | `api.php`, `utils.php` | YAML プレイリストのコードが存在するがコメントアウト。PECL yaml 依存により実質 JSON 専用 |
| `volume` フィールドの型が不定 | `example.json` | `10`, `"2"`, `null`, `""` など複数の型が混在しており、JS 側のバリデーションが複雑になる |
| `filter_params()` が未活用 | `utils.php` | メソッドは定義されているが、`route_endpoint()` 内では直接 `filter_input_array()` を呼び出しており、`filter_params()` の利用は限定的 |
| ログのリセット方式 | `clear_log()` | リクエストごとにデバッグログを全消去するため、連続リクエストのログ追跡ができない |
| `set_localize_script()` がオーバーライド方式 | `render.php` | 複数回呼び出すと後勝ちになる（文字列の結合ではなく代入）。複数データの注入が難しい |

---

## 付録: npm ビルドコマンド

| コマンド | 説明 |
|---------|------|
| `npm run tw-dev` | Tailwind CSS の開発用ウォッチビルド（`./dist/tailwindcss.css` へ出力） |
| `npm run tw-build` | Tailwind CSS の本番用ミニファイビルド（`./dist/tailwindcss.min.css` へ出力） |

`tailwind.config.js`:
- JIT モード有効
- コンテンツ対象: `src/**/*.js`, `views/**/*.{php,html}`, `dist/*.js`
- ダークモード: `class` ベース
- プラグイン: Flowbite
