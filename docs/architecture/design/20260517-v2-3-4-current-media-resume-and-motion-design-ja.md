# v2.3.4 カレントメディア復元とモーション設計

日付: 2026-05-17  
対象: `feature/v2.3.4`

## 1. 目的

v2.3.4 では、小規模な実装 2 件と将来向け設計 1 件を扱う。

1. `AmbientUserData.playlistContext` の復元対象にカレントメディアアイテムを追加する。
2. トーストの表示・非表示に CSS transition ベースのモーションを追加する。
3. View Transitions API / UI motion system の将来方針を設計として残す。v2.3.4 では実装しない。

## 2. カレントメディア復元

### 2-1. 保存データ

既存の `AmbientUserData.playlistContext` は次の情報を保存している。

- playlist
- category

v2.3.4 では、任意項目として `media` オブジェクトを追加する。

- `amId`
- `category`
- `title`
- `artist`
- `file`
- `videoid`

`amId` は最短一致用の情報として使う。ただし、プレイリストの並び順が変わる可能性があるため、唯一の安定識別子としては扱わない。メディア同定には title / artist / file / videoid も併用する。

### 2-2. 復元動作

復元順序は次の通り。

1. 保存されたプレイリストが現在も存在するか確認する。
2. プレイリストを読み込む。
3. 保存されたカテゴリーが存在すれば、そのカテゴリーを復元する。
4. 保存されたメディアアイテムが一致すれば、そのアイテムを選択状態にする。
5. メディアアイテムが一致しない場合は、従来通りプレイリスト／カテゴリー復元にフォールバックする。

メディア復元では、選択状態とカルーセル状態のみを更新する。自動再生は行わない。これはブラウザの autoplay 制約を避け、起動時の挙動を予測しやすくするためである。

### 2-3. フォールバック

- プレイリストが存在しない場合: 保存コンテキストを無視する。
- カテゴリーが存在しない場合: 対象プレイリストの「すべてのカテゴリー」として復元する。
- メディアが存在しない場合: プレイリスト／カテゴリーのみ復元する。
- メディアのカテゴリーが一致しない場合: そのメディアは復元しない。
- プレイリスト順序が変わった場合: `videoid`、`file`、または `title + artist` で同等メディアを探索する。

## 3. トーストモーション

既存のトースト DOM は `#alert-notification` の単一要素を維持する。

v2.3.4 では次の CSS クラスを導入する。

- `notice-toast`
- `notice-toast--visible`
- `notice-toast--hidden`

動作は次の通り。

- 表示時: 画面外上部から右上表示位置へフェードインしながらスライドする。
- 非表示時: 右上表示位置から画面外上部へフェードアウトしながらスライドし、その後 `hidden` を付与する。
- `prefers-reduced-motion: reduce` の場合: transition を無効化する。

この対応は CSS transition ベースとする。v2.3.4 では View Transitions API を使わない。

## 4. 将来の View Transitions API / UI Motion System

以下は v2.3.4 の実装対象外である。プレイリストインポートやメディアアイテム編集の実装が落ち着いた後のマイナーリリースで扱う。

想定時期: v2.6.0 以降。

### 4-1. 候補領域

- リロードや言語切り替え時の全体クロスフェード
- モーダル表示・非表示の共通モーション
- オプションモーダル内アコーディオンの開閉モーション
- カルーセルのアイテム切り替えモーション
- duration / easing などの共通 motion token

### 4-2. 制約

- Flowbite の既存 interaction を意図せず壊さない。
- Playwright の visibility wait を不安定にするモーションを入れない。
- `prefers-reduced-motion` を尊重する。
- iOS viewport と下部メニュー挙動を安定維持する。
- View Transitions API はブラウザ対応差があるため、progressive enhancement として扱う。

### 4-3. 推奨アプローチ

1. まず CSS 上に motion token を定義する。
2. 既存の modal / toast / accordion transition を名前付きクラスへ整理する。
3. Playwright では視覚タイミングではなく、状態と表示可否を検証する。
4. CSS transition では不足する明確な価値がある箇所に限って View Transitions API を導入する。
5. 未対応ブラウザでは CSS transition の fallback を維持する。
