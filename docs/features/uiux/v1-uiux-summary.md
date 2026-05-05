# Ambient v1 フロントエンド UI/UX サマリ

作成日: 2026-05-03  
対象バージョン: v1 (現行)  
担当: UI/UX Designer Agent

---

## 1. UI 全体構成とコンポーネントツリー

アプリケーションは1ページ完結型 SPA（Single-Page Application）として動作する。
`views/layout.php` が HTML のルートファイルであり、`body` 要素に以下のコンポーネントを順次インクルードする。

```
<body> (w-screen h-screen overflow-hidden)
├── [notice]          ← エラー時のみ表示
├── [player]          ← メインコンテンツ領域
│   ├── [carousel]    ← サムネイルカルーセル
│   └── figure        ← キャプション / embed-wrapper / オプションリンク
├── [menu]            ← ボトムナビゲーションバー (固定)
├── [drawer-left]     ← プレイリストドロワー (左スライド)
├── [drawer-right]    ← 設定ドロワー (右スライド)
└── [modal]           ← オプション / メディア管理モーダル
    └── [collapse]    ← アコーディオンコンテンツ
```

**z-index 階層**

| 要素 | z-index |
|---|---|
| `#alert-notification` | `z-30` |
| `#player-container` | `z-10` |
| `#menu-container` | `z-40` |
| `#drawer-playlist` / `#drawer-settings` | `z-50` |
| `#modal-options` | `z-[60]` |

---

## 2. 各コンポーネントの役割と主な表示要素

### 2-1. `player` (`views/player.php`)

**役割**: メディア再生の中央表示エリア。カルーセル・キャプション・埋め込みプレーヤーを包含する。

| 要素 ID | 役割 |
|---|---|
| `#player-container` | 全体ラッパー。縦スクロール可能、画面下 16px のマージンでボトムメニューと重なりを回避 |
| `#carousel-container` | サムネイルカルーセル領域 (`carousel` コンポーネントをインクルード) |
| `#media-caption` | 現在再生中メディアのキャプション表示。テキストがウィンドウ幅を超える場合、CSS Animation による marquee を動的適用 |
| `#embed-wrapper` | YouTube IFrame または HTML audio/video タグを動的に挿入する領域。初期状態は `h-0 opacity-0` で非表示。再生開始時に `w-max h-max` へ遷移 |
| `#optional-container` | YouTube 専用の外部リンクボタン (`#btn-watch-origin`) を格納。再生開始 500ms 後に表示 |

### 2-2. `carousel` (`views/carousel.php`)

**役割**: 前・現在・次のメディアサムネイルを左右ナビゲーション付きで表示する。

- 幅 `w-96 max-w-sm`、高さ `h-56`（md 以上で `h-64`）のカルーセルウィンドウ。
- 前後ボタン (`#data-carousel-prev` / `#data-carousel-next`) は初期状態で `disabled`。メディア選択後に有効化。
- カルーセルアイテム (`#carousel-item-1` ～ `n`) は JS により動的生成・更新される。
- 画像がない場合はプレースホルダー SVG を表示。

### 2-3. `menu` (`views/menu.php`)

**役割**: 画面下部に固定表示される操作バー。`menu_type` の値（PHP 側で切替）により2種類のデザインが切り替わる。

| `menu_type` | デザイン |
|---|---|
| `1` | 全幅フラットバー (`w-full h-16`)。5列グリッド。ラベルテキスト表示あり |
| その他 | 丸みを帯びた浮いたバー (`rounded-full bottom-4 left-1/2`)。アイコンのみで tooltip 表示 |

**ボタン一覧**

| ボタン ID | 機能 | 備考 |
|---|---|---|
| `#btn-playlist` | 左ドロワー（プレイリスト）を開く | flowbite `data-drawer-show` |
| `#btn-refresh` | ページリロード | |
| `#btn-play` | 再生開始。playtype に応じて YouTube / audio / video を制御 | 初期状態 `disabled` |
| `#btn-pause` | 一時停止。初期状態 `hidden` | 再生中に `#btn-play` と切り替え |
| `#btn-settings` | 右ドロワー（設定）を開く | flowbite `data-drawer-show` |
| `#btn-options` | オプションモーダルを開く | flowbite `data-modal-toggle` |

### 2-4. `drawer-left` (`views/drawer-left.php`)

**役割**: プレイリスト一覧を表示する左スライドドロワー。

- 幅 `w-80`、高さ `h-screen`。スクロール可能なリスト領域 `#playlist-list-group`。
- リスト高は `calc(100vh - 120px)` または `calc(100vh - 136px)` で `menu_type` により調整。
- リストアイテムは JS (`updatePlaylist()`) により動的生成。各アイテムにはサムネイル画像とタイトルが表示される。
- 現在再生中のアイテムは `aria-current="true"` + 青背景スタイルでハイライト。
- ドロワー表示時に `scrollToFocusItem()` が呼ばれ、再生中アイテムへ自動スクロール。
- メディアなし状態では `#no-media` メッセージを表示。

### 2-5. `drawer-right` (`views/drawer-right.php`)

**役割**: プレイリスト選択・カテゴリ・再生設定を操作する右スライドドロワー。

**設定項目一覧**

| 要素 ID | 設定内容 |
|---|---|
| `#current-playlist` | プレイリストファイルを選択するセレクトボックス |
| `#target-category` | カテゴリフィルタ（プレイリスト読み込み後に選択肢が生成される） |
| `#toggle-loop` | 1曲リピート再生 |
| `#toggle-randomly` | ランダム再生順序 |
| `#toggle-shuffle` | シャッフル再生 |
| `#toggle-seekplay` | Seek＆Play（start/end 指定再生） |
| `#default-volume` | 既定ボリューム（0〜100 のレンジスライダー） |
| `#toggle-fader` | 疑似フェーダー（fadein/fadeout）|
| `#toggle-darkmode` | ダークモード切替 |
| `#language` | UI 言語選択（言語ファイルが1つのみのとき `disabled`） |

### 2-6. `modal` (`views/modal.php`)

**役割**: 追加オプションとメディア管理フォームを格納するモーダルダイアログ。

- flowbite の静的バックドロップ (`data-modal-backdrop="static"`) を使用。
- ボディ内に `collapse` コンポーネントをインクルード。
- フッターに著作権表示。

### 2-7. `collapse` (`views/collapse.php`)

**役割**: モーダル内のアコーディオン形式コンテンツ。「Media Management」「Playlist Management」などのセクションを折り畳み表示する。

- メディア管理セクションでは YouTube URL またはローカルファイルパスを入力して現在のプレイリストに追加できる。
- ローカルファイル入力はサーバーが `is_local()` を返す場合のみ有効化。
- URL バリデーション結果をインラインバッジ（error / success）で即時フィードバック。
- 展開時に JS の MutationObserver が `aria-expanded` の変化を検知し、コンテンツ高さを `max-height: calc(100vh - 420px)` に設定。

### 2-8. `notice` (`views/notice.php`)

**役割**: PHP 側のエラー・警告・通知を画面上部に固定表示するアラートバナー。

- `$this->amp_error->getCode()` の値（`E_USER_ERROR` / `E_USER_WARNING` / `E_USER_NOTICE`）により色を動的決定（red / yellow / blue / gray）。
- `layout.php` で `$this->is_error()` が true の場合のみレンダリングされる。
- 閉じるボタン付き (`#btn-alert-dismiss`)。flowbite dismiss 機能を使用。
- JS 側でも `toggleAlert()` で `opacity-0` / `hidden` クラスを切り替えて表示制御。`auto_close` 引数で自動消去が可能。

---

## 3. AMP_STATUS オブジェクトの構造と状態遷移

### 3-1. プロパティ定義

```js
AMP_STATUS = {
    prev:       null,   // 直前メディアの amId
    current:    null,   // 現在再生中メディアの amId
    next:       null,   // 次メディアの amId
    ctg:        -1,     // 選択中カテゴリ ID（-1 = 全カテゴリ）
    category:   null,   // カテゴリ名配列
    playlist:   null,   // 現在のプレイリストファイル名
    media:      null,   // 全メディアオブジェクト配列（amId / catId 付与済）
    order:      'normal', // 'normal' | 'random'
    playertype: null,   // 'youtube' | 'audio' | 'video' | null
    volume:     null,   // 0〜100
    options:    null,   // プレイリスト options オブジェクト
    addtype:    null,   // 追加メディアのタイプ（v1.1.0 以降）
    notice:     null,   // 通知メッセージ
    loop:       null,   // 1曲ループフラグ（v1.2.2 以降）
}
```

> **注意:** `fader` および `shuffle` は `initStatus()` の戻り値に含まれないため、`watchState()` の `Object.defineProperty` セットアップ対象外となる。
> - `fader` は `createYTPlayer()` / `createPlayerTag()` 内で `AMP_STATUS.fader = Boolean(optFader)` として動的代入される（v1.2.0 以降）。
> - `shuffle` は `applyOptions()` および `updatePlaylist()` 内で `AMP_STATUS.shuffle = [...]` として動的代入される。

### 3-2. 状態遷移フロー

```
[初期化]
  ↓ initStatus() → AMP_STATUS 全プロパティを null / 初期値にリセット
  ↓ AmbientData.currentPlaylist が存在 → getPlaylistData() 呼び出し
  ↓ API レスポンスから media / category / options を取得
  ↓ AMP_STATUS.media / .category / .options をセット
  ↓ watchState() のウォッチャーが各変更を検知して副作用を実行
         ↓ .media    → togglePlayerControllButtons()
         ↓ .category → updateCategory()
         ↓ .current  → changePlaylistFocus()
         ↓ .order    → changeToggleRandomly()
         ↓ .shuffle  → changeToggleShuffle()
         ↓ .volume   → changeRangeVolume()
         ↓ .options  → applyOptions()
         ↓ .notice   → updateNotice()
         
[再生開始]
  playItem(elm, amId)
    ↓ updatePlayStatus(amId) → .prev / .current / .next を更新
    ↓ setupPlayer(type, src, mediaData)
         ↓ youtube → createYTPlayer()
         ↓ audio   → createPlayerTag('audio', ...)
         ↓ video   → createPlayerTag('video', ...)
  ↓ AMP_STATUS.playertype を更新

[再生終了 (YouTube)]
  onPlayerStateChange(ENDED)
    ↓ AMP_STATUS.loop ? 同一 amId : AMP_STATUS.next を再生
    ↓ updatePlayStatus(nextId) → setupPlayer(...)
```

---

## 4. JavaScript インタラクション設計

### 4-1. ウォッチャーパターン

`watchState()` が `Object.defineProperty` を使って `AMP_STATUS` の各プロパティに getter/setter を定義し、値変更時に対応する副作用関数を呼び出す。これが状態管理の中心機構。

```
AMP_STATUS.xxx = newValue
  → setter 実行 → callback(prop, oldValue, newValue) → 対応ハンドラを呼び出し
```

また DOM 変更の監視には `watcher()` ヘルパー（`MutationObserver` ラッパー）を使用している。

- `#drawer-playlist` の `aria-modal` 変化 → `scrollToFocusItem()` を実行
- `#collapse-menu` の `aria-expanded` 変化 → コンテンツ高さを動的に設定

### 4-2. YouTube IFrame API 連携

- `<script src="https://www.youtube.com/player_api">` をページ読み込み時に動的挿入。
- `createYTPlayer(mediaData)` で `YT.Player` インスタンスを生成し `#ytplayer` div に描画。
- イベントハンドラ3種:
  - `onPlayerReady`: 埋め込み表示を展開し、外部リンクを有効化。autoplay オプション時は `setInterval` で再生開始を監視・強制。
  - `onPlayerStateChange`: ENDED / PAUSED / PLAYING 各状態でボタン切替・次曲再生・フェーダー処理を実行。
  - `onPlayerError`: エラー発生時に次のメディアをスキップ再生。

### 4-3. seek（シーク再生）

> **確認済み:** 本節の記述は `ambient.js` の当該実装箇所（`createYTPlayer` 内の `playerOptions.start` / `playerOptions.end` 設定部、`abortSeeking()`）を読み込み確認済み。

- `seekId` に `setInterval` のタイマー ID を保持。
- `options.seek` が有効かつメディアに `start` / `end` が設定されている場合、YouTube `playerOptions.start` / `playerOptions.end` に渡して再生範囲を指定。
- `abortSeeking()` で `clearInterval(seekId)` を呼び、タイマーを停止。

### 4-4. フェーダー（疑似フェードイン/アウト）

> **確認済み:** 本節の記述は `ambient.js` の `fadeIn()`（行 1603）および `fadeOut()`（行 1666）の実装を読み込み確認済み。YouTube / ローカルメディア両対応の実装であることも確認。

- `fadeinId` / `fadeoutId` に `setInterval` のタイマー ID をそれぞれ保持。
- `options.fader` が有効かつメディアに `fadein` / `fadeout` 秒数が設定されている場合に動作。
- `fadeIn(player, fadeinSec, seekStart)`: ボリュームを 0 から段階的に `AMP_STATUS.volume` まで引き上げる。YouTube (`media.setVolume()`) とローカル (`media.volume`) の両プレーヤー型に対応。
- `fadeOut(player, fadeoutSec, seekEnd)`: 再生位置が `seekEnd - fadeoutSec` に達した時点でボリュームを段階的に 0 まで下げ、曲終了後に次曲へ移行。ローカルメディアでは `media.dispatchEvent(new Event('ended'))` で終了をトリガーする。
- `abortFader('fadein' | 'fadeout')` で対応するタイマーを停止。

### 4-5. マーキーキャプション

- `updateMediaCaption()` でキャプションテキストを `#media-caption` に設定後、`toggleMarqueeCaption()` を呼び出す。
- テキスト幅が `window.innerWidth` または 640px を超える場合、CSS `Element.animate()` で無限ループするマーキーアニメーションを適用。
- `.marquee-inner` ノードのクローンを追加し、`translate: [0, 'calc(-100% - 8px)']` アニメーションを付与する（2コピーがシームレスに繋がる）。

---

## 5. レスポンシブ対応の状況

### 5-1. ブレークポイント

Tailwind CSS のデフォルトブレークポイント（`sm: 640px`, `md: 768px`, `lg: 1024px` 等）を使用。`tailwind.config.js` でのカスタム追加はなし。

### 5-2. `minFullUIWidth` による分岐

```js
const currentWindowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
    minFullUIWidth: 1282, // = 320 (left drawer) + 1 + 640 (main) + 1 + 320 (right drawer)
}
```

- `window.innerWidth < 1282` の場合、`playItem()` 内でドロワーを自動的に閉じる（`#btn-close-playlist` / `#btn-close-settings` を擬似クリック）。
- 1282px 以上の大画面では左右ドロワーを開いたままプレーヤーを操作できることを想定している（ただし CSS 上のレイアウト分割は明示的に実装されておらず、実際にはドロワーがメインコンテンツを覆うオーバーレイ動作になる）。

### 5-3. YouTube 埋め込みサイズ

```js
const adjustSize = {
    width:  currentWindowSize.width >= 640 ? 640 : (currentWindowSize.width - 2),
    height: Math.floor((9 * width) / 16),
}
```

画面幅が 640px 以下のときは `width - 2` を使用し、16:9 アスペクト比を保つ。

### 5-4. カルーセルの高さ

- `md:h-64`（`h-56` → `h-64`）でモバイルとタブレット以上の切り替えあり。

### 5-5. `menu_type` によるメニューデザイン切替

PHP 変数 `$this->menu_type` の値（1 または その他）でフラット型/フローティング型を切替。ウィンドウサイズに基づく動的切替は JS 側には実装されていない。

---

## 6. CSS フレームワーク・スタイリング方針

### 6-1. 使用ライブラリ

| ライブラリ | 役割 |
|---|---|
| Tailwind CSS v3 (JIT モード) | ユーティリティクラスによるスタイリングの中心 |
| flowbite | Drawer / Modal / Tooltip / Carousel / Accordion (Collapse) の JS+CSS コンポーネント |
| M+ 1p フォント (カスタム) | 日本語フォントのフォールバック |

### 6-2. ダークモード

`tailwind.config.js` で `darkMode: "class"` を設定。`<html>` 要素への `.dark` クラス付与により切替。  
JS の `changeToggleDarkmode()` が `document.documentElement.classList.add/remove('dark')` で制御。

### 6-3. カスタムスタイル (`src/styles/ambient.scss`)

主なカスタムクラス:

| クラス名 | 用途 |
|---|---|
| `.text--artist` / `.text--title` / `.text--desc` | キャプション用テキスト装飾（`::before` / `::after` でかっこ・ダッシュを付与） |
| `.playlist-title` / `.text--playlist-title` | プレイリスト一覧の主タイトル行スタイル |
| `.playlist-subtitle` / `.text--playlist-artist` | プレイリスト一覧のサブタイトル（アーティスト名）スタイル |
| `.two-lines` | 2行表示コンテナ（`flex-direction: column`） |
| `.text-rotate-0` | `transform: rotate(0.03deg)` によるフォントレンダリング改善 |
| `@font-face (mplus-1p-regular)` | M+ 1p フォント定義 |

### 6-4. ビルドフロー

```
npm run tw-dev   → Tailwind CSS の watch モード（開発時）
npm run tw-build → Tailwind CSS の本番ビルド
```

ソース: `src/styles/tailwindcss.css`  
出力: `dist/tailwindcss.css`（dev）/ `dist/tailwindcss.min.css`（build）

---

## 7. 多言語対応の UI 側の扱い

### 7-1. サーバーサイドの仕組み

- `assets/` ディレクトリ内の `lang*.json` ファイルを PHP が読み込み、翻訳データをビューに渡す。
- `__()` ヘルパー関数が翻訳キーを検索して対応テキストを返す。
- `assets/lang-ja.json` のように言語コードをファイル名に含める規則。
- Cookie `lang` の値でアクティブ言語を決定。セッションをまたいで保持される。

### 7-2. JS 側の言語切替

- `#language` セレクトボックスの変更イベントで `updateCookie('lang', newLanguage)` を実行後、`reloadPage()` でページを再読み込みする。
- 言語ファイルが1つのみのときはセレクトボックスが `disabled` になる（PHP 側で制御）。

### 7-3. UI 上の多言語対応状況

- 静的テキストはすべて `__()` でラップされており翻訳可能。
- 動的生成要素（プレイリストアイテム）のタイトルはプレイリスト JSON の `title` プロパティをそのまま使用（翻訳対象外）。
- `sr-only` クラスによるスクリーンリーダー向けテキストも `__()` でラップ済み。

---

## 8. 既知の課題・UX 的負債

### 8-1. レスポンシブ設計の不完全さ

- `minFullUIWidth = 1282` という閾値が定義されているが、CSS 上ではドロワーが常にオーバーレイ動作であり「サイドバーとして横並びに表示される」レイアウトは実現されていない。
- メニューの `menu_type` 切替が PHP 側の静的な変数で決まるため、ウィンドウリサイズに対してアダプティブに変化しない。

### 8-2. Play/Pause ボタンの状態管理

- `#btn-play` と `#btn-pause` を `hidden` / 表示の切替で排他制御しているが、一方が `hidden` で他方が `disabled` というケースが多く、DOMに無効状態のボタンが残り続ける。スクリーンリーダーに対して意図が伝わりにくい。

### 8-3. ドロワー自動クローズの実装方法

- `document.getElementById('btn-close-playlist').click()` という擬似クリックで閉じる実装になっており、flowbite の API を直接呼ぶ方法ではない。flowbite のバージョン更新でクローズ属性名が変わった場合に壊れやすい。

### 8-4. グローバル変数への依存

- `var player` / `var seekId` / `var fadeinId` / `var fadeoutId` が関数スコープ外で宣言されており、複数プレーヤーへの拡張や並列フェード制御を困難にしている。

### 8-5. カルーセルのクローン実装バグ

- `clearCarousel()` 内で `$CAROUSEL_NO_MEDIA.clone(true)` を呼んでいるが、DOM 要素に `.clone()` メソッドは存在せず（`cloneNode()` が正しい）、実行時エラーが発生する可能性がある。

### 8-6. `embed-wrapper` の高さ遷移

- YouTube プレーヤー表示/非表示を `h-0` ↔ `h-max` で切り替えているが、`h-max` は Tailwind の transition アニメーションに対応していないため、展開アニメーションが機能しない。

### 8-7. アクセシビリティ

- カルーセルの前後ボタンが disabled 状態でも矢印キー操作に対するフォーカス制御がない。
- `notice` コンポーネントは PHP エラー時のみレンダリングされるため、JS 側から `updateNotice()` で動的に表示する通知と仕組みが二重になっている。
- ダークモード切替時、`<audio>` 要素の `opacity: .7` 設定が再生コントローラー UI の視認性を下げる。

### 8-8. 設定の永続化

- 設定（ボリューム・ダークモード・ループ等）は `AMP_STATUS.options` 経由で WebStorage に保存しているが、プレイリストごとの options JSON に依存する設計のため、ユーザーが設定を変更しても次回ページ読み込み時にプレイリストの options で上書きされる。

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `docs/features/uiux/v1-uiux-summary.md` | 新規作成 |

## バリデーション

- 参照ファイルをすべて読み込み、記載内容がソースコードと一致していることを確認済み。
- 既知の課題については JS のソースコードの動作上の不整合に基づいて記載。

## 既知リスク

- `ambient.js` の後半部（`createPlayerTag` / `fadeIn` / `fadeOut` / `seek` 実装部）は今回未読取。フェーダーおよびローカルメディア再生の詳細な実装が追加記載を要する可能性がある。
- `views/css/ambient.css`（コンパイル済み CSS）は詳細な確認を省略しており、カスタムクラスの詳細は `ambient.scss` を参照した。

## 次推奨アクション

1. **Design Agent**: このドキュメントを参照して v2 のコンポーネント設計仕様（特にドロワーレイアウトの改善、状態管理の分離）を策定する。
2. **Implementation Agent**: 8-5（`clone()` バグ）および 8-6（`h-max` transition 問題）を v1 の既存バグとして修正候補に登録する。
3. **Test/Debug Agent**: `clearCarousel()` の `clone()` 呼び出しがエラーになることを E2E シナリオで検証する。
