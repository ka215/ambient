# Ambient v2 システムアーキテクチャサマリ

> 作成日: 2026-05-04  
> 対象バージョン: v2.0.0（package.json より）  
> 目的: v2 開発における設計・実装・レビューエージェントのリファレンス

---

## 1. アプリケーション概要

### 目的

Ambient は、ローカル環境またはセルフホスト環境で動作するメディアプレイヤー Web アプリケーション。  
JSON 形式のプレイリストファイルを読み込み、ローカルメディアファイルまたは YouTube 動画を再生する。  
複数プレイリスト・多言語・カテゴリ選択・ループ/シャッフル/シーク再生などの機能を持つ。

v2.0.0 は、実行ランタイムを TypeScript ビルド成果物へ統一し、E2E 基盤を整備した初回ベースラインである。

### 技術スタック

| 区分 | 技術 |
|------|------|
| サーバーサイド | PHP（名前空間・Trait・Singleton パターン） |
| テンプレートエンジン | PHP インクルードベース（フレームワーク不使用） |
| フロントエンド CSS | Tailwind CSS v3 + Flowbite v1 |
| フロントエンド JS | TypeScript（ソース: src/scripts/ambient.ts） |
| ランタイム配信 | dist/assets/ambient.js（Vite 出力） |
| テスト | Playwright（@playwright/test） |
| データ形式 | JSON（プレイリスト・翻訳データ） |
| ビルドツール | npm（tsc, tailwindcss CLI） |
| 対象 Web サーバー | Apache / Nginx（URL リライト設定が前提） |

### 動作環境

- PHP 7.4 以上（推奨: 8.x）
- ローカル開発環境: XAMPP（Windows）が主要想定
- Node.js / npm（TypeScript・Tailwind・E2E 実行に必要）

---

## 2. ディレクトリ構成と各役割

```
amp/
├── index.php              エントリポイント。定数定義・オートロード・Ambient 起動
├── autoload.php           spl_autoload_register による名前空間オートローダー
├── functions.php          グローバル関数定義（ビューヘルパー等）
├── custom.php             ユーザー固有カスタマイズフック
├── package.json           npm スクリプト定義・バージョン情報
├── tailwind.config.js     Tailwind CSS ビルド設定
│
├── src/                   PHP ソースコード
│   ├── Ambient.php        メインクラス（Singleton）。3 Trait を use
│   ├── api.php            Trait api。API エンドポイント実装
│   ├── render.php         Trait render。テンプレート描画・JS データ受け渡し
│   ├── utils.php          Trait utils。ユーティリティ・翻訳・プレイリスト検索等
│   ├── scripts/
│   │   ├── ambient.ts     フロントエンド TypeScript ソース
│   │   └── types/         フロントエンド型定義
│   └── styles/
│       ├── tailwindcss.css    Tailwind ビルド入力
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
│   ├── css/               ビュー固有 CSS
│   ├── fonts/             フォントファイル置き場
│   └── images/            UI 用画像
│
├── assets/                静的アセット・データファイル
│   ├── *.json             プレイリスト JSON（lang*.json 以外）
│   ├── lang.json          英語翻訳テキスト定義（ベース言語）
│   ├── lang-ja.json       日本語翻訳テキスト定義
│   ├── PlayList.json      テンプレート用プレイリストサンプル
│   ├── images/            メディアカバー画像置き場
│   └── media/             メディアファイル置き場
│
├── dist/                  TypeScript / Tailwind のビルド成果物
│   └── scripts/           ambient.js ほか型定義・source map
├── tests/e2e/             Playwright シナリオ・fixture・ユーティリティ
├── docs/                  設計・仕様・運用ドキュメント
└── logs/                  デバッグログ
```

---

## 3. 実行時アーキテクチャ

### 3-1. サーバー側

- index.php がエントリポイント
- src/Ambient.php がコアクラス
- src/api.php / src/render.php / src/utils.php の Trait で責務分離
- views/layout.php から各 UI コンポーネントを描画

### 3-2. フロントエンド側

- ソース: src/scripts/ambient.ts
- ビルド出力: dist/assets/ambient.js
- 読み込み: functions.php の amp_footer() で Vite manifest の `src/scripts/ambient.ts` entry を参照

### 3-3. データフロー

1. PHP が AmbientData を JS グローバルとして注入
2. フロントが playlist API を取得して AMP_STATUS を更新
3. UI 要素と AMP_STATUS ウォッチャーを同期
4. 再生種別に応じて YouTube / audio / video を制御

---

## 4. YouTube DOM Signal モデル

E2E の待機安定化のため、YouTube ライフサイクルを document.body 属性へ反映する。

- data-yt-phase: 現在フェーズ
- data-yt-seq: 遷移ごとの単調増加カウンタ
- data-yt-error: エラーコード

代表フェーズ:

- idle
- api_loading
- api_loaded
- player_creating
- player_created
- player_ready
- playing / paused / ended
- api_error / player_error

関連仕様:

- docs/architecture/design/youtube-player-dom-signal-spec.md
- docs/architecture/design/youtube-player-dom-signal-spec.ja.md

---

## 5. テストアーキテクチャ

### 5-1. E2E 構成

- playwright.config.ts
- tests/e2e/fixtures/ambient-page.fixture.ts
- tests/e2e/scenarios/sc-001 - sc-006

### 5-2. 検証済みシナリオ

- SC-001 初期化
- SC-002 再生/一時停止
- SC-003 前後移動
- SC-004 ボリューム表示同期
- SC-005 シャッフルトグル
- SC-006 YouTube 埋め込み表示

### 5-3. ブラウザカバレッジ

- Chromium
- Firefox
- WebKit

v2.0.0 時点の基準実行で 18/18 pass を確認。

---

## 6. v1 からの主要差分

| 項目 | v1 | v2.0.0 |
|---|---|---|
| フロント実行源 | src/scripts/ambient.ts | dist/assets/ambient.js（Vite ビルド成果物） |
| 型安全性 | なし | tsc --strict ベース |
| E2E 基盤 | なし | Playwright 基盤あり |
| YouTube 待機 | 時間依存寄り | DOM signal + seq ベース待機 |

---

## 7. 運用上の注意

1. TypeScript ソース更新後は `npm run build` を必ず実行し、Vite manifest と `dist/assets/ambient.js` を同期する。
2. E2E 実行時は UI モード差異を避けるため、設定済み viewport を維持する。
3. Playwright 生成物（test-results/, playwright-report/）は Git 管理対象外。

---

## 8. 参照ドキュメント

- docs/architecture/v1-system-summary.md
- docs/operations/test-reports/20260503-phase1-m2-e2e-baseline.md
- docs/operations/test-reports/20260503-phase1-bundle-analysis.md
- docs/operations/test-reports/20260503-phase1-completion-report.md
