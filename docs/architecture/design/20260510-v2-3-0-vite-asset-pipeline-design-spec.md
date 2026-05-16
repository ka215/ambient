# Ambient v2.3.0 Vite Asset Pipeline Design Spec

> ドキュメント ID: 20260510-v2-3-0-vite-asset-pipeline  
> 作成日: 2026-05-10  
> 担当エージェント: Design Agent  
> ステータス: Draft

---

## 1. 目的

### 1-1. 背景

Ambient v2.2.x 時点のフロントエンド資産管理は、TypeScript / Tailwind / SCSS が別々のビルド経路で運用されている。

- TypeScript: `tsc`
- Tailwind CSS: `tailwindcss` CLI
- SCSS: npm scripts に未統合
- 公開資産配置: `dist/` と `views/css/` に分散

この構成では、UI 改修時の即時確認性が低く、開発時の反復速度が不足している。  
また、公開資産の最小化という観点でも不要な生成物が混在している。

### 1-2. 目的

1. Vite を導入し、ローカル開発時の HMR を有効化する。
2. TypeScript / Tailwind / SCSS のビルド導線を単一の asset pipeline に統合する。
3. 公開用構成を `dist/assets/*` に集約し、不要な成果物を配信対象から除外する。
4. PHP アプリケーション本体は維持しつつ、フロント資産配信のみ dev/prod 切替可能にする。

### 1-3. 非目的

- PHP アプリケーションの SPA 化
- Nuxt / React / Vue への移行
- API 構造の変更
- Cloudflare Pages / Workers への移行
- v2.3.0 内での大規模 UI 改修

---

## 2. 現状整理

### 2-1. 現在のソース資産

| 区分 | 現在のソース |
|---|---|
| アプリ JS | `src/scripts/ambient.ts` |
| 型定義 | `src/scripts/types/ambient.ts` |
| Tailwind entry | `src/styles/tailwind.css` |
| カスタムスタイル | `src/styles/ambient.scss` |
| 旧コンパイル済み CSS | `src/styles/ambient.css` |

### 2-2. 現在の公開資産

| 区分 | 現在の出力 / 配信先 |
|---|---|
| アプリ JS | `dist/scripts/ambient.js` |
| 型生成物 | `dist/scripts/*.d.ts`, `dist/scripts/types/*` |
| Tailwind CSS | `dist/tailwindcss.css`, `dist/tailwindcss.min.css` |
| カスタム CSS | `views/css/ambient.css` |
| Vendor CSS | `dist/flowbite.min.css` |
| Vendor JS | `dist/flowbite.min.js`, `dist/vendor/sortable.min.js` |

### 2-3. 現状の課題

1. **ビルド経路が分散**
   - TypeScript と Tailwind と SCSS が別管理
- `views/css/ambient.css` の生成経路が `package.json` に未定義

2. **公開資産が分散**
   - `dist/` と `views/css/` の二重管理
   - vendor 参照も `dist/` と `node_modules` fallback が混在

3. **不要な公開候補が存在**
   - `dist/scripts/types/*.js`
   - `*.d.ts`
   - `*.map`
   - `src/styles/ambient.css`

4. **開発体験が弱い**
   - CSS / DOM 調整時に HMR がなく、毎回フル更新前提

---

## 3. 設計方針

### 3-1. 基本方針

- Vite は **PHP アプリの置換ではなく asset pipeline** として導入する
- 開発時のみ Vite dev server を使う
- 公開時は `vite build` の成果物だけを使う
- PHP は asset の読込先だけを dev/prod で切り替える

### 3-2. 公開用資産の集約方針

公開資産は最終的に以下へ集約する。

```text
dist/
  assets/
    app.js
    app.css
    vendor-*.js
    vendor-*.css
```

以後、PHP テンプレートは `views/css/ambient.css` や `dist/tailwindcss.min.css` を直接読まない。

### 3-3. vendor 取り扱い方針

`flowbite` と `sortablejs` は **bundle 内包** とする。

理由:

- 公開環境で `node_modules` 直参照を不要にできる
- 依存の読み込み順を Vite 側で制御できる
- dev/prod の差分を減らせる

---

## 4. 目標構成

### 4-1. ソース構成

```text
src/
  scripts/
    ambient.ts
    types/
      ambient.ts
  styles/
    tailwind.css
    ambient.scss
```

### 4-2. entrypoint 方針

- JS entry: `src/scripts/ambient.ts`
- CSS source:
  - `src/styles/tailwind.css`
  - `src/styles/ambient.scss`

v2.3.0 の初回実装では、`ambient.ts` から上記 2 ファイルを直接 import する。  
将来的に Tailwind v4 と Sass の取り回しをさらに整理できるタイミングで、必要なら統合用 style entry を追加する。

### 4-3. 出力構成

```text
dist/
  assets/
    app-[hash].js
    app-[hash].css
    chunks/...
  manifest.json
```

### 4-4. PHP 側の読込方式

#### 開発時

- Vite dev server の URL を参照
- HMR client と entry を直接差し込む

例:

```html
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/src/scripts/ambient.ts"></script>
```

#### 公開時

- `dist/manifest.json` を読み、対応する JS/CSS を出力
- `asset()` 相当の helper を PHP 側へ追加する

---

## 5. 廃止・整理対象

### 5-1. 公開配信対象から除外するもの

- `dist/scripts/types/*.js`
- `dist/scripts/types/*.d.ts`
- `dist/scripts/*.d.ts`
- `dist/scripts/*.map`
- `dist/tailwindcss.css`
- `dist/tailwindcss.min.css`
- `views/css/ambient.css`

### 5-2. リポジトリ上で整理対象とするもの

- `src/styles/ambient.css`
  - `ambient.scss` の旧コンパイル成果物であり、ソースとして不要
- `dist/flowbite.min.js`
- `dist/flowbite.min.css`
- `dist/vendor/sortable.min.js`

### 5-3. 維持するもの

- `src/scripts/types/ambient.ts`
  - 実行資産ではなく、型定義ソースとして維持
- `views/images/*`
- `views/fonts/*`

---

## 6. 実装方針

### 6-1. Vite 導入

追加予定:

- `vite`
- `sass`

必要に応じて:

- `vite-plugin-full-reload` または PHP テンプレート変更検知用の簡易 reload 設定

### 6-2. CSS 統合

責務:

- `ambient.ts` から Tailwind / custom SCSS を直接 import
- Vite build の CSS 抽出機能で公開用 CSS を 1 本化
- 公開配信面は `dist/assets/ambient.css` に集約

### 6-3. JS 統合

`ambient.ts` 内で `flowbite` と `sortablejs` を module import する。

目標:

- `functions.php` で個別 vendor script を直書きしない
- `window.Sortable` 前提を減らす

### 6-4. PHP asset loader

追加する責務:

- dev server 利用時:
  - HMR client
  - module entry
- production:
  - `manifest.json` から JS/CSS のパス解決

候補実装箇所:

- `functions.php`
- 必要なら `src/render.php` 補助関数

### 6-5. 環境変数

開発時切替用に以下を追加候補とする。

- `VITE_DEV_SERVER_URL=http://localhost:5173`
- `ASSET_MODE=dev|build`

本番では未設定時に build mode を既定とする。

---

## 7. 段階的移行計画

### Phase 1: 基盤導入

- `vite.config.ts` 作成
- `app.scss` 作成
- `ambient.ts` を Vite entry 化
- `npm run dev`
- `npm run build`
- PHP から dev/prod 切替読込

**DoD**
- `ambient.ts` と CSS が Vite で配信される
- HMR でスタイル更新が即時反映される
- 本番ビルドでアプリが現状同等に動く

### Phase 2: 公開資産整理

- `views/css/ambient.css` 参照廃止
- `dist/tailwindcss*.css` 参照廃止
- vendor 個別 script/css 参照廃止
- manifest ベースに一本化

**DoD**
- PHP テンプレートが `dist/assets/*` のみ参照
- `node_modules` への公開参照が消える

### Phase 3: 不要ファイル整理

- `src/styles/ambient.css` 廃止
- `dist/scripts/types/*` 公開不要物の除外
- `.gitignore` と release 手順の更新

**DoD**
- 公開資産が最小構成になる
- 手動ビルド手順が Vite 前提へ置換される

---

## 8. リスクと対策

### 8-1. `ambient.ts` のグローバル依存

リスク:
- 現在のコードは `window.AmbientData` や DOM 直参照前提が多い

対策:
- まずは即時実行 module として移行
- グローバル変数の注入契約は維持

### 8-2. vendor 読込順の差異

リスク:
- Flowbite / Sortable の初期化順が変わる

対策:
- import 順を固定
- playlist reorder / drawer / modal の E2E を重点確認

### 8-3. PHP テンプレート変更の HMR 非対応

リスク:
- CSS/JS は HMR されても PHP view は即時反映されない

対策:
- v2.3.0 では asset HMR を主目的とする
- PHP view は必要に応じてフルリロードで運用

### 8-4. 公開ビルドの参照切れ

リスク:
- manifest 解決ミスで CSS/JS が読めなくなる

対策:
- build mode 専用の smoke test を追加
- `functions.php` に fallback と明確なエラーログを入れる

---

## 9. 検証計画

### 9-1. ビルド検証

- `npm run dev`
- `npm run build`

### 9-2. 機能回帰検証

最低限対象:

- 初期表示
- YouTube 再生
- ローカル media 再生
- playlist drawer
- settings drawer
- options modal
- cloud MyPlaylist 保存/読込
- reorder/delete mode

### 9-3. E2E 優先シナリオ

- `sc-007-management`
- `sc-009-full-window-menu`
- `sc-010-cloud-myplaylist-regression`
- `sc-011-playlist-mode-slice-ab`
- `sc-012-local-media-playback`

---

## 10. 推奨結論

v2.3.0 では、以下を正式な目標構成とする。

1. Vite を asset pipeline として導入する
2. `ambient.ts` を唯一の JS runtime entry とする
3. `ambient.scss` + Tailwind を `app.css` に統合する
4. `flowbite` / `sortablejs` は bundle 内包に切替える
5. 公開資産は `dist/assets/*` に集約する
6. PHP は dev/prod で asset の参照先だけを切替える

この構成により、開発時の反復速度を大幅に上げつつ、公開用配信面は最小化できる。

---

## 11. 実装進捗メモ

2026-05-10 時点:

- `vite.config.mts` を追加済み
- PHP 側は `VITE_DEV_SERVER_URL` / `dist/manifest.json` を見て dev/prod を切替済み
- runtime entry は `src/scripts/ambient.ts`
- style entry は `src/styles/app.scss`
- `app.scss` から `tailwind.css` と `ambient.scss` を統合済み
- build 出力は `dist/manifest.json` と `dist/assets/*` に集約済み
- `flowbite` / `sortablejs` は npm import 経由へ移行済み
- `src/styles/ambient.css` / `ambient.css.map` は廃止
- `views/css/ambient.css` の Vite bundle 依存は解消済み
- `views/css/ambient.css` は legacy fallback 専用ファイルとして明示化済み

2026-05-16 / v2.3.3 時点:

- `views/css/ambient.css` は削除済み
- `functions.php` の旧 CSS fallback 分岐は削除済み
- build モードは `dist/manifest.json` と `dist/assets/*` を必須成果物として扱う

未完了:

- Apache reverse proxy 配下の HMR WebSocket 安定化
- Vite 構成へ合わせた E2E 一式の再実行と記録
