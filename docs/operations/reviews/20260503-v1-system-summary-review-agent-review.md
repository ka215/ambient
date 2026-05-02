# レビュー報告書

**Task ID:** 20260503-v1-system-summary-review  
**作成日:** 2026-05-03  
**担当エージェント:** Review Agent  
**対象ドキュメント:**
- `docs/architecture/v1-system-summary.md`（設計エージェント作成）
- `docs/features/uiux/v1-uiux-summary.md`（UI/UX エージェント作成）

---

## Result Summary

2 ドキュメント合計で **Must Fix 2 件 / Should Fix 2 件 / Nice to Have 3 件** を検出した。  
`v1-system-summary.md` は全体的にソースコードと高い整合性を持つ。  
`v1-uiux-summary.md` は `AMP_STATUS` 初期プロパティ定義の誤記と Tailwind CSS ビルド出力先の誤記という、v2 実装者に誤実装を招きうる欠陥が 2 件ある。

---

## Must Fix

### MF-1 【v1-uiux-summary.md】AMP_STATUS の `fader` / `shuffle` がコード上で初期化されていない

**箇所:** Section 3-1「AMP_STATUS オブジェクトの構造と状態遷移 > プロパティ定義」

**問題の内容:**  
ドキュメントは `fader: null` と `shuffle: []` を `AMP_STATUS` の初期プロパティとして列挙している。  
しかし実際の `initStatus()` 関数（`src/scripts/ambient.js`）の定義には両プロパティが存在しない。

```js
// initStatus() の実際のコード（抜粋）
return Object.assign(baseObj, {
    prev: null, current: null, next: null,
    ctg: -1, category: null, playlist: null,
    media: null, order: 'normal', playertype: null,
    volume: null, options: null,
    addtype: null,  // v1.1.0
    notice: null,
    loop: null,     // v1.2.2
    // fader と shuffle は存在しない
})
```

- `fader` は `applyOptions()` 内でのみ動的代入される（行 1369, 1371, 1412, 1414）。
- `shuffle` は `updatePlaylist()` 内でのみ動的代入される（行 340）。

**影響:**  
`watchState()` は `initStatus()` 呼び出し後の `Object.keys(AMP_STATUS)` に基づいてセッターを定義する。これらが `initStatus()` に含まれないことで `fader` / `shuffle` は watchState の監視対象外となる。  
v2 実装者が「`fader` / `shuffle` は初期値あり・監視済みプロパティ」と誤認してアーキテクチャ設計を行うリスクがある。

**修正指示:**  
Section 3-1 のプロパティ表に注記を追加するか、`fader` / `shuffle` を表から除いて Section 3-2 または注釈で「`applyOptions()` / `updatePlaylist()` 内で動的に設定される非初期化プロパティ」として説明する。

---

### MF-2 【v1-uiux-summary.md】Tailwind CSS ビルド出力先の誤記

**箇所:** Section 6-4「ビルドフロー」

**問題の内容:**  
ドキュメントには「出力: `views/css/ambient.css`（推定）」と記載されている。  
しかし `package.json` の npm スクリプト定義は以下のとおりであり、出力先は `dist/` ディレクトリ。

```json
"tw-dev":   "tailwindcss -i ./src/styles/tailwindcss.css -o ./dist/tailwindcss.css --watch",
"tw-build": "tailwindcss -i ./src/styles/tailwindcss.css -o ./dist/tailwindcss.min.css --minify"
```

`v1-system-summary.md` の付録にも「`./dist/tailwindcss.css`」「`./dist/tailwindcss.min.css`」と正しく記載されており、2 ドキュメント間で矛盾している。  
`views/css/ambient.css` はワークスペースに別途存在するが、これは Tailwind ビルドの出力物ではない。

**影響:**  
v2 開発者がビルドセットアップ時に誤ったパスを参照し、CSS が読み込まれない状態で開発を進めるリスクがある。

**修正指示:**  
Section 6-4 の出力先を以下のとおり修正する。

```
出力: `dist/tailwindcss.css`（dev）/ `dist/tailwindcss.min.css`（build）
```

---

## Should Fix

### SF-1 【v1-uiux-summary.md】watchState フロー図に `.shuffle → changeToggleShuffle()` が欠落

**箇所:** Section 3-2「状態遷移フロー」> watchState のウォッチャー一覧

**問題の内容:**  
ドキュメントに記載されたウォッチャー副作用一覧に `shuffle` ケースが含まれていない。  
実コードの `watchState()` 関数（`src/scripts/ambient.js` 行 105-107）には明示的な case がある。

```js
case /^shuffle$/i.test(prop):
    changeToggleShuffle()
    break
```

**影響:**  
v2 実装者が `shuffle` 変更時の副作用（UI 同期処理）を見落とし、相当機能の再実装時に漏れが発生するリスク。

**修正指示:**  
watchState フロー図に以下を追加する。

```
↓ .shuffle  → changeToggleShuffle()
```

---

### SF-2 【v1-uiux-summary.md】フェーダー・ローカル再生節が未確認であることのセクション内注記欠如

**箇所:** Section 4-4「フェーダー（疑似フェードイン/アウト）」、末尾「既知リスク」欄

**問題の内容:**  
ドキュメント末尾の「既知リスク」欄に「`ambient.js` の後半部（`createPlayerTag` / `fadeIn` / `fadeOut` / `seek` 実装部）は今回未読取」と自己申告されているが、対応するセクション（4-3 seek / 4-4 フェーダー）にはその旨の注記がない。  
v2 開発者がセクションを単体参照した場合、検証済みの正確な記述と誤認するリスクがある。

**修正指示:**  
Section 4-3 および Section 4-4 の冒頭または末尾に「本節の記述は実装の全コードを精査していない部分を含む。v2 設計前に `ambient.js` の当該箇所を再確認すること」旨の注記を追加する。

---

## Nice to Have

### NTH-1 【v1-system-summary.md】`dist/` ディレクトリが初回セットアップ前に不在となることへの注意書き不足

**箇所:** Section 2「ディレクトリ構成と各役割」内 `dist/` エントリ

`dist/` は Tailwind CSS ビルド出力先であり、`npm run tw-build` 実行前は存在しない（`.gitignore` 管理外の生成物）。  
v2 開発者が初回セットアップ時に CSS が読まれない現象に遭遇した場合のトラブルシューティングコストを下げるため、`dist/` エントリに「ビルド実行前は存在しない（`npm run tw-build` で生成）」旨を補足することを推奨する。

---

### NTH-2 【v1-system-summary.md】`index.php` のヘッダーコメントバージョンが `1.0.0` で `package.json` の `1.2.3` と乖離

**箇所:** `index.php` `@version 1.0.0` 対 v1-system-summary.md「対象バージョン: v1.2.3（package.json より）」

ドキュメントは package.json を正として記述しており内容は正確だが、`index.php` ヘッダーの `@version 1.0.0` が古いまま残っており、ファイルを直接参照した開発者が混乱する可能性がある。ドキュメント上の注記または index.php のコメント更新を推奨。

---

### NTH-3 【v1-uiux-summary.md】`#carousel-container` と `#carousel-wrapper` の 2 層構造の説明が不明確

**箇所:** Section 2-2「carousel コンポーネント」の寸法説明

`carousel.php` では外枠が `#carousel-container`（`relative w-full`）、スライドエリアが `#carousel-wrapper`（`w-96 max-w-sm h-56 md:h-64`）と 2 層構造になっている。  
Section 2-2 で「幅 `w-96 max-w-sm`、高さ `h-56`」と記述されているが、これは `#carousel-wrapper` の寸法である点が不明瞭。ID 名と対応する Tailwind クラスを紐付けて補足することで v2 開発者の参照精度が上がる。

---

## 両ドキュメント間の整合性確認

| 確認項目 | 結果 |
|---|---|
| Tailwind CSS バージョン（v3 + Flowbite v1） | 一致（MF-2 の出力先は差異あり） |
| PHP エントリポイント・クラス構成 | 一致 |
| AmbientData スキーマ | 一致 |
| プレイリスト JSON スキーマ | 一致 |
| メニュー `menu_type` 切替の動作 | 一致 |
| ダークモード実装（`class` ベース） | 一致 |
| 多言語対応の仕組み（Cookie / reload） | 一致 |
| セキュリティ課題（CSRF 未対応、認証スタブ等） | uiux 側に記載なし（対象外のため問題なし） |

---

## Release Readiness

**v2 開発リファレンスとしての公開前に MF-1・MF-2 の修正が必要。**  
Must Fix 2 件が残存する状態での参照利用は、AMP_STATUS 設計誤りおよびビルドパス誤参照のリスクを v2 全実装フェーズに伝播させる可能性があるため推奨しない。  
SF-1・SF-2 は v2 設計に着手するまでの修正で可。

---

## Changed Files

| ファイル | 変更内容 |
|---|---|
| `docs/operations/reviews/20260503-v1-system-summary-review-agent-review.md` | 新規作成（本ファイル） |

---

## Validation Executed

| 検証対象 | 検証方法 | 結果 |
|---|---|---|
| `AMP_STATUS` 初期化プロパティ | `initStatus()` 関数の実コード（ambient.js 行 14-34）と照合 | MF-1 確認 |
| Tailwind CSS 出力先 | `package.json` `scripts` フィールド照合 | MF-2 確認 |
| `watchState()` ケース一覧 | ambient.js 行 87-130 の switch 文照合 | SF-1 確認 |
| `setup()` 処理順序 | `src/Ambient.php` 実コード照合 | 記述と一致 |
| API ルーティングテーブル | `src/Ambient.php` `route_endpoint()` 照合 | 記述と一致 |
| カルーセル `.clone(true)` バグ | ambient.js 行 536 照合 | uiux 記述（Section 8-5）が正確にバグを指摘していることを確認 |
| `dist/*.js` の content スコープ | `tailwind.config.js` 照合 | v1-system-summary.md 付録と一致 |
| コンポーネントツリーおよび z-index 値 | `views/layout.php`, `views/player.php`, `views/carousel.php` 照合 | 記述と一致 |

---

## Known Risks

- `ambient.js` の `createPlayerTag` / `fadeIn` / `fadeOut` / `seek` 実装部（後半ロジック）の詳細は本レビューで全行精査していない。SF-2 として報告済みだが、当該箇所を網羅的に確認する追加レビューが v2 実装前に推奨される。
- `views/css/ambient.css` の役割（手動管理 CSS か否か）が両ドキュメントに説明されていない。MF-2 修正時に併せて補足すること。

---

## Next Recommended Action

1. **UI/UX エージェントへ差し戻し:** MF-1（AMP_STATUS プロパティ定義の修正）・MF-2（ビルド出力先修正）・SF-1（watchState フロー補完）・SF-2（節内注記追加）の修正を依頼。
2. **修正後に再レビュー:** 特に MF-1 の AMP_STATUS 記述については修正後に watchState 管理対象プロパティ一覧と再度照合すること。
3. **ambient.js 後半部の補足調査:** `createPlayerTag` / `fadeIn` / `fadeOut` の実装を精査し、Section 4-3 / 4-4 の記述精度を高める。
