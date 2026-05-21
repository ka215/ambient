# v2.4.0 プレイリストインポートと保存基盤移行検討 設計

日付: 2026-05-19  
対象バージョン: v2.4.0  
対象ブランチ想定: v2-dev 系 feature ブランチ

## 1. 背景と目的

v2.3.4 までの cloud モードでは、ユーザーが編集可能なプレイリストは localStorage 上の MyPlaylist のみであり、外部 JSON の取り込み機能は未実装である。  
v2.4.0 では次を実現する。

1. 実装対象: プレイリストインポート機能
2. 検討対象: 将来の保存先移行（localStorage から IndexedDB 等）提案

狙いは、既存挙動を壊さずに安全な取り込み導線を追加し、容量上限に対する将来拡張の技術的な道筋を早期に固めることである。

## 2. スコープ

### 2.1 In Scope（v2.4.0 実装対象）

1. JSON ファイルのインポート UI 導線追加
2. インポート前検証
- JSON parse
- JSON Schema 検証（schemas/playlist.schema.json）
- 無害化（sanitize）
- 正規化（normalize）
3. 保存先分岐
- cloud: localStorage の AmbientMyPlaylist を上書き（存在しなければ新規）
- local: assets 配下への配置フロー
4. cloud のファイルサイズ制限判定（デバイス別初期ポリシー）
5. 異常時のエラー通知と差し戻し

### 2.2 Out of Scope（今回実装しない）

1. IndexedDB など新保存基盤への本実装
2. インポート後のメディア編集 UI 拡張
3. 複数プレイリストの同時マージ機能
4. サーバー API によるアップロード管理

## 3. 前提と互換性制約

1. 既存の cloud モード制約を維持する。
- JSON ファイル由来プレイリストは read-only。
- 更新対象は MyPlaylist のみ。
2. 既存ストレージキー互換を維持する。
- AmbientMyPlaylist
- AmbientUserData
3. 再生フローと復元フロー（playlist/category/media resume）を壊さない。
4. local mode の既存 assets 参照規約と衝突しない命名・配置規約を採用する。
5. 失敗時は部分反映しない（all-or-nothing）。

## 4. データ契約

### 4.1 import payload 契約

- 入力: ユーザー選択の JSON ファイル 1 件
- MIME/拡張子: application/json または .json（両方を許容、最終判定は実データ parse）
- 文字コード: UTF-8 を前提（UTF-8 BOM は除去して parse）

### 4.2 Schema validation 契約

1. ルートは object。
2. options は object として許容。
3. options 以外の各キーはカテゴリ配列。
4. 各 media item は title 必須。
5. draft 2020-12 スキーマに準拠して検証。

補足: 既存スキーマは additionalProperties を広く許容しているため、検証通過後も sanitize/normalize を必須とする。

### 4.3 sanitize policy（無害化）

1. 文字列フィールド
- title: 最大 100 文字
- artist: 最大 100 文字
- desc: 最大 500 文字
- 制御文字を除去（改行・タブは許容）
- HTML として解釈される危険文字列はテキスト化して保持
2. URL/パス系
- file/image/thumb はスキーム検査を実施
- javascript: など危険スキームは reject
3. options.playlist
- cloud の MyPlaylist では unsafe な custom template を保存しない方針を維持
4. 不正 item
- title 欠落または空文字は item 単位で reject 候補
- reject 件数が閾値超過ならファイル全体 reject

初期閾値案:
- 総 item の 5% 超または 10 件超を reject する場合は全体エラー

### 4.4 normalize policy（正規化）

1. 省略時のデフォルト
- category 未指定キーは生成しない（入力優先）
- item の任意項目欠落は null ではなく未定義のまま扱う
2. 型揺れ補正
- 数値系（start/end/fadein/fadeout/volume）で数値文字列は number へ変換
- 変換不能値は項目単位で削除またはデフォルト化
3. 真偽値揺れ補正
- fs/cc は boolean 優先、0/1 は boolean に寄せる
4. 並び順
- カテゴリ配列内の要素順は入力順を維持
- disc/track による再ソートは行わない

## 5. 処理フロー（図相当）

### 5.1 cloud フロー

1. ユーザーがインポート対象 JSON を選択
2. ファイルメタ情報検査（拡張子、サイズ）
3. デバイスプロファイルに応じたサイズ上限チェック
4. JSON parse
5. Schema 検証
6. sanitize 実行
7. normalize 実行
8. 再検証（正規化後の整合確認）
9. AmbientMyPlaylist へアトミック保存
10. UI 再読込（MyPlaylist 表示更新）
11. 成功トースト通知

失敗時共通:
- 途中段階で失敗した時点で保存処理を中止
- 既存 AmbientMyPlaylist は維持
- エラー内容を通知して差し戻し

### 5.2 local フロー

1. ユーザーがインポート対象 JSON を選択
2. ファイルメタ情報検査
3. JSON parse
4. Schema 検証
5. sanitize 実行
6. normalize 実行
7. assets 配下の配置先名を決定
8. 既存ファイル競合判定（上書き確認またはリネーム）
9. 配置実行
10. プレイリスト一覧へ反映
11. 成功通知

失敗時共通:
- 配置前失敗は無変更
- 配置中失敗はロールバック（テンポラリ利用）

## 6. エラー分類とユーザー通知方針

### 6.1 エラー分類

1. ImportFileError
- 拡張子不正、読み込み不能、空ファイル
2. ImportSizeLimitError
- cloud デバイス上限超過
3. ImportParseError
- JSON 構文不正
4. ImportSchemaError
- スキーマ不一致
5. ImportSanitizeError
- 危険値検出、許容超過 reject
6. ImportPersistError
- localStorage 書込失敗、assets 配置失敗
7. ImportConflictError
- local 配置時の同名競合

### 6.2 通知方針

1. UI はトースト + フォーム近傍メッセージの二層構成
2. ユーザー文言はローカライズキー化
3. 内部詳細（stack, raw payload）は画面非表示、開発ログのみ
4. リトライ可能エラーは再試行導線を表示
5. 失敗時は現行プレイリストを維持することを明示

## 7. ファイルサイズ制限ポリシー（cloud 初期案）

デバイス判定は User-Agent のみで厳密識別しない。初期は保守的上限で開始し、計測結果で調整する。

| デバイス区分 | 初期上限 | 根拠 |
| --- | ---: | --- |
| Mobile (iOS/Android) | 1 MB | localStorage 実効上限とメモリ断片化を考慮して低め開始 |
| Tablet | 2 MB | Mobile より緩和、失敗率を抑制 |
| Desktop | 4 MB | 一般的ブラウザ上限に対し安全側 |
| Unknown | 1 MB | フォールバックは最小値 |

運用ルール:
1. 判定はファイル生サイズで実施。
2. 上限超過時は検証処理に入らず即時差し戻し。
3. 将来 IndexedDB へ移行後も、初期は同等上限で運用して比較ログを取る。

## 8. 実装スライス（段階導入）

### Slice A: 取り込み基盤

1. import エントリーポイント
2. parse + schema 検証
3. 共通エラー型

完了条件:
- 不正 JSON を確実に reject できる

### Slice B: sanitize/normalize

1. フィールド単位無害化
2. 型揺れ補正
3. 再検証

完了条件:
- 危険入力や過剰入力を安全化して保存判定できる

### Slice C: cloud 永続化

1. デバイスサイズ制限
2. AmbientMyPlaylist 上書き保存
3. UI 再描画と通知

完了条件:
- cloud で上書き/新規作成が安定動作

### Slice D: local 配置

1. assets 配置パス決定
2. 競合処理
3. ロールバック

完了条件:
- local で安全に JSON 配置できる

### Slice E: 回帰保護

1. resume 挙動確認
2. cloud read-only 制約確認
3. 多言語通知確認

完了条件:
- 既存 v2.3.4 機能回帰なし

## 9. テスト観点

### 9.1 Unit

1. schema 検証関数
2. sanitize 関数（長さ制限、危険スキーム除去）
3. normalize 関数（型変換、boolean 正規化）
4. サイズ制限判定（デバイス別）
5. エラー分類マッピング

### 9.2 E2E

1. cloud 正常系
- 妥当 JSON をインポートし MyPlaylist が置換される
2. cloud 異常系
- 上限超過で reject
- schema 不一致で reject
- sanitize 失敗で reject
3. local 正常系
- assets 配置後に一覧へ反映
4. local 異常系
- 同名競合時の分岐
- 配置失敗時のロールバック
5. 回帰
- cloud JSON read-only 維持
- AmbientUserData の playlist/category/media 復元維持

## 10. 将来提案: 保存基盤移行（実装不要）

### 10.1 候補比較

| 候補 | メリット | デメリット | 主なリスク | 適合度 |
| --- | --- | --- | --- | --- |
| IndexedDB | 容量余裕が大きい、トランザクション利用可、構造化データ向き | API が複雑、実装/デバッグコスト高 | ブラウザ差異、マイグレーション失敗 | 高 |
| Cache API | Request/Response 保存が得意、PWA 文脈と相性 | 任意 JSON の主保存には不向き、検索更新が弱い | キャッシュ失効制御ミス | 低 |
| localStorage 継続 | 実装が単純、同期 API で扱いやすい | 容量小、同期ブロッキング、破損耐性低い | 上限超過、UI ブロック | 中（短期のみ） |
| OPFS (File System Access 系) | 大容量・ファイル志向 | 対応ブラウザ偏在、権限 UX が重い | 互換性不足 | 低 |

結論:
- 主候補は IndexedDB。
- Cache API は補助キャッシュ用途に限定。

### 10.2 導入方針（初期提案）

Phase 1: 抽象化
1. PlaylistStorageAdapter を導入（現実装は localStorage adapter）
2. read/write/list/delete の最小契約を固定

Phase 2: IndexedDB 併設
1. IndexedDB adapter を追加
2. 起動時に localStorage から one-time migration
3. 成功後も一定期間 dual-read で後方互換確保

Phase 3: 切替完了
1. 既定保存先を IndexedDB へ
2. localStorage はフォールバック読み取りのみ
3. 安定後に localStorage 書込を段階停止

### 10.3 移行時の安全策

1. マイグレーション前バックアップスナップショット
2. バージョン付きメタ情報保存
3. 失敗時は localStorage 経路へ自動フォールバック
4. エラーテレメトリで失敗率を可視化

## 11. 未確定事項

1. local モードでの assets 配置をブラウザ単体で完結させるか、サーバー補助 API を使うか。
2. sanitize で item 単位 reject と全体 reject の閾値最終値。
3. cloud サイズ上限の最終値（実測に基づく再調整要）。
4. import 実行権限を cloud/local でどこまで UI 側ガードするか。

## 12. 受け入れ基準

1. cloud で valid JSON のインポートに成功し、MyPlaylist が更新される。
2. cloud でサイズ超過・不正 JSON・不正データ時に差し戻しできる。
3. local で valid JSON の配置フローが成立する。
4. 失敗時に既存プレイリストを保持する。
5. 既存の read-only 制約と resume 機能を維持する。
