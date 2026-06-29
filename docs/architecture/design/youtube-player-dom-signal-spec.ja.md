# YouTube Player DOM シグナル仕様書

**バージョン**: 1.0  
**日付**: 2026-05-03  
**スコープ**: Ambient v2-dev — DOM属性を用いた YouTube IFrame API ライフサイクルシグナリング

---

## 1. 概要

固定スリープなしに信頼性の高い E2E テスト同期を実現するため、Ambient は YouTube API のライフサイクルフェーズ遷移を `document.body` の DOM 属性としてエミットします。これらの属性は各ライフサイクルコールバック内で同期的に書き込まれるため、Playwright の `page.locator` / `waitForFunction` API から観測可能です。

---

## 2. 属性仕様

| 属性 | 型 | 説明 |
|---|---|---|
| `data-yt-phase` | 文字列 | 現在のフェーズ名（§3 参照）。空文字列 = 未初期化。 |
| `data-yt-seq` | 数値（文字列として格納） | フェーズ遷移ごとに単調増加するカウンター。初期値 `0`、最初の遷移で `1` になる。 |
| `data-yt-error` | 文字列 | フェーズが `api_error` または `player_error` のときの YT エラーコード文字列。それ以外は空文字列。 |

3つの属性はすべて `syncYouTubeSignalAttrs()` 内でアトミックに設定されます。同関数は `emitYouTubeSignal()` から呼び出されます。

---

## 3. フェーズ一覧

| フェーズ | 意味 | 直前フェーズ |
|---|---|---|
| `idle` | 初期状態（`initStatus()` で設定） | — |
| `api_loading` | YouTube IFrame API の `<script>` タグを挿入済み | `idle` |
| `api_loaded` | `window.YT.Player` が利用可能（`onYouTubeIframeAPIReady` 発火） | `api_loading` |
| `api_error` | API `<script>` タグの `onerror` が発火 | `api_loading` |
| `player_creating` | `new YT.Player(...)` を呼び出した | `api_loaded` |
| `player_created` | YT.Player コンストラクタが戻った（オブジェクト存在） | `player_creating` |
| `player_ready` | `onPlayerReady` コールバックが発火 | `player_created` |
| `playing` | `onPlayerStateChange` → `YT.PlayerState.PLAYING` | `player_ready`, `paused` |
| `paused` | `onPlayerStateChange` → `YT.PlayerState.PAUSED` | `playing` |
| `ended` | `onPlayerStateChange` → `YT.PlayerState.ENDED` | `playing` |
| `player_error` | `onPlayerError` コールバックが発火 | `player_created` 以降の任意フェーズ |

---

## 4. フェーズ遷移ダイアグラム

```
[idle]
  │
  ▼ emitYouTubeSignal('api_loading')   ← script タグ挿入
[api_loading]
  ├──(load)──► [api_loaded]            ← onYouTubeIframeAPIReady
  └──(error)─► [api_error]

[api_loaded]
  │
  ▼ emitYouTubeSignal('player_creating')
[player_creating]
  │
  ▼ emitYouTubeSignal('player_created')
[player_created]
  │
  ▼ emitYouTubeSignal('player_ready')  ← onPlayerReady
[player_ready]
  │
  ├──(play)──► [playing]   ◄──► [paused]
  │                │
  │                └──(end)──► [ended]
  │
  └──(error)─► [player_error]          ← onPlayerError
```

---

## 5. 実装リファレンス

### 5.1 シグナルのエミット（`ambient.js` / `ambient.ts`）

```js
function syncYouTubeSignalAttrs() {
  document.body.setAttribute('data-yt-phase', AMP_STATUS.yt_phase ?? '');
  document.body.setAttribute('data-yt-seq',   String(AMP_STATUS.yt_seq ?? 0));
  document.body.setAttribute('data-yt-error', AMP_STATUS.yt_error ?? '');
}

function emitYouTubeSignal(phase, error = '') {
  AMP_STATUS.yt_seq   = (AMP_STATUS.yt_seq ?? 0) + 1;
  AMP_STATUS.yt_phase = phase;
  AMP_STATUS.yt_error = error;
  syncYouTubeSignalAttrs();
}
```

### 5.2 初期状態（`initStatus`）

```js
yt_phase: 'idle',
yt_seq:   0,
yt_error: '',
```

### 5.3 スクリプト挿入順序（load レースの回避）

`load` / `error` イベントリスナーは `insertBefore()` の**前に**登録しなければなりません。キャッシュされた高速ロード時にイベントを見逃すことを防ぐためです。

```js
tag.addEventListener('load', () => emitYouTubeSignal('api_loaded'));
tag.addEventListener('error', () => emitYouTubeSignal('api_error', 'script_load_failed'));
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag); // リスナー登録後に挿入
```

---

## 6. E2E 使用パターン（Playwright）

### 6.1 API 準備完了を待つ

```ts
await ambientPage.waitForYouTubeApi();
// 内部: window.YT.Player が存在 かつ data-yt-seq >= 1 になるまで待機
```

### 6.2 プレイヤー準備完了を待つ（ページロード後）

```ts
await ambientPage.waitForYouTubePlayerReady();
// 内部: waitForYouTubePhase(['player_ready','playing','paused'])
```

### 6.3 seq ベースのフェーズ遷移待機（古いシグナルの誤検知防止）

```ts
const seqBefore = await ambientPage.getYouTubeSignalSeq();
await page.locator('#playlist-list-group a[data-playlist-item]').first().click();
await ambientPage.waitForYouTubePhase('playing', seqBefore + 1);
```

### 6.4 一時停止して確認

```ts
const seqBeforePause = await ambientPage.getYouTubeSignalSeq();
await page.evaluate(() => {
  document.getElementById('btn-pause')?.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true })
  );
});
await ambientPage.waitForYouTubePhase('paused', seqBeforePause + 1);
```

### 6.5 フィクスチャメソッド一覧

| メソッド | シグネチャ | 説明 |
|---|---|---|
| `getYouTubeSignalSeq` | `() => Promise<number>` | 現在の `data-yt-seq` を読み取る |
| `waitForYouTubeApi` | `() => Promise<void>` | API スクリプト読み込み + seq ≥ 1 を待つ |
| `waitForYouTubePhase` | `(phases: string \| string[], minSeq?: number) => Promise<void>` | フェーズが一致し seq ≥ minSeq になるまでポーリング |
| `waitForYouTubePlayerReady` | `(minSeq?: number) => Promise<void>` | ショートカット: player_ready / playing / paused |

---

## 7. 設計根拠

| 懸念点 | 決定内容 |
|---|---|
| なぜ body 属性を使うのか？ | JS グローバルを注入せずに Playwright から観測可能。iframe サンドボックス越しでも動作する。 |
| なぜシーケンスカウンターを使うのか？ | 前の操作で残ったフェーズ値への誤マッチを防ぐため。 |
| なぜ CustomEvent を使わないのか？ | Playwright の `waitForEvent` にはタイミングウィンドウがある。安定した DOM 属性のポーリングの方が決定論的。 |
| なぜ `data-yt-*`（`e2e` プレフィックスなし）？ | フェーズ状態はテスト専用ではなくアプリが観測できるランタイムメタデータであるため。CSS やログからも利用可能。 |

---

## 8. 関連ファイル

- 実装: [src/scripts/ambient.ts](../../../src/scripts/ambient.ts)
- 型定義: [src/scripts/types/index.ts](../../../src/scripts/types/index.ts)
- E2E フィクスチャ: [tests/e2e/fixtures/ambient-page.fixture.ts](../../../tests/e2e/fixtures/ambient-page.fixture.ts)
- M2 テストレポート: [docs/operations/test-reports/20260503-phase1-m2-e2e-baseline.md](../../operations/test-reports/20260503-phase1-m2-e2e-baseline.md)
- 英語版: [youtube-player-dom-signal-spec.md](./youtube-player-dom-signal-spec.md)
