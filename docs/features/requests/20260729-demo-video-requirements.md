# Ambient Demo Video Requirements

作成日: 2026-07-29

## 1. 目的

Ambient Media Player（以下 AMP）の最大価値である「YouTube の動画と PC ローカルの音楽・動画ファイルを 1 つのプレイリストにまとめ、ブラウザ上でシームレスに再生できること」を、2分30秒から3分程度の紹介動画として伝える。

この動画は、README、リリース告知、配布ページ、GitHub などで利用できるアプリ紹介素材とする。

## 2. 成果物

- Playwright によるデモ動画生成シナリオ
- デモ用 fixture playlist
- デモ用ローカルメディア素材の配置手順
- WebM 録画出力スクリプト
- WebM から MP4 へ変換する ffmpeg 実行スクリプト
- 字幕用の原稿
- デモ録画手順書

## 3. 非成果物

- 生成済み動画ファイルは Git 管理しない
- `demo` ブランチから基軸ブランチへのマージは行わない
- 大容量メディア、利用許諾が不明な素材、著作権管理が困難な素材は Git 管理しない
- 音声ナレーションは初期スコープ外とし、当面は字幕のみとする
- 字幕は外部字幕ファイルとして提供し、動画への焼き込みは行わない

## 4. ブランチ運用

### 4.1 恒常管理ブランチ

- 最新の `dev` または `main` から `demo` ブランチを作成する
- `demo` ブランチはデモ動画シナリオ管理専用の恒常ブランチとする
- `demo` ブランチから `dev` / `main` / `v2-dev` などの基軸ブランチへのマージは禁止する

### 4.2 作業ブランチ

- デモシナリオ更新作業は `demo` ブランチから作業ブランチを作成して行う
- 作業ブランチ名は取り込み元バージョンを含める
- 例: `demo/v2.6.0`, `demo/v2.6.1`

## 5. 動画仕様

### 5.1 尺

- 目標時間: 2分30秒
- 許容範囲: 2分30秒から3分以内

### 5.2 画面サイズ

- 録画 viewport は `1321x842` 以上とする
- AMP の左右ドロワーが同時表示できること
- 下部メニューが「Youtubeで観る」ボタンを覆い隠さないこと
- 推奨録画サイズは `1400x900` とする
- Playwright 設定上は、最小条件 `1321x842` を下回らないように固定 viewport を指定する

### 5.3 出力形式

- 原則として WebM を正式出力とする
- MP4 が必要な場合は、ffmpeg による変換スクリプトで WebM から生成する
- MP4 変換は補助機能であり、Playwright 録画の一次成果物は WebM とする

### 5.4 UI 言語

- 基本は英語 UI とする
- 字幕は日本語で管理してよい
- 字幕は外部字幕ファイルとして提供する
- 外部字幕ファイル形式は `.vtt` とする
- 音声ナレーションは当面作成しない

### 5.5 対象ブラウザ

- Chromium のみを対象とする
- Firefox / WebKit / mobile / tablet の録画は初期スコープ外とする

## 6. 動画構成

### 6.1 導入: 0:00 - 0:25

画面:
- Ambient のトップ画面
- 左右ドロワーと下部メニューの全体感が分かる状態

説明:
- YouTube とローカルの動画・音楽ファイルをブラウザ上でまとめて管理・ミックス再生できる無料のオープンソースプレイヤーであることを伝える

訴求点:
- 最初に「何ができるツールなのか」を短く示す

### 6.2 コア機能1: YouTube とローカルファイルのミックス: 0:25 - 1:15

画面:
- `Media Management` セクション
- YouTube URL 登録操作
- ローカルファイル登録操作、またはデモ用 fixture による登録済み状態の提示
- YouTube とローカルメディアが同一プレイリストに混在している状態

説明:
- AMP の最大の特長は、YouTube 動画と PC に保存されているメディアを同じプレイリストに混在させられる点であることを伝える

実装上の方針:
- OS のファイル選択ダイアログは録画対象にしない
- ローカルファイル登録は `page.setInputFiles()` または fixture 注入で安定化する
- YouTube URL やローカル素材はデモ用に固定する
- デモ用 YouTube 動画 ID とローカルメディア素材は外部資材として別管理する
- シナリオ作成時には、必要に応じて環境変数で外部資材を指定できるようにする
- 環境変数が未指定の場合は、動作確認用のダミー値を使う

### 6.3 コア機能2: 細かな再生・演出設定: 1:15 - 2:00

画面:
- `Media Edit`
- `Settings`
- Seek start / end
- Fade in / fade out
- Seek and Play
- Pseudo Fader

説明:
- メディアごとに再生開始・終了時間を指定できること
- 曲間のフェードイン・フェードアウトを設定できること
- 自分好みの BGM 環境、環境ビデオプレイヤーを構築できること

訴求点:
- 他の動画プレイヤーとの差別化要素として、再生範囲と擬似フェーダーを見せる

### 6.4 プレイリストの管理・共有: 2:00 - 2:20

画面:
- `Playlist Management`
- `Export Playlist`
- JSON エクスポート操作

説明:
- 作成したプレイリストを JSON 形式でエクスポートできること
- バックアップや他 PC / 他ユーザーとの共有に使えること

実装上の方針:
- ブラウザのダウンロード UI ではなく、アプリ内の操作と完了状態を中心に見せる

### 6.5 まとめ・エンディング: 2:20 - 2:30

画面:
- `About Ambient`
- フッターまたはアプリ情報表示

説明:
- ブラウザがあれば無料で利用できること
- 自分だけのメディア環境を作れること

## 7. 実装方針

### 7.1 ディレクトリ構成

通常の E2E テストとデモ録画シナリオは分離する。

```text
tests/demo/
  ambient-demo.spec.ts
  fixtures/
    demo-playlist.json
    demo-caption-script.md
  utils/
    demo-actions.ts
    demo-overlays.ts

scripts/demo/
  run-demo.ps1
  convert-demo-to-mp4.ps1
  cleanup-demo-output.ps1

playwright.demo.config.ts
```

### 7.2 Playwright 設定

- `testDir` は `./tests/demo`
- `project` は Chromium のみ
- `viewport` は `1400x900`
- 最小許容 viewport は `1321x842`
- `workers` は `1`
- `retries` は `0`
- `timeout` は `240_000` 程度
- `recordVideo.dir` は `artifacts/demo/videos`
- `E2E_BASE_URL` で対象環境を切り替え可能にする
- `AMP_DEMO_YOUTUBE_VIDEO_ID` などの環境変数でデモ用 YouTube 動画 ID を差し替え可能にする
- `AMP_DEMO_LOCAL_VIDEO_PATH` / `AMP_DEMO_LOCAL_AUDIO_PATH` などの環境変数でデモ用ローカルメディア素材を差し替え可能にする

### 7.3 録画安定化

- 既存 E2E と同様に `localStorage` 注入や fixture JSON を活用する
- YouTube API の読み込み待ちは既存 fixture の待機ロジックを再利用する
- ローカルメディアは利用者が別途準備した短い MP4 / MP3 を使う
- 素材未指定時は、シナリオ実装側で定義したダミー値を利用する
- 実ファイル選択ダイアログは録画対象にしない
- デモ中の操作速度、待機時間、スクロール量を固定する
- 必要に応じて Playwright からハイライト overlay や注目表示を DOM 注入する

### 7.4 npm scripts

以下の scripts を追加する。

```json
{
  "demo:record": "powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/demo/run-demo.ps1",
  "demo:mp4": "powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/demo/convert-demo-to-mp4.ps1"
}
```

## 8. MP4 変換方針

WebM から MP4 への変換は ffmpeg を前提とする。

想定コマンド:

```powershell
ffmpeg -i input.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart output.mp4
```

変換スクリプトの要件:

- 入力 WebM を引数で指定できる
- 出力 MP4 パスを引数で指定できる
- 未指定時は `artifacts/demo/videos` 配下の最新 WebM を対象にできる
- ffmpeg が存在しない場合は明確なエラーを出す
- 変換後の MP4 も Git 管理しない

## 9. Git 管理対象

Git 管理する:
- Playwright デモシナリオ
- デモ用 fixture playlist
- デモ用スクリプト
- 字幕・ナレーション原稿
- 実行手順書
- 小容量かつ利用許諾が明確なデモ素材

Git 管理しない:
- WebM / MP4 の生成済み動画
- 大容量メディア
- 利用許諾が不明なメディア
- 一時録画 artifacts

想定 `.gitignore` 追加:

```gitignore
artifacts/demo/
```

## 10. 実装計画

### Phase 1: 要件定義・運用設計

- 本要件定義書を基準文書として保存する
- `demo` ブランチ運用ルールを確定する
- 動画サイズ、尺、出力形式、素材管理方針を確定する
- 受入条件を確定する

### Phase 2: デモ実行基盤

- `playwright.demo.config.ts` を追加する
- `tests/demo` を追加する
- `scripts/demo/run-demo.ps1` を追加する
- `scripts/demo/convert-demo-to-mp4.ps1` を追加する
- `artifacts/demo/` を Git 管理対象外にする

### Phase 3: デモシナリオ実装

- 英語 UI で起動する
- `AMP_DEMO_YOUTUBE_VIDEO_ID` などの環境変数でデモ用外部資材を参照できるようにする
- 環境変数未指定時のダミー値を定義する
- デモ用 playlist を注入する
- YouTube とローカルメディアの混在状態を表示する
- Media Management の登録導線を見せる
- Media Edit で seek / fade 設定を見せる
- Settings で Seek and Play / Pseudo Fader を見せる
- Playlist Management で Export Playlist を見せる
- About Ambient で締める

### Phase 4: 字幕素材

- 字幕原稿を Markdown で管理する
- 外部字幕ファイルとして `.vtt` を追加する
- 動画への字幕焼き込みは行わない
- 音声ナレーションは当面作成しない

### Phase 5: 検証

- `npm run demo:record` で WebM が生成されることを確認する
- `npm run demo:mp4` で MP4 変換できることを確認する
- 動画尺が 2分30秒から3分以内であることを確認する
- viewport が `1321x842` 以上であることを確認する
- 左右ドロワーが同時表示されることを確認する
- 下部メニューが「Youtubeで観る」ボタンを覆い隠さないことを確認する
- 出力動画が Git 管理対象外であることを確認する

## 11. 受入条件

- `demo` または `demo/vX.Y.Z` ブランチ上で録画シナリオを実行できる
- `npm run demo:record` で WebM が生成される
- `npm run demo:mp4` で MP4 へ変換できる
- 生成動画の長さが 2分30秒から3分以内である
- 録画 viewport が `1400x900` である
- 録画 viewport が最小許容サイズ `1321x842` を下回らない
- AMP の左右ドロワーが同時表示される
- 下部メニューが「Youtubeで観る」ボタンを覆い隠さない
- 動画内で次の内容が確認できる
  - YouTube メディア
  - ローカルメディア
  - YouTube とローカルメディアが同一プレイリストに混在している状態
  - Seek start / end
  - Pseudo Fader
  - Playlist export
  - About Ambient
- 生成済み WebM / MP4 は Git 管理されない
- 通常の `npm run test:e2e` にデモシナリオが混入しない
- デモ用 YouTube 動画 ID とローカルメディア素材を環境変数で差し替えられる
- 環境変数未指定時のダミー値が定義されている
- 字幕は外部 `.vtt` ファイルとして提供される
- 初期公開先として `https://amp.ka2.org/assets/media/ambient-demo.webm` を想定している

## 12. 主要リスク

- YouTube 側の読み込み、広告、埋め込み制限により録画が不安定になる可能性がある
- Playwright 標準録画は音声収録用途には向かないため、将来音声を入れる場合は後処理前提が望ましい
- ローカルメディア素材を Git 管理する場合、容量とライセンス管理が必要
- 2分30秒から3分の尺に収めるには、操作待機時間を固定しすぎず、冗長な UI 操作を避ける必要がある
- Export Playlist のダウンロード表示はブラウザ UI ではなく、アプリ内の操作完了状態で表現する必要がある

## 13. 決定事項と未決事項

### 13.1 決定事項

- デモ用 YouTube 動画 ID はユーザーが別途準備する
- デモ用ローカル MP4 / MP3 素材はユーザーが別途準備する
- シナリオ作成時に必要であれば、外部資材は環境変数で差し替え可能にする
- 環境変数未指定時はダミー値を定義する
- ナレーションは当面作成せず、字幕のみとする
- 字幕は外部字幕ファイルとして提供し、動画への焼き込みは行わない
- 外部字幕ファイル形式は `.vtt` とする
- 推奨録画サイズは `1400x900` とする
- 生成動画の初期公開先は `https://amp.ka2.org/` とする
- 暫定公開 URL は `https://amp.ka2.org/assets/media/ambient-demo.webm` とする

### 13.2 未決事項

- 正式なデモ用 YouTube 動画 ID
- 正式なデモ用ローカル MP4 / MP3 素材
