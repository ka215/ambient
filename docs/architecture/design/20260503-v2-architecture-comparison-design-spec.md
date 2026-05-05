# Ambient v2 アーキテクチャ比較設計書

> ドキュメント ID: 20260503-v2-architecture-comparison  
> 作成日: 2026-05-03  
> 担当エージェント: Design Agent  
> ステータス: Draft

---

## 1. 前提・目的・非目的

### 1-1. 前提

- 現行 Ambient v1 は PHP 8.x + バニラ JavaScript + Tailwind CSS v3 + Flowbite v1 で構成される。
- 動作環境は XAMPP（Windows ローカル）が主要想定であり、セルフホストが基本前提。
- プレイリスト JSON による静的データ管理が基盤であり、DB は存在しない。
- API は同一 PHP プロセスが兼務（`index.php` へのリライト）。
- v1 の UI/UX（1ページ完結型 SPA、5種ドロワー/メニュー/モーダル構成）は v2 でも維持する。

### 1-2. 目的

1. v2 における技術アーキテクチャの選択肢 A / B / C を定量的に比較し、推奨案を決定する。
2. フェーズ1（TypeScript 導入 + Playwright E2E 基盤確立）の実行計画を策定する。
3. フェーズ2以降への移行判断基準を定義する。

### 1-3. 非目的

- UI デザインの刷新（v1 互換を前提とする）
- DB 導入の検討（JSON ベース維持）
- CI/CD パイプラインの詳細設計（Playwright 導入は対象だが、デプロイ自動化は対象外）
- マルチユーザー認証機能の実装

---

## 2. A/B/C アーキテクチャ構成

### 案 A: 段階移行（推奨候補）

```
[フェーズ1]
ブラウザ
  └─ TypeScript (tsc/vite ビルド) ← ambient.js を TS 移行
  └─ Playwright E2E テスト基盤 (新規)
  
  サーバー: PHP 8.x (既存維持)
  ├─ index.php (エントリ)
  ├─ src/Ambient.php (Singleton/Trait)
  ├─ views/*.php (テンプレート)
  └─ assets/*.json (プレイリスト)

[フェーズ2]
ブラウザ
  └─ Nuxt3 + PrimeVue SPA
       ├─ composables/ (AMP_STATUS 相当のストア)
       └─ components/ (player / drawer / modal)
  
  サーバー: PHP → 薄い API レイヤーへ縮小
  └─ /api/* (playlist / filepath / symlink)

[フェーズ3]
Cloudflare Workers (API)
  ├─ /api/playlist
  └─ /api/filepath
Cloudflare R2 (アセット・メディア)
Cloudflare KV (設定・キャッシュ)
Nuxt3 SSG → Cloudflare Pages
```

### 案 B: Nuxt3 + PrimeVue 先行

```
[即時移行]
ブラウザ
  └─ Nuxt3 SPA (PrimeVue コンポーネント)
       ├─ stores/ampStatus.ts  (Pinia)
       ├─ components/Player.vue
       ├─ components/Drawer*.vue
       └─ pages/index.vue

  サーバー: PHP (当面 API として維持)
  └─ index.php → /api/* レスポンス専用化

[後続] Cloudflare Workers への移行
```

### 案 C: Cloudflare ネイティブ一気移行

```
[一気移行]
Cloudflare Workers (バックエンド全置換)
  ├─ /api/playlist (KV / R2 から読み込み)
  ├─ /api/filepath (R2 検索)
  └─ /api/symlink  (廃止 or Workers Routes で代替)

Cloudflare R2 (メディア・JSON ストレージ)
Cloudflare KV (言語・設定キャッシュ)
Cloudflare Pages (フロントエンド配信)
  └─ Nuxt3 SSG or SPA

PHP → 完全廃止
```

---

## 3. 比較表

### 評価軸と重み

| 評価軸 | 重み | 根拠 |
|--------|------|------|
| 開発速度（ローンチ遅延リスク） | 30% | ユーザー意向「ローンチ遅延を避ける」が最優先 |
| 移行リスク（v1 互換性・デグレ） | 25% | v1 挙動の互換性を重視する方針 |
| 運用性（セルフホスト維持性） | 15% | XAMPP 環境継続の可能性 |
| 将来拡張性 | 15% | Cloudflare 適合・スケール |
| 学習・移行コスト | 15% | チーム規模・現有スキルセット |

### 詳細比較

| 評価軸 | 案 A（段階移行） | 案 B（Nuxt3 先行） | 案 C（CF ネイティブ） |
|--------|-----------------|-------------------|----------------------|
| **開発速度** | ◎ フェーズ1は既存 PHP 維持のため最速。2〜3週間でTS+Playwright 基盤確立可能 | △ Nuxt3 移行に並行リスク。4〜6週間以上の初期構築 | ✗ CF Workers 学習+移行で8〜12週間以上 |
| **移行リスク** | ◎ フェーズ1では挙動変更なし。段階的検証が可能 | △ UI フレームワーク全取替。AMP_STATUS 互換層の実装が必要 | ✗ PHP API・ファイルシステム依存が全廃。大規模デグレリスク |
| **運用性** | ◎ XAMPP 継続。変更最小 | ○ Node.js ランタイム追加が必要。XAMPP 運用複雑化 | △ Cloudflare 依存。ローカル開発環境が wrangler に変わる |
| **将来拡張性** | ○ フェーズ2→3で段階的に Cloudflare 対応可能 | ◎ Nuxt3 が CF Pages/Nitro と親和性高い | ◎ CF ネイティブで最大スケール |
| **学習コスト** | ◎ TypeScript + Playwright のみ追加。リスク低 | △ Nuxt3 / PrimeVue / Pinia の学習 | ✗ CF Workers / R2 / KV + Nuxt3 の複合学習 |

### スコアリング（5点満点 × 重み）

| 評価軸 | 重み | 案 A | 案 B | 案 C |
|--------|------|------|------|------|
| 開発速度 | 0.30 | 5 × 0.30 = **1.50** | 3 × 0.30 = **0.90** | 1 × 0.30 = **0.30** |
| 移行リスク | 0.25 | 5 × 0.25 = **1.25** | 3 × 0.25 = **0.75** | 1 × 0.25 = **0.25** |
| 運用性 | 0.15 | 5 × 0.15 = **0.75** | 4 × 0.15 = **0.60** | 3 × 0.15 = **0.45** |
| 将来拡張性 | 0.15 | 4 × 0.15 = **0.60** | 5 × 0.15 = **0.75** | 5 × 0.15 = **0.75** |
| 学習コスト | 0.15 | 5 × 0.15 = **0.75** | 3 × 0.15 = **0.45** | 1 × 0.15 = **0.15** |
| **合計** | 1.00 | **4.85** | **3.45** | **1.90** |

---

## 4. スコアリングと推奨結論

### 推奨案: **案 A（段階移行）**

**総合スコア: 4.85 / 5.00**

#### 採用理由

1. **ローンチ遅延リスクが最小**: フェーズ1は既存 PHP・UI を一切変更しない。`ambient.js` を TypeScript に移行し、Playwright 基盤を追加するのみ。2〜3週間で完結可能（案 B の約半分、案 C の約1/4）。

2. **デグレリスクが最小**: v1 の `AMP_STATUS` ステートマシン・`AmbientData` データ注入・全 API エンドポイントは触らない。フェーズ1完了後に Playwright E2E が回帰防止網となり、フェーズ2以降のリスクも低減する。

3. **将来拡張への経路が確保される**: フェーズ2で Nuxt3 + PrimeVue へ移行し、フェーズ3で Cloudflare ネイティブ化するロードマップが明確。各フェーズで Go/No-Go を判断できる。

4. **学習コストの分散**: TypeScript → Nuxt3/PrimeVue → CF Workers の順に技術習得が積み重なる。全技術を同時に習得するリスクを回避できる。

#### 案 B を選ばない理由

Nuxt3 + PrimeVue への移行は UI コンポーネント全取替を伴い、`AMP_STATUS` の Pinia 化・YouTube IFrame API 統合・Flowbite 依存の除去が同時発生する。E2E テスト基盤なしでの大規模移行はデグレ検出が遅延し、ローンチリスクが高い。

#### 案 C を選ばない理由

CF Workers はローカルファイルシステムへのアクセスが不可能（R2 経由が必要）。`create_symlink()` や `get_filepath()` のような XAMPP ローカル依存 API の代替設計が必要となり、移行コストが最大。現時点でのリターンに見合わない。

---

## 5. フェーズ1 詳細計画

### 5-1. スコープ定義

**フェーズ1でやること:**
- `src/scripts/ambient.js` → TypeScript (`src/scripts/ambient.ts`) 移行
- ビルドツール: Vite（または tsc）導入
- Playwright E2E テスト基盤構築
- 主要シナリオの E2E テストスクリプト作成（優先度 High のみ）

**フェーズ1でやらないこと:**
- PHP コードへの変更
- UI コンポーネント変更（views/*.php）
- 新機能追加
- API エンドポイントの変更

### 5-2. WBS（作業分解構成）

```
フェーズ1
├── M1. TypeScript 移行基盤（Week 1）
│   ├── 1-1. ビルド環境セットアップ（Vite + TypeScript）          [1日]
│   ├── 1-2. tsconfig.json 設定（strict モード）                  [0.5日]
│   ├── 1-3. 型定義ファイル作成（AMP_STATUS / AmbientData 型）    [1日]
│   └── 1-4. ambient.js → ambient.ts 変換（型エラー修正込み）     [3日]
│
├── M2. Playwright 基盤構築（Week 1〜2）
│   ├── 2-1. playwright.config.ts 設定（ローカル XAMPP 前提）     [0.5日]
│   ├── 2-2. テストヘルパー・フィクスチャ設計                    [1日]
│   └── 2-3. CI なし（手動実行）での動作確認                      [0.5日]
│
├── M3. E2E シナリオ実装 優先度 High（Week 2）
│   ├── 3-1. 初期表示・プレイリスト読み込みシナリオ               [1日]
│   ├── 3-2. メディア選択・再生開始シナリオ（audio / video）      [1.5日]
│   ├── 3-3. ドロワー開閉・カテゴリ切替シナリオ                  [1日]
│   └── 3-4. 再生設定（ループ/ランダム/シーク）シナリオ           [1.5日]
│
└── M4. 検証・DoD 確認（Week 2〜3）
    ├── 4-1. 全 High シナリオ通過確認                            [1日]
    ├── 4-2. TypeScript strict エラー 0 確認                     [0.5日]
    ├── 4-3. v1 手動動作確認（回帰チェックリスト）               [1日]
    └── 4-4. 設計文書・テストレポート更新                        [0.5日]
```

### 5-3. マイルストーンと概算期間

| マイルストーン | 完了条件 | 概算期間 | 依存 |
|----------------|---------|---------|------|
| M1: TS 移行完了 | ambient.ts が tsc --noEmit でエラー 0 | Week 1 末（5営業日） | なし |
| M2: Playwright 基盤構築完了 | ローカルで playwright test が実行できる | Week 1〜2（3営業日） | M1 と並行可 |
| M3: E2E シナリオ実装完了 | High 優先シナリオ全件が pass | Week 2 末（5営業日） | M1, M2 |
| M4: フェーズ1 DoD 達成 | 全確認項目通過・ドキュメント更新完了 | Week 3 初（2営業日） | M3 |

**総期間見込み: 2〜3週間（10〜15営業日）**

### 5-4. 依存関係

```
1-1 (Vite セットアップ)
  └→ 1-2 (tsconfig)
       └→ 1-3 (型定義)
            └→ 1-4 (JS→TS 変換)
                 └→ M3 シナリオ実装
                      └→ M4 検証

2-1 (Playwright 設定)
  └→ 2-2 (ヘルパー)
       └→ 2-3 (動作確認)
            └→ M3 シナリオ実装（並行可）
```

---

## 6. テスト戦略

### 6-1. Playwright 対象シナリオと優先順位

| 優先度 | シナリオ ID | シナリオ名 | 対象コンポーネント | 根拠 |
|--------|-------------|-----------|------------------|------|
| **High** | SC-001 | 初期表示・プレイリスト自動読み込み | `AmbientData` 注入・`getPlaylistData()` | コア機能。失敗時は全機能停止 |
| **High** | SC-002 | audio メディア選択と再生開始 | `#btn-play`・`createPlayerTag('audio')` | 基本再生フロー |
| **High** | SC-003 | video メディア選択と再生開始 | `#btn-play`・`createPlayerTag('video')` | 基本再生フロー |
| **High** | SC-004 | 左ドロワー開閉・プレイリスト表示 | `#btn-playlist`・`#playlist-list-group` | 主要 UI 操作 |
| **High** | SC-005 | カテゴリフィルタ切替 | `#target-category`・`AMP_STATUS.ctg` | プレイリスト絞り込み |
| **High** | SC-006 | ランダム/ループ設定の切替と反映 | `#toggle-randomly`・`#toggle-loop` | 設定永続化 |
| **Medium** | SC-007 | YouTube 再生開始と IFrame 生成 | `createYTPlayer()`・`#embed-wrapper` | YouTube 依存（モック必要） |
| **Medium** | SC-008 | SeekPlay 再生（start/end 指定） | `filter_seeking()`・`seekPlayer()` | 高度な再生機能 |
| **Medium** | SC-009 | キャプション marquee 動作 | `#media-caption`・CSS Animation | 表示品質 |
| **Medium** | SC-010 | メディア追加フォーム（モーダル） | `#modal-options`・`upsert_playlist()` API | 書き込み系 API |
| **Medium** | SC-011 | カルーセル前後ナビゲーション | `#data-carousel-prev/next` | UI 操作 |
| **Low** | SC-012 | 言語切替（lang Cookie 変更） | `#language`・`load_translation_data()` | 多言語機能 |
| **Low** | SC-013 | ダークモード切替 | `#toggle-darkmode` | 表示設定 |
| **Low** | SC-014 | ボリューム変更と永続化 | `#default-volume` | 設定項目 |
| **Low** | SC-015 | シンボリックリンク作成（ローカルのみ） | `create_symlink()` API | ローカル限定機能 |

### 6-2. テスト実行方針

- フェーズ1 では **High 優先シナリオ（SC-001〜SC-006）** のみ実装・通過を必須とする。
- Medium / Low シナリオはフェーズ1完了後から順次追加。
- YouTube シナリオ（SC-007）は IFrame API のモックが必要なため Medium に分類。
- テスト実行環境: XAMPP ローカル（`http://localhost/amp/`）を前提とし、`playwright.config.ts` の `baseURL` で設定する。

### 6-3. カバレッジ目標

| フェーズ | High カバレッジ | Medium カバレッジ | Low カバレッジ |
|---------|----------------|-----------------|---------------|
| フェーズ1完了時 | **100%** | 0% | 0% |
| フェーズ2着手時 | 100% | **80%** 以上 | 任意 |

---

## 7. リスク一覧と緩和策

| ID | リスク | 影響度 | 発生確率 | 緩和策 |
|----|--------|--------|---------|--------|
| R-01 | TypeScript 変換時に暗黙的 any 多発しビルドが通らない | 中 | 高 | `noImplicitAny: false` で段階導入。strict は後工程で強化 |
| R-02 | Playwright が XAMPP ローカル環境で安定動作しない | 高 | 中 | `webServer` 起動オプションは使わず、事前起動前提で設定。retry 設定追加 |
| R-03 | YouTube IFrame API のテストが自動化困難 | 中 | 高 | SC-007 を Medium に降格。手動確認チェックリストで補完 |
| R-04 | フェーズ1完了後に PHP 側の変更要求が発生する | 高 | 中 | 変更影響を E2E で検出できる体制を維持。PHP 変更は個別レビュー必須 |
| R-05 | フェーズ2 の Nuxt3 移行でローカルファイル依存 API が壊れる | 高 | 中 | API インタフェース定義（OpenAPI 相当）をフェーズ1中に文書化 |
| R-06 | vite ビルド出力パスが既存 PHP の読み込みパスと不一致 | 中 | 中 | `vite.config.ts` で `outDir` を既存 `src/scripts/` に合わせる |
| R-07 | 開発者が TypeScript/Playwright 未経験の場合、工数見積もりが外れる | 中 | 低 | 初日に Spike タスク（1日）を設け、見積もりを再調整する |
| R-08 | フェーズ3 の Cloudflare Workers で `create_symlink()` 相当機能が実現不可 | 低 | 高 | フェーズ3では `is_local()` 判定機能を廃止または UI 側で無効化する方針を明確化 |

---

## 8. Go/No-Go 判定基準（フェーズ1 → フェーズ2）

### 8-1. フェーズ1 完了条件（DoD）

以下を **すべて** 満たした時点でフェーズ1完了とする。

| # | 判定項目 | 判定基準 | 確認方法 |
|---|---------|---------|---------|
| D-01 | TypeScript ビルド成功 | `tsc --noEmit` または `vite build` がエラー 0 | CI / 手動実行 |
| D-02 | E2E High シナリオ全通過 | SC-001〜SC-006 が全件 pass（flaky 0） | `playwright test` レポート |
| D-03 | v1 手動回帰テスト通過 | 回帰チェックリスト全項目が OK | テストレポート記録 |
| D-04 | 型定義文書化完了 | `AMP_STATUS`, `AmbientData`, API レスポンス型が `.d.ts` または設計書に定義済み | コードレビュー |
| D-05 | ドキュメント更新完了 | 本設計書の「フェーズ1完了」欄が更新されている | レビュー |

### 8-2. フェーズ2 Go 条件

フェーズ1 DoD を満たした上で、以下の条件を追加確認する。

| # | 条件 | 定量基準 |
|---|------|---------|
| G-01 | E2E テストスイートの安定性 | 直近5回の実行で pass 率 100%（flaky なし） |
| G-02 | TypeScript strict 移行状況 | `noImplicitAny: true` 状態でエラー 50件以下（段階的修正が現実的な範囲） |
| G-03 | フェーズ2設計文書の承認 | Nuxt3 移行設計書（別文書）がレビュー済みで Must Fix 0 |
| G-04 | API インタフェース定義の完成 | 全 4 エンドポイントの入出力型が定義済み |

### 8-3. フェーズ2 No-Go 条件（中止・延期基準）

以下のいずれかに該当する場合はフェーズ2への移行を延期し、フェーズ1の安定化を優先する。

| No-Go 条件 | 閾値 |
|-----------|------|
| High E2E シナリオの pass 率低下 | 直近3回の実行で 1件以上 fail |
| フェーズ2設計書の Must Fix 未解消 | 1件以上残存 |
| PHP 側に未修正の重大バグ | E_USER_ERROR レベルが発生する既知バグが存在 |

---

## 9. フェーズ2以降への移行条件まとめ

```
フェーズ1 (TS + Playwright)
  → DoD D-01〜D-05 全通過
  → Go 条件 G-01〜G-04 全通過
  ↓
フェーズ2 (Nuxt3 + PrimeVue)
  → Nuxt3 移行設計書策定（別チケット）
  → AMP_STATUS → Pinia ストア移行
  → PHP API のインタフェース固定・薄層化
  → E2E テスト全シナリオ（High + Medium）通過
  ↓
フェーズ3 (Cloudflare ネイティブ化 ※オプション)
  → PHP API を CF Workers に置換
  → R2 / KV によるアセット管理
  → ローカル依存 API (symlink) の廃止判断
  → CF Pages による静的配信移行
```

---

## 付録 A: v1 API インタフェース定義（フェーズ2設計の前提）

### GET /playlist/

```
Request:  (none)
Response: { state: "ok"|"error", code: number, data: string[] }
          data: プレイリストファイル名の配列
```

### GET /playlist/{filename}

```
Request:  filename: プレイリスト JSON ファイル名（拡張子なし）
Response: { state: "ok"|"error", code: number, data: PlaylistObject }
          PlaylistObject: { [category: string]: MediaItem[], options?: PlaylistOptions }
```

### GET /filepath/{filename}

```
Request:  filename: 検索対象ファイル名
Response: { state: "ok"|"error", code: number, data: string|null }
          data: MEDIA_DIR からの相対ファイルパス
```

### POST /playlist/{category}

```
Request:  category: カテゴリ名, body: { file?, title, videoid?, image?, start?, end? }
Response: { state: "ok"|"error", code: number, data: null }
```

### POST /symlink

```
Request:  body: { dir: string, name: string }
Response: { state: "ok"|"error", code: number, data: null }
Note:     is_local() が false の場合は 401 を返す
```

---

## 付録 B: 前提確認チェックリスト（フェーズ1開始前）

- [ ] XAMPP + PHP 8.x 環境で `index.php` が正常動作すること
- [ ] `npm install` が完了し `npm run tw-dev` が動作すること
- [ ] Node.js 18 以上がインストールされていること（Playwright 要件）
- [ ] `src/scripts/ambient.js` の現バージョンが `v1-system-summary.md` と一致すること
- [ ] Playwright がインストール可能なネットワーク環境であること

---

*本文書は Design Agent が作成。実装フェーズ開始前に Review Agent による確認を推奨する。*
