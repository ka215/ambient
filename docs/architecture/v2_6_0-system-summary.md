# Ambient v2.6.0 システムアーキテクチャサマリ

> 作成日: 2026-07-15  
> 対象バージョン: v2.6.0 モジュール分割後の現行構成  
> 目的: v2.6.0 時点の実装構成を、機能追加・改修時の参照インデックスとして固定する  
> 旧版サマリ: `docs/architecture/v2-system-summary.md`

---

## 1. このドキュメントの位置づけ

`docs/architecture/v2-system-summary.md` は v2 初期の構成把握用サマリとして残し、本書は `ambient.ts` の段階的モジュール分割完了後の現行構成を整理した最新版とする。

本書で重視する観点は次の 3 点。

1. 現行ランタイムの層構造がどうなっているか
2. 機能追加時にどのモジュール群を拡張すべきか
3. 分割済みサブモジュールがそれぞれ何を担当しているか

---

## 2. アプリケーション概要

Ambient は、ローカル環境またはセルフホスト環境で動作する Web ベースのメディアプレイヤーである。  
JSON プレイリストを読み込み、YouTube / ローカル動画 / ローカル音源を再生する。  
カテゴリ切替、再開、シーク再生、フェーダー、MyPlaylist 永続化、プレイリスト編集、メディア編集、多言語対応などを含む。

v2.6.0 では、従来 `src/scripts/ambient.ts` に集中していた責務を以下のレイヤへ再配置した。

- `bootstrap/`: 起動順序、組み立て、bridge/facade
- `state/`: アプリ内状態・再開文脈・ドラフト状態
- `platform/`: AmbientData、storage、fetch、永続化 I/O
- `domain/`: プレイリスト読込、再生、保存、編集ロジック
- `ui/`: ドロワー、モーダル、フォーム、プレイヤー表示、各種バインディング
- `shared/`: 純関数ユーティリティ
- `types/`: 型定義

`src/scripts/ambient.ts` 自体は、現時点では実質的に composition root として動作する。

---

## 3. 技術スタック

| 区分 | 技術 |
|---|---|
| サーバーサイド | PHP |
| フロントエンド実装 | TypeScript |
| CSS | Tailwind CSS + Flowbite |
| ビルド | Vite |
| E2E | Playwright |
| データ形式 | JSON |
| 永続化 | localStorage / sessionStorage / JSON API / PHP ファイル保存 |
| ランタイム配信 | `dist/assets/ambient.js` + `dist/manifest.json` |

---

## 4. 現行ランタイム構成

### 4-1. エントリポイント

- フロントエンド runtime entry: `src/scripts/ambient.ts`
- ビルド成果物: `dist/assets/ambient.js`
- PHP 側参照: `functions.php` が Vite manifest の `src/scripts/ambient.ts` entry を参照

### 4-2. 責務の流れ

大まかな実行フローは次の通り。

1. PHP が `AmbientData` を注入する
2. `ambient.ts` が bootstrap 群を起動する
3. bootstrap が state / platform / domain / ui を wiring する
4. `domain/playlist-loader.ts` がプレイリストを読み込む
5. `domain/media-playback.ts` が再生ロジックを一元管理する
6. `ui/player/*` が media type ごとの表示・イベントを担う
7. `state/*` が resume context / draft / watcher を保持する
8. `platform/*` が localStorage や API へのアクセスを担当する

### 4-3. レイヤ依存の原則

- `bootstrap` は各層を組み立てるだけで、業務ロジックを極力持たない
- `domain` は具体 UI 実装に直接依存しない
- `ui/player/*view.ts` は再生ポリシーを持たず、表示とイベント通知に専念する
- `shared` は純関数群として他層から使われる

---

## 5. どの機能をどこで拡張するか

新規機能や修正時の主要な着手先を先に示す。

| 機能領域 | 主に見るべきモジュール |
|---|---|
| プレイリスト読込・初期化 | `domain/playlist-loader.ts`, `bootstrap/playlist-*.ts`, `platform/fetch-data.ts` |
| MyPlaylist 永続化 | `domain/myplaylist-storage.ts`, `platform/storage.ts`, `state/playlist-context.ts` |
| 再生挙動全般 | `domain/media-playback.ts`, `ui/player/player-shell.ts`, `ui/player/*` |
| プレイヤー UI 見た目 | `ui/player/*-view.ts`, `ui/player/player-layout.ts`, `ui/player/player-display.ts` |
| プレイリスト表示・選択 | `ui/playlist-view.ts`, `ui/playlist-*`, `bootstrap/playlist-ui-*` |
| 並び替え・削除モード | `state/playlist-mode-state.ts`, `ui/playlist-mode-*`, `ui/playlist-reorder-runtime.ts` |
| 設定ドロワー | `ui/settings-*`, `ui/settings-bindings.ts`, `bootstrap/app-settings-*` |
| オプションモーダル | `ui/modals.ts`, `ui/options-modal-bindings.ts`, `bootstrap/options-*` |
| メディア管理フォーム | `ui/forms/media-management.ts`, `ui/forms/management-*`, `bootstrap/management-*` |
| プレイリスト管理フォーム | `ui/forms/playlist-management.ts`, `domain/playlist-management-*.ts`, `bootstrap/management-playlist-*` |
| プレイリスト import | `domain/playlist-import.ts`, `bootstrap/management-import-*`, `platform/fetch-data.ts` |
| メディア編集 | `domain/media-edit/*`, `ui/media-edit/*`, `bootstrap/media-edit-*`, `platform/media-edit-persistence.ts` |
| resume / 再開状態 | `state/playlist-context.ts`, `state/playlist-resume-bindings.ts`, `bootstrap/playlist-resume-*` |
| DOM 共通処理 | `shared/dom-utils.ts` |
| バリデーション | `shared/validation.ts`, `shared/media-edit-timing-input.ts`, `domain/media-edit-timing.ts` |

---

## 6. ディレクトリ構成（フロントエンド中心）

```text
src/scripts/
├── ambient.ts
├── bootstrap/
├── domain/
├── platform/
├── shared/
├── state/
├── types/
└── ui/
    ├── forms/
    ├── media-edit/
    └── player/
```

---

## 7. モジュールインデックス

以下は、現行の分割済みサブモジュール一覧である。  
「どのファイルが何を担当するか」を引けるよう、ディレクトリ単位で責務を明記する。

### 7-1. Entry / Root

| モジュール | 主責務 |
|---|---|
| `src/scripts/ambient.ts` | フロントエンド runtime entry。各 bootstrap 初期化を束ねる composition root。 |

### 7-2. `src/scripts/state/`

| モジュール | 主責務 |
|---|---|
| `state/status-watchers.ts` | `AMP_STATUS` 変更監視の束ね。状態変更時に UI/副作用へ通知する。 |
| `state/session-draft-store.ts` | セッション中の一時 draft 状態保持。未保存入力の保持に使う。 |
| `state/playlist-resume-bindings.ts` | 再開情報と UI/起動処理の接続点。resume 系 binding をまとめる。 |
| `state/playlist-options.ts` | プレイリスト `options` の正規化・参照補助。 |
| `state/playlist-mode-state.ts` | 通常 / 削除 / 並び替え等の playlist mode 状態保持。 |
| `state/playlist-context.ts` | 現在 playlist/category/media の再開文脈を保持・永続化する。 |
| `state/media-edit-draft-store.ts` | メディア編集フォームの draft 状態ストア。 |

### 7-3. `src/scripts/platform/`

| モジュール | 主責務 |
|---|---|
| `platform/storage.ts` | localStorage / sessionStorage の read/write 抽象化と key 管理。 |
| `platform/runtime-support.ts` | ランタイム共通の platform 補助処理。 |
| `platform/media-edit-persistence.ts` | メディア編集結果の永続化 I/O。 |
| `platform/fetch-data.ts` | API / JSON 読込などの fetch 系処理。 |
| `platform/ambient-data.ts` | `window.AmbientData` の型付きアクセスと mode 判定。 |

### 7-4. `src/scripts/domain/`

| モジュール | 主責務 |
|---|---|
| `domain/myplaylist-storage.ts` | MyPlaylist の生成・読込・sanitize・保存を統括。 |
| `domain/media-playback.ts` | YouTube / video / audio 共通の再生状態遷移、seek/fader timer、ended/error 処理を一元管理。 |
| `domain/media-management-data.ts` | メディア管理フォームに必要なデータ整形・初期値決定。 |
| `domain/media-edit-timing.ts` | メディア編集における start/end/fade の整合性計算・検証。 |
| `domain/playlist-loader.ts` | プレイリスト読込ライフサイクル、fallback、切替時の整合処理。 |
| `domain/playlist-import.ts` | プレイリスト import の sanitize / normalize / 受理判定。 |
| `domain/playlist-management-actions.ts` | プレイリスト管理 UI からの操作を業務アクションとして実行する。 |
| `domain/playlist-management-data.ts` | プレイリスト管理画面向けのデータ整形・補助。 |

#### `src/scripts/domain/media-edit/`

| モジュール | 主責務 |
|---|---|
| `domain/media-edit/duration-sync.ts` | プレビュー再生時間と編集 UI の duration 同期。 |
| `domain/media-edit/draft.ts` | メディア編集 draft モデルの生成・更新。 |
| `domain/media-edit/draft-bindings.ts` | draft 状態と UI binding の接続。 |
| `domain/media-edit/save.ts` | メディア編集保存処理本体。payload 構築と commit ロジックを持つ。 |
| `domain/media-edit/save-bindings.ts` | save 処理と UI イベントの接続。 |
| `domain/media-edit/session-state.ts` | メディア編集モーダル内のセッション状態保持。 |

### 7-5. `src/scripts/shared/`

| モジュール | 主責務 |
|---|---|
| `shared/validation.ts` | 汎用バリデーション補助。 |
| `shared/time.ts` | 秒数変換、時間フォーマットなどの時間系純関数。 |
| `shared/string.ts` | 文字列整形・安全化の共通処理。 |
| `shared/playlist-label.ts` | プレイリスト表示ラベルの生成補助。 |
| `shared/media-sanitize.ts` | メディア項目の sanitize / normalize 補助。 |
| `shared/media-edit-timing-input.ts` | メディア編集の timing input 値整形・解釈。 |
| `shared/dom-utils.ts` | DOM 取得、class 操作、イベント補助などの共通処理。 |

### 7-6. `src/scripts/types/`

| モジュール | 主責務 |
|---|---|
| `types/youtube.ts` | YouTube API / player 関連の型定義。 |
| `types/index.ts` | 型 export の集約口。 |
| `types/ambient.ts` | AmbientData、playlist、media、status 系の主要型定義。 |

### 7-7. `src/scripts/ui/` コア UI

| モジュール | 主責務 |
|---|---|
| `ui/modals.ts` | オプションモーダル、説明モーダル等の開閉制御。 |
| `ui/playlist-mode-runtime.ts` | playlist mode UI の runtime 制御。 |
| `ui/player-control-bindings.ts` | 再生コントロール群とイベントの binding。 |
| `ui/settings-bindings.ts` | 設定ドロワー各項目の binding。 |
| `ui/selector-bindings.ts` | セレクタ UI 群のイベント binding。 |
| `ui/playlist-view.ts` | プレイリスト項目レンダリング、選択表示、空表示などの中核 UI。 |
| `ui/playlist-reorder-runtime.ts` | Sortable 等を用いた並び替え runtime。 |
| `ui/playlist-option-bindings.ts` | playlist option 表示・入力と状態の binding。 |
| `ui/settings-view.ts` | 設定 UI 表示更新。 |
| `ui/settings-controls.ts` | 設定関連コントロール補助。 |
| `ui/viewport-runtime.ts` | viewport 依存 UI の runtime 制御。 |
| `ui/viewport.ts` | viewport サイズ判定・レイアウト補助。 |
| `ui/app-event-handlers.ts` | アプリ全体イベントの UI handler 集約。 |
| `ui/app-controls.ts` | アプリ全体の UI control 補助。 |
| `ui/drawers.ts` | 左右ドロワー開閉、backdrop、モバイル時のドロワー制御。 |
| `ui/options-modal-bindings.ts` | オプションモーダル内の UI binding。 |
| `ui/notifications.ts` | notice / toast などの通知表示。 |
| `ui/playlist-interaction-bindings.ts` | プレイリスト項目クリック、hover、interaction 系の binding。 |
| `ui/playlist-display-bindings.ts` | プレイリスト表示更新と状態連動。 |
| `ui/playlist-mode-bindings.ts` | mode 切替 UI と state の binding。 |
| `ui/playlist-mode-controls.ts` | mode UI 操作の補助ロジック。 |

#### `src/scripts/ui/forms/`

| モジュール | 主責務 |
|---|---|
| `ui/forms/playlist-management.ts` | プレイリスト管理フォーム本体 UI。 |
| `ui/forms/media-management.ts` | メディア管理フォーム本体 UI。 |
| `ui/forms/management-forms.ts` | 管理フォーム共通処理の集約。 |
| `ui/forms/management-form-bindings.ts` | 管理フォーム入力とイベントの binding。 |
| `ui/forms/management-binding-builders.ts` | binding 構築補助。 |
| `ui/forms/file-dropzone.ts` | ファイルドロップ UI。 |
| `ui/forms/cloud-edit-restrictions.ts` | cloud 環境での編集制限 UI 適用。 |
| `ui/forms/category-volume-bindings.ts` | category / volume 系入力の binding。 |

#### `src/scripts/ui/media-edit/`

| モジュール | 主責務 |
|---|---|
| `ui/media-edit/modal-view.ts` | メディア編集モーダル全体の表示制御。 |
| `ui/media-edit/form-view.ts` | メディア編集フォーム表示更新。 |
| `ui/media-edit/elements.ts` | メディア編集 UI 要素参照の集約。 |
| `ui/media-edit/controls.ts` | メディア編集コントロール補助。 |
| `ui/media-edit/category-view.ts` | category combobox / 入力表示制御。 |
| `ui/media-edit/timing-view.ts` | start/end/fade 入力欄や timeline 表示更新。 |
| `ui/media-edit/timing-bindings.ts` | timing 関連入力の binding。 |
| `ui/media-edit/preview-bindings.ts` | プレビュー再生と編集 UI の binding。 |
| `ui/media-edit/ui-bindings.ts` | メディア編集 UI 全体の binding 集約。 |
| `ui/media-edit/validation-view.ts` | バリデーションメッセージと error style 表示制御。 |

#### `src/scripts/ui/player/`

| モジュール | 主責務 |
|---|---|
| `ui/player/youtube-player-view.ts` | YouTube IFrame Player 固有の mount / source 適用 / イベント橋渡し。 |
| `ui/player/youtube-player-events.ts` | YouTube player event の解釈と通知変換。 |
| `ui/player/player-view-types.ts` | player adapter 契約型。 |
| `ui/player/player-shell.ts` | active player view の切替・mount/unmount・共通操作の仲介。 |
| `ui/player/player-setup.ts` | プレイヤー初期セットアップ補助。 |
| `ui/player/player-runtime.ts` | player runtime の実行制御。 |
| `ui/player/player-runtime-factory.ts` | player runtime 構成生成。 |
| `ui/player/player-runtime-composition.ts` | player runtime の composition。 |
| `ui/player/player-runtime-bindings.ts` | player runtime と UI binding。 |
| `ui/player/player-runtime-actions.ts` | runtime 中のプレイヤーアクション集約。 |
| `ui/player/player-orchestration.ts` | 再生表示系 orchestration。 |
| `ui/player/player-layout.ts` | プレイヤー領域レイアウト制御。 |
| `ui/player/player-instantiation.ts` | player instance 生成補助。 |
| `ui/player/player-fader.ts` | volume/fader 見た目や適用補助。 |
| `ui/player/player-effects.ts` | player 関連視覚効果の適用。 |
| `ui/player/player-display.ts` | player 表示更新。 |
| `ui/player/player-controller.ts` | player UI control からの操作仲介。 |
| `ui/player/player-config.ts` | player 設定値の解釈・組立。 |
| `ui/player/player-actions.ts` | player 操作 API 集約。 |
| `ui/player/media-edit-preview.ts` | メディア編集モーダル内の preview player 制御。 |
| `ui/player/managed-player-factory.ts` | 管理対象 player インスタンスの factory。 |
| `ui/player/html-player-view.ts` | HTML `<video>` / `<audio>` 系 view の共通 UI 実装。 |
| `ui/player/html-player-source.ts` | HTML media source 適用補助。 |
| `ui/player/html-player-events.ts` | HTML media event の解釈と通知変換。 |
| `ui/player/carousel-view.ts` | カルーセル表示と現在メディア連動。 |

### 7-8. `src/scripts/bootstrap/`

`bootstrap/` は最もファイル数が多く、各層を組み立てる glue code の集積である。  
命名規則としては `*-init.ts` が初期化、`*-facade.ts` が外部公開向け薄い窓口、`*-support.ts` / `*-helpers.ts` が wiring 補助を表す。

| モジュール | 主責務 |
|---|---|
| `bootstrap/app-settings-facade.ts` | 設定機能の facade。 |
| `bootstrap/app-runtime-bootstrap.ts` | アプリ runtime 起動シーケンス。 |
| `bootstrap/app-init.ts` | アプリ全体初期化の上位エントリ。 |
| `bootstrap/app-controls-support.ts` | アプリコントロール初期化補助。 |
| `bootstrap/app-controls-runtime-init.ts` | アプリコントロール runtime 初期化。 |
| `bootstrap/app-controls-runtime-facade.ts` | アプリコントロール runtime facade。 |
| `bootstrap/app-controls-playlist-helpers.ts` | app controls から playlist を扱う補助群。 |
| `bootstrap/app-controls-player-helpers.ts` | app controls から player を扱う補助群。 |
| `bootstrap/app-controls-facade.ts` | app controls facade。 |
| `bootstrap/app-control-facades.ts` | app control facade の集約。 |
| `bootstrap/app-boot.ts` | boot 処理本体。 |
| `bootstrap/app-boot-support.ts` | boot 補助。 |
| `bootstrap/ambient-runtime-support-facade.ts` | ambient runtime 補助 facade。 |
| `bootstrap/ambient-playlist-support.ts` | ambient 起動時の playlist 補助。 |
| `bootstrap/ambient-playlist-helpers-facade.ts` | playlist helper facade。 |
| `bootstrap/management-bindings-init.ts` | 管理フォーム binding 初期化。 |
| `bootstrap/management-binding-options-facade.ts` | 管理 binding options facade。 |
| `bootstrap/management-action-bridge.ts` | 管理 UI と domain action の bridge。 |
| `bootstrap/imported-playlist-init.ts` | import 済みプレイリストの publish 初期化。 |
| `bootstrap/display-runtime.ts` | 表示 runtime 補助。 |
| `bootstrap/debug-support.ts` | debug / compatibility 用補助。 |
| `bootstrap/app-settings-support.ts` | 設定周り補助。 |
| `bootstrap/app-settings-helpers.ts` | 設定 helper。 |
| `bootstrap/management-import.ts` | 管理 import 処理の上位窓口。 |
| `bootstrap/management-import-sanitize-support.ts` | import sanitize 補助。 |
| `bootstrap/management-import-init.ts` | import 初期化。 |
| `bootstrap/management-import-facade.ts` | import facade。 |
| `bootstrap/management-media-bindings-facade.ts` | メディア管理 binding facade。 |
| `bootstrap/management-init.ts` | 管理系全体初期化。 |
| `bootstrap/management-media-support.ts` | メディア管理補助。 |
| `bootstrap/management-runtime-support.ts` | 管理 runtime 補助。 |
| `bootstrap/management-runtime-init.ts` | 管理 runtime 初期化。 |
| `bootstrap/management-runtime-facade.ts` | 管理 runtime facade。 |
| `bootstrap/management-playlist-ui-helpers.ts` | プレイリスト管理 UI helper。 |
| `bootstrap/management-playlist-state-support.ts` | プレイリスト管理 state 補助。 |
| `bootstrap/management-playlist-bindings-facade.ts` | プレイリスト管理 binding facade。 |
| `bootstrap/management-playlist-actions-facade.ts` | プレイリスト管理 action facade。 |
| `bootstrap/media-edit-controls-runtime-init.ts` | メディア編集 control runtime 初期化。 |
| `bootstrap/media-edit-controls-init.ts` | メディア編集 control 初期化。 |
| `bootstrap/management-target-playlist.ts` | 管理対象 playlist の決定補助。 |
| `bootstrap/management-state-facade.ts` | 管理状態 facade。 |
| `bootstrap/media-edit-modal-init.ts` | メディア編集モーダル初期化。 |
| `bootstrap/media-edit-draft-init.ts` | メディア編集 draft 初期化。 |
| `bootstrap/media-edit-playlist-helpers.ts` | メディア編集から playlist を扱う helper。 |
| `bootstrap/notice-support.ts` | 通知関連補助。 |
| `bootstrap/modal-controller-facades.ts` | モーダル制御 facade 集約。 |
| `bootstrap/media-edit-save-init.ts` | メディア編集 save 初期化。 |
| `bootstrap/media-edit-runtime-wiring-init.ts` | メディア編集 runtime wiring 初期化。 |
| `bootstrap/media-edit-runtime-wiring-facade.ts` | メディア編集 wiring facade。 |
| `bootstrap/media-edit-runtime-support.ts` | メディア編集 runtime 補助。 |
| `bootstrap/media-edit-runtime-init.ts` | メディア編集 runtime 初期化。 |
| `bootstrap/media-edit-runtime-facade.ts` | メディア編集 runtime facade。 |
| `bootstrap/options-surface-facade.ts` | オプション UI surface facade。 |
| `bootstrap/options-modal-runtime-init.ts` | オプションモーダル runtime 初期化。 |
| `bootstrap/options-modal-init.ts` | オプションモーダル初期化。 |
| `bootstrap/options-modal-helpers.ts` | オプションモーダル helper。 |
| `bootstrap/options-surface-runtime-init.ts` | オプション surface runtime 初期化。 |
| `bootstrap/options-surface-playlist-helpers.ts` | オプション surface から playlist を扱う補助。 |
| `bootstrap/playback-runtime-init.ts` | playback runtime 初期化。 |
| `bootstrap/playlist-mode-runtime-init.ts` | playlist mode runtime 初期化。 |
| `bootstrap/playlist-mode-runtime-facade.ts` | playlist mode runtime facade。 |
| `bootstrap/playlist-mode-menu-support.ts` | mode menu 補助。 |
| `bootstrap/playlist-mode-init.ts` | playlist mode 初期化。 |
| `bootstrap/playlist-load-support.ts` | playlist load 補助。 |
| `bootstrap/playlist-load-bindings.ts` | playlist load binding。 |
| `bootstrap/playlist-environment-support.ts` | cloud/local の playlist 環境差異補助。 |
| `bootstrap/playlist-capabilities.ts` | 現在 playlist で可能な操作可否の判定補助。 |
| `bootstrap/player-state-support.ts` | player state 補助。 |
| `bootstrap/player-runtime-wiring-init.ts` | player runtime wiring 初期化。 |
| `bootstrap/player-runtime-wiring-facade.ts` | player wiring facade。 |
| `bootstrap/player-runtime-support.ts` | player runtime 補助。 |
| `bootstrap/player-runtime-helpers.ts` | player helper。 |
| `bootstrap/player-init.ts` | player 初期化。 |
| `bootstrap/player-action-support.ts` | player action 補助。 |
| `bootstrap/playlist-runtime-view-support.ts` | playlist view runtime 補助。 |
| `bootstrap/playlist-runtime-view-helpers.ts` | playlist view helper。 |
| `bootstrap/playlist-runtime-support.ts` | playlist runtime 補助。 |
| `bootstrap/playlist-runtime-init.ts` | playlist runtime 初期化。 |
| `bootstrap/playlist-resume-support.ts` | playlist resume 補助。 |
| `bootstrap/playlist-resume-bindings-facade.ts` | playlist resume binding facade。 |
| `bootstrap/playlist-policy-init.ts` | playlist policy 初期化。 |
| `bootstrap/playlist-mode-state-support.ts` | playlist mode state 補助。 |
| `bootstrap/playlist-session-init.ts` | playlist session 初期化。 |
| `bootstrap/playlist-session-facade.ts` | playlist session facade。 |
| `bootstrap/playlist-runtime-wiring-init.ts` | playlist runtime wiring 初期化。 |
| `bootstrap/playlist-runtime-wiring-facade.ts` | playlist runtime wiring facade。 |
| `bootstrap/playlist-startup-init.ts` | 起動時 playlist 初期化。 |
| `bootstrap/playlist-session-support.ts` | playlist session 補助。 |
| `bootstrap/playlist-startup-runtime-facade.ts` | playlist startup runtime facade。 |
| `bootstrap/playlist-ui-facade.ts` | playlist UI facade。 |
| `bootstrap/playlist-startup.ts` | playlist startup 処理本体。 |
| `bootstrap/playlist-startup-support.ts` | playlist startup 補助。 |
| `bootstrap/volume-option-support.ts` | volume option 補助。 |
| `bootstrap/playlist-startup-runtime-init.ts` | playlist startup runtime 初期化。 |
| `bootstrap/viewport-runtime-wiring-init.ts` | viewport runtime wiring 初期化。 |
| `bootstrap/viewport-runtime-wiring-facade.ts` | viewport wiring facade。 |
| `bootstrap/viewport-lifecycle-runtime-init.ts` | viewport lifecycle 初期化。 |
| `bootstrap/status-watcher-view-support.ts` | status watcher と view の接続補助。 |
| `bootstrap/status-watcher-view-helpers.ts` | status watcher view helper。 |
| `bootstrap/status-watcher-support.ts` | status watcher 補助。 |
| `bootstrap/status-watcher-runtime-init.ts` | status watcher runtime 初期化。 |
| `bootstrap/status-watcher-runtime-facade.ts` | status watcher runtime facade。 |
| `bootstrap/status-watcher-init.ts` | status watcher 初期化。 |
| `bootstrap/status-watcher-facade.ts` | status watcher facade。 |
| `bootstrap/playlist-ui-runtime-init.ts` | playlist UI runtime 初期化。 |
| `bootstrap/playlist-ui-runtime-facade.ts` | playlist UI runtime facade。 |
| `bootstrap/playlist-ui-init.ts` | playlist UI 初期化。 |

---

## 8. 機能別 Entry Map

`bootstrap/*` のファイル数が多いため、機能追加時の入口を機能別に引けるようにする。

| 機能テーマ | 入口になりやすい bootstrap 群 | あわせて見る主要モジュール |
|---|---|---|
| アプリ起動 / boot ready | `bootstrap/app-init.ts`, `bootstrap/app-runtime-bootstrap.ts`, `bootstrap/app-boot.ts` | `platform/ambient-data.ts`, `state/status-watchers.ts`, `src/scripts/ambient.ts` |
| playlist 読込 / 起動シーケンス | `bootstrap/playlist-startup*.ts`, `bootstrap/playlist-load-*.ts`, `bootstrap/playlist-session*.ts` | `domain/playlist-loader.ts`, `state/playlist-context.ts`, `ui/playlist-view.ts` |
| playlist 表示 / mode / 並び替え | `bootstrap/playlist-ui*.ts`, `bootstrap/playlist-mode*.ts`, `bootstrap/playlist-runtime*.ts` | `ui/playlist-view.ts`, `ui/playlist-mode-*.ts`, `ui/playlist-reorder-runtime.ts` |
| player 初期化 / 再生 orchestration | `bootstrap/player-*.ts`, `bootstrap/playback-runtime-init.ts` | `domain/media-playback.ts`, `ui/player/player-shell.ts`, `ui/player/player-runtime.ts` |
| viewport / drawer / responsive UI | `bootstrap/viewport-*.ts`, `bootstrap/options-surface*.ts` | `ui/viewport.ts`, `ui/viewport-runtime.ts`, `ui/drawers.ts` |
| オプションモーダル / 設定 UI | `bootstrap/options-modal*.ts`, `bootstrap/app-settings*.ts` | `ui/modals.ts`, `ui/options-modal-bindings.ts`, `ui/settings-bindings.ts` |
| playlist 管理フォーム | `bootstrap/management-playlist-*.ts`, `bootstrap/management-bindings-init.ts` | `ui/forms/playlist-management.ts`, `domain/playlist-management-actions.ts`, `domain/playlist-management-data.ts` |
| media 管理フォーム / import | `bootstrap/management-media-*.ts`, `bootstrap/management-import*.ts`, `bootstrap/management-target-playlist.ts` | `ui/forms/media-management.ts`, `domain/media-management-data.ts`, `domain/playlist-import.ts` |
| media-edit | `bootstrap/media-edit-*.ts` | `domain/media-edit/*`, `ui/media-edit/*`, `ui/player/media-edit-preview.ts` |
| 通知 / status watcher | `bootstrap/status-watcher*.ts`, `bootstrap/notice-support.ts` | `ui/notifications.ts`, `state/status-watchers.ts` |
| アプリ全体 control binding | `bootstrap/app-controls*.ts`, `bootstrap/app-control-facades.ts` | `ui/app-controls.ts`, `ui/app-event-handlers.ts`, `ui/player-control-bindings.ts` |

実務上は、まずこの表で「どの bootstrap 群が入口か」を決め、その後に `domain` / `ui` / `state` 側の責務モジュールへ降りていくのが最短です。

---

## 9. 旧 summary から見た主な変化

| 項目 | `v2-system-summary.md` 時点 | v2.6.0 現在 |
|---|---|---|
| `ambient.ts` の役割 | 実質フロント実装本体 | 実質 composition root |
| player 実装 | 単一大規模 TS に集中 | `domain/media-playback.ts` + `ui/player/*` に分離 |
| playlist / mode / resume | 大半が `ambient.ts` 内 | `state/*` + `bootstrap/playlist-*` + `ui/playlist-*` に分離 |
| メディア管理/編集 | モーダル内に密集 | `domain/media-edit/*`, `ui/media-edit/*`, `bootstrap/media-edit-*` に分離 |
| import / persistence | 散在 | `platform/*`, `domain/*`, `bootstrap/*` に役割分割 |

---

## 10. 運用上の注意

1. TypeScript ソース更新後は `npm run build` を実行し、`dist/manifest.json` と `dist/assets/*` を同期すること。
2. PHP 側から `src/scripts/ambient.js` を直接参照しないこと。現行 runtime entry は `src/scripts/ambient.ts` の manifest 解決である。
3. `npm run test:e2e` は現行の標準 release 判定用 E2E であり、split cloud/local pack を実行する。
4. `npm run test:e2e:matrix` は単一 `baseURL` 前提の broad smoke matrix であり、release gate として扱わないこと。

---

## 11. 参照ドキュメント

- `docs/architecture/v2-system-summary.md`
- `docs/architecture/design/20260531-v2-6-0-modularization-detailed-design.md`
- `docs/operations/test-reports/20260710-v2-6-0-phase3-parity-report.md`
- `docs/operations/test-reports/20260711-v2-6-0-phase4-media-edit-report.md`
- `docs/operations/test-reports/20260715-v2-6-0-phase5-release-gate-report.md`
- `docs/operations/testing/20260715-sc-011-fixture-stabilization-followup.md`
- `docs/operations/handoffs/20260715-v2-6-0-modularization-completion-handoff.md`
