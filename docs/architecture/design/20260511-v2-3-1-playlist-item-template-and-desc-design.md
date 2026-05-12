# v2.3.1 Playlist Item Template / Description UI / SVG Assetization Design

Date: 2026-05-11
Scope: `feature/v2.3.0-vite`

## 1. 背景

v2.3.0 時点のプレイリストアイテム表示では、`title` は表示されるが、`artist` と `desc` はデフォルト UI に反映されない。
また、プレイリストアイテムは TypeScript 側で毎回 DOM 生成しており、繰り返し描画される inline SVG も残っている。

今回の v2.3.1 では、以下の 3 点をまとめて解消する。

1. `options.playlist` 未定義時のデフォルトプレイリストテンプレート見直し
2. `desc` 表示 UI の追加
3. プレイリスト関連 SVG の静的アセット化

## 2. 対象要件

### 2-1. 要件1

`options.playlist` が未定義の場合、プレイリストアイテム欄に以下の情報を表示する。

- 1 行目: `title`
- 2 行目: `artist`
- 右端: `desc` が存在する場合のみ説明アイコン

### 2-2. 要件2

`desc` を持つメディアアイテムでは、説明アイコン押下時に `desc` 全文を表示できるようにする。

### 2-3. 要件3

プレイリスト項目周辺で繰り返し出現する inline SVG を静的アセット化し、HTML / TS の可読性を改善する。

## 3. 設計方針

## 3-1. プレイリストアイテム描画

プレイリスト描画は `src/scripts/ambient.ts` の `updatePlaylist()` が単一責務で持っているため、この流れは維持する。

描画方式は 2 系統に分ける。

- `options.playlist` が定義されている場合
  - 既存どおり `filterText()` を使う
  - カスタム HTML を許容する
- `options.playlist` が未定義の場合
  - DOM API で標準テンプレートを組み立てる
  - `title`, `artist`, `desc` を個別に配置する

標準テンプレート構造:

```html
<span class="playlist-item-label playlist-item-label--default">
  <span class="playlist-item-main">
    <span class="text--playlist-title">...</span>
    <span class="text--playlist-artist">...</span>
  </span>
  <button type="button" class="icon--playlist-desc" ...></button>
</span>
```

補足:

- `artist` が空の場合は artist 行を出さない
- `desc` が空の場合は説明アイコンを出さない
- クリック可能アイコンは `button` 要素とする
- テンプレート文字列内の `onclick` は使わない

## 3-2. desc 表示 UI

表示方式は tooltip ではなく **小型モーダル** を採用する。

理由:

- プレイリストドロワーは `overflow-y-auto` コンテナであり、ツールチップがクリップされやすい
- スマートフォンで hover が使えない
- 小型モーダルの方が長文表示に向く
- 既存の modal/backdrop 管理と整合しやすい

仕様:

- 説明アイコン押下で `desc` モーダルを中央表示
- モーダルはヘッダ・フッタ無しのコンパクト UI
- `desc` はプレーンテキストとして表示
- `white-space: pre-wrap` を使い改行を保持
- 外側クリック、閉じるボタン、同一アイコン再押下で閉じる
- 同時に開けるのは 1 件のみ
- 表示中のアイコンは active 表示にする

## 3-3. イベント処理

プレイリストはカテゴリー変更・プレイリスト変更時に再描画されるため、個別アイコンへの直接リスナー増設ではなく **イベント委譲** を採用する。

委譲先:

- `#playlist-list-group`

分岐順:

1. `closest('.icon--playlist-desc')` を優先判定
2. 該当時は `preventDefault()` + `stopPropagation()`
3. それ以外の `a[data-playlist-item]` は従来どおり再生処理

これにより再描画ごとのハンドラ張り直しを最小限にできる。

## 3-4. SVG 資産化

v2.3.1 では「全画面の全 inline SVG を一括除去」ではなく、プレイリスト関連の繰り返し要素を優先する。

対象:

- desc アイコン
- プレイリスト末尾の add icon
- reorder handle
- delete check

配置先:

- `views/images/icons/`

利用方法:

- `img` 埋め込みではなく CSS `mask-image` を基本とする
- `background-color: currentColor` でライト/ダーク/hover/active に追従させる

利点:

- テーマ色制御を維持できる
- DOM 文字列が軽くなる
- TS / PHP の可読性が向上する

## 4. 変更対象

### 4-1. 実装

- `src/scripts/ambient.ts`
- `src/styles/ambient.scss`
- `src/styles/tailwind.css`
- `views/drawer-left.php`

### 4-2. 新規静的資産

- `views/images/icons/playlist-desc.svg`
- `views/images/icons/playlist-add.svg`
- `views/images/icons/reorder-handle.svg`
- `views/images/icons/check.svg`

### 4-3. テスト

- `tests/e2e/scenarios/sc-012-local-media-playback.spec.ts`
  - 既存の custom playlist label 制約確認に加え、標準テンプレートの崩れがないか補助確認を追加候補
- 新規または既存シナリオへ以下を追加候補
  - desc アイコンが `desc` 付き項目にのみ出る
  - desc クリックで再生せずモーダルが開く
  - 同一アイコン再クリックまたは外側クリックで閉じる

## 5. 非対象

今回のスコープ外:

- `options.playlist` で定義された任意 HTML テンプレートの仕様変更
- プレイリスト以外の画面にある全 inline SVG の完全静的化
- `desc` に HTML を許可する仕様

## 6. リスク

1. 既存の `itemElm` クリック再生処理と desc ボタンが競合する可能性
   - 対策: ボタン優先判定 + `stopPropagation()`

2. カスタム playlist HTML と標準テンプレートの CSS が干渉する可能性
   - 対策: `.playlist-item-label--default` を分離

3. CSS `mask-image` が未対応環境で崩れる可能性
   - 対策: modern browser 前提。必要なら `background-image` fallback を後続で追加

## 7. 実装順

1. desc モーダルの DOM 追加
2. プレイリスト標準テンプレート生成ロジック追加
3. desc イベント委譲追加
4. プレイリスト関連 SVG の静的化
5. CSS 調整
6. E2E 追加・更新

## 8. 完了条件

- `options.playlist` 未定義時に title / artist / desc アイコンが正しく表示される
- desc アイコン押下で再生せず説明 UI のみ開く
- 説明 UI はモバイルでも利用可能
- プレイリスト関連の繰り返し inline SVG が削減されている
- 既存のプレイリスト再生・削除・並び替え動作が維持される
