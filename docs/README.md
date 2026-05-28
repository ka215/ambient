# Ambient v2.0.0

Ambient は、以下を単一UIで扱えるセルフホスト型ハイブリッドメディアプレイヤーです。

- YouTube IFrame Player API による YouTube 再生
- HTML5 audio/video によるローカルメディア再生

v2.0.0 は、TypeScript 化したランタイム統合とクロスブラウザ E2E 基盤を確立した最初のベースラインです。

## v2.0.0 の主な変更

- フロントエンド実装を TypeScript 化（`src/scripts/ambient.ts`）
- 実行スクリプトをビルド成果物へ統一（`dist/scripts/ambient.js`）
- Playwright E2E の6シナリオ基盤を整備（Chromium/Firefox/WebKit）
- YouTube ライフサイクルを DOM 属性で観測可能に変更
  - `data-yt-phase`
  - `data-yt-seq`
  - `data-yt-error`
- Phase 1（移行・統合・検証）を完了

## ディレクトリ概要

- `index.php`: エントリポイント
- `src/`: PHPコアと TypeScript ソース
- `views/`: PHPコンポーネントテンプレート
- `assets/`: プレイリスト・言語ファイル・メディア/画像
- `dist/`: ビルド成果物
- `tests/e2e/`: Playwright シナリオ・fixture・ユーティリティ
- `docs/`: 設計・引き継ぎ・テストレポート

## 動作要件

- PHP 8.4 以上（推奨: 8.x）
- URLリライト設定済みの Apache または Nginx
- Node.js / npm（ビルド・テスト実行用）

## ローカル起動（簡易）

1. Webルート配下へ clone
2. 対象ディレクトリを Web サーバーで公開
3. ブラウザでアクセス（例: `http://dev2.ka2.org/amp/`）

Windows + XAMPP での開発を前提に、すぐ動かせる構成です。

## 開発コマンド

```bash
npm run ts-dev        # TypeScript watch
npm run ts-build      # TypeScript を dist/ へ出力
npm run tw-dev        # Tailwind watch
npm run tw-build      # Tailwind minify build
npm run test:e2e      # Playwright E2E 実行
npm run test:e2e:debug
```

## プレイリスト仕様（要点）

プレイリストは `assets/` 配下の JSON を使用します。

- テンプレート: `assets/PlayList.json`
- 言語定義: `assets/langs/lang.json`, `assets/langs/lang-ja.json`（後方互換として `assets/lang*.json` も読み込み可）
- メディア指定:
  - YouTube: `videoid`
  - ローカル: `file`（`assets/media` からの相対）

JSON Schema:

- https://ka2.org/schemas/ambient.json

## v2.0.0 テストベースライン

- SC-001: 初期化
- SC-002: 再生/一時停止
- SC-003: 前後ナビゲーション
- SC-004: 音量フェーダー
- SC-005: シャッフルトグル
- SC-006: YouTube 埋め込み表示

上記を Chromium / Firefox / WebKit で検証済みです。

## 主要ドキュメント

- v2システムサマリ: `docs/architecture/v2-system-summary.md`
- YouTube DOM signal 仕様（英語）: `docs/architecture/design/youtube-player-dom-signal-spec.md`
- YouTube DOM signal 仕様（日本語）: `docs/architecture/design/youtube-player-dom-signal-spec.ja.md`
- Phase 1 完了レポート: `docs/operations/test-reports/20260503-phase1-completion-report.md`

## ライセンス

MIT License
