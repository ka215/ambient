# Ambient Vite 開発・ビルド運用ランブック

日付: 2026-05-10  
対象ブランチ: `feature/v2.3.0-vite`

## 1. 目的

このドキュメントは、Ambient に Vite の asset pipeline を導入した後の運用手順をまとめたものです。

対象:

- ローカル開発時の Vite dev server 運用
- Apache reverse proxy を使った開発環境構成
- 商用ビルド相当の build 手順
- 動作確認ポイントと注意点

---

## 2. 現在の asset 構成

### 2-1. エントリポイント

- JavaScript runtime entry
  - `src/scripts/ambient.ts`
- CSS entry
  - `src/styles/app.css`

### 2-2. CSS の構成

`src/styles/app.css` は現在、以下を取り込みます。

- `src/styles/tailwind.css`
- `src/styles/ambient.scss`

補足:

- 旧 `views/css/ambient.css` にあった表示・レイアウト定義は `src/styles/*` へ移管済みです
- `views/css/ambient.css` は build fallback 用の旧資産としてのみ残しています
- `views/css/ambient.css` には legacy fallback 専用コメントを付与し、正本ではないことを明示しています

### 2-3. ビルド成果物

現在の build 出力先は以下です。

- `dist/manifest.json`
- `dist/assets/ambient.js`
- `dist/assets/ambient.css`
- `dist/assets/mplus-1p-regular.*`

旧来の以下の成果物は、今後の正式な公開構成には含めません。

- `dist/scripts/*`
- `dist/scripts/types/*`
- `dist/tailwindcss.css`
- `dist/tailwindcss.min.css`
- `dist/flowbite.min.js`
- `dist/flowbite.min.css`
- `dist/vendor/sortable.min.js`

---

## 3. PHP 側のモード切替

`functions.php` にて、PHP 側が dev/build の asset 読込を切り替えます。

### 3-1. 開発モード

開発モードでは以下を読み込みます。

- `@vite/client`
- `VITE_DEV_SERVER_URL` 配下の `src/scripts/ambient.ts`

### 3-2. build モード

build モードでは以下を読み込みます。

- `dist/manifest.json`
- `dist/assets/*`

### 3-3. 関連する環境変数

- `ASSET_MODE`
  - `dev` または `build`
- `VITE_DEV_SERVER_URL`
  - 例: `https://dev-amp.ka2.org/vite`

ローカル開発時の推奨設定:

```env
ASSET_MODE=dev
VITE_DEV_SERVER_URL=https://dev-amp.ka2.org/vite
```

商用ビルド相当の確認時の推奨設定:

```env
ASSET_MODE=build
```

`VITE_DEV_SERVER_URL` が残っていても、`ASSET_MODE=build` を優先させる運用で問題ありません。

---

## 4. ローカル開発手順

### 4-1. 前提

- Apache のローカル vhost が以下で動作していること
  - `https://dev-amp.ka2.org/`
- Node 依存がインストール済みであること
- Vite dev server を `127.0.0.1:5174` で起動すること

### 4-2. 起動コマンド

```bash
npm run dev
```

必要に応じて以下も実行します。

```bash
npm run typecheck
npm run build
```

### 4-3. アクセス方法

Vite の root URL をアプリ本体として使ってはいけません。

- アプリ本体ではない URL:
  - `http://localhost:5174/`
- 正しい確認先:
  - `https://dev-amp.ka2.org/`

開発モード時に期待される asset request:

- `https://dev-amp.ka2.org/@vite/client`
- `https://dev-amp.ka2.org/vite/src/scripts/ambient.ts`

---

## 5. Apache reverse proxy 要件

Vite は現在、Apache HTTPS vhost 配下の reverse proxy 前提で運用します。

### 5-1. 必要な proxy ルート

最低限、以下を `http://127.0.0.1:5174/` へ転送する必要があります。

- `/vite/`
- `/@vite/`
- `/src/`
- `/node_modules/`

### 5-2. WebSocket upgrade

HMR 用 websocket には upgrade 転送が必要です。

典型例:

```apache
RewriteEngine On
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteRule ^/vite/(.*)$ ws://127.0.0.1:5174/$1 [P,L]
```

### 5-3. 現状の扱い

現時点では:

- JS/CSS 読込は動作
- HMR websocket は時間経過後に不安定になる場合あり

影響:

- 手動の UI 動作確認は継続可能
- 完全な hot reload は不安定なことがある

これは現時点では blocker 扱いではありません。

---

## 6. 商用ビルド手順

### 6-1. build コマンド

```bash
npm run build
```

### 6-2. 期待される結果

build 後の `dist/` は以下に集約されます。

- `manifest.json`
- `assets/*`

`emptyOutDir: true` が有効なため、旧 `dist` 資産は build 時に掃除されます。

### 6-3. 確認項目

build 後に以下を確認します。

1. `dist/manifest.json` が存在する
2. `dist/assets/ambient.js` が存在する
3. `dist/assets/ambient.css` が存在する
4. フォント asset が出力されている
5. `ASSET_MODE=build` でアプリが正常表示される

---

## 7. 推奨確認フロー

### 7-1. 開発モード確認

1. `.env` を以下に設定

```env
ASSET_MODE=dev
VITE_DEV_SERVER_URL=https://dev-amp.ka2.org/vite
```

2. Vite 起動

```bash
npm run dev
```

3. `https://dev-amp.ka2.org/` を開く

4. 以下を確認

- ベース UI が崩れない
- drawer / modal の見た目が正しい
- playlist mode UI が動作する
- local media 再生が動作する

### 7-2. 商用ビルド相当の確認

1. `.env` を以下に設定

```env
ASSET_MODE=build
```

2. build 実行

```bash
npm run build
```

3. Ambient を再読み込み

4. 以下を確認

- `vite` 系 URL を読みに行っていない
- `dist/assets/*` を読んでいる
- スタイル崩れがない
- local media / YouTube 再生が動く

---

## 8. E2E 状況

Vite 移行後の現状:

- `typecheck`: 通過
- `build`: 通過
- 主要 E2E シナリオ: 通過

補足:

- 全件 Playwright 実行では、Chrome で teardown timeout の flaky が 1 件出ることがある
- 該当シナリオの単体再実行では通過済み
- 現時点では機能不具合ではなく、テスト実行基盤由来の揺れとして扱う

---

## 9. 注意点

### 9-1. build fallback 用の旧 CSS が残っている

`views/css/ambient.css` は Vite bundle の入力ではありません。
ただし `manifest.json` が使えない場合の旧 fallback 経路のため、リポジトリ内には残っています。

運用ルール:

- 正本の UI スタイル修正は `src/styles/*` に対して行う
- `views/css/ambient.css` は fallback 維持目的以外では編集しない

### 9-2. HMR websocket は未安定

websocket が切れた場合:

- 手動確認は継続可能
- 変更反映はリロード前提になる場合がある

### 9-3. 商用環境は Vite dev server に依存しない

商用相当では必ず以下を使います。

- `ASSET_MODE=build`
- `dist/manifest.json`
- `dist/assets/*`

本番配信で以下に依存してはいけません。

- `/vite/*`
- `@vite/client`
- `src/scripts/ambient.ts`

---

## 10. 次の推奨作業

### 10-1. 完了済み

1. `ASSET_MODE=build` で商用ビルド相当の確認を行う
2. dev/build 間で見た目差異がないか確認する
3. Vite 導入差分をコミットする

### 10-2. v2.3.0 の明確な残件

4. 必要なら別タスクで Apache websocket/HMR の安定化を行う

補足:

- 現時点では blocker ではない
- 手動の UI 確認や build 検証は継続可能
- 主に開発効率改善のための残件として扱う

### 10-3. v2.4.0 以降の候補

5. 旧 fallback 経路の扱いを整理し、最終的な削除方針を実施する

現時点の整理:

- `views/css/ambient.css` は legacy fallback 専用として明示化済み
- `functions.php` の旧 fallback 分岐は安全弁として残置
- 実削除は次のマイナーアップ候補 (`v2.4.0`) とする
