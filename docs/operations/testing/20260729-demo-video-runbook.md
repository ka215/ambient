# Ambient Demo Video Runbook

作成日: 2026-07-29

## 1. 目的

Playwright で Ambient の紹介用デモ動画を録画するための実行手順を定義する。

通常の E2E 回帰テストとは分離し、`playwright.demo.config.ts` と `tests/demo/` のみを対象にする。

## 2. 前提

- 作業ブランチは `feature/demo-vX.Y.Z` 形式とする
- 録画 viewport は `1400x900`
- `recordVideo.size` は viewport と同じ `1400x900`
- 録画対象ブラウザは Chromium
- 通常録画は headful mode を使う
- 通常録画は `slowMo: 100ms` を既定とする
- 一次出力は WebM
- MP4 が必要な場合のみ ffmpeg で変換する
- 字幕は外部 `.vtt` ファイルとして提供する

## 3. 外部資材

正式な YouTube 動画 ID とローカルメディア素材は、録画実行時に環境変数で指定する。

環境変数のひな形はリポジトリルートの `.env.demo` に定義する。
ローカルで値をカスタマイズする場合は `.env.demo` を `.env` にコピーし、`.env` を編集する。
`.env` は Git 管理対象外であり、`npm run demo:record` と `npm run demo:mp4` の実行時に自動で読み込まれる。

| 環境変数 | 用途 | 未指定時のダミー値 |
|---|---|---|
| `AMP_DEMO_YOUTUBE_VIDEO_ID` | デモ用 YouTube 動画 ID | `M7lc1UVf-VE` |
| `AMP_DEMO_EXTRA_YOUTUBE_VIDEO_ID` | デモ中に新規追加する YouTube 動画 ID | `dQw4w9WgXcQ` |
| `AMP_DEMO_EXTRA_YOUTUBE_TITLE` | デモ中に新規追加する YouTube メディアのタイトル | `Demo added YouTube scene` |
| `AMP_DEMO_LOCAL_VIDEO_PATH` | `assets/media/` からのローカル動画相対パス | `pexels-18756591.mp4` |
| `AMP_DEMO_LOCAL_AUDIO_PATH` | `assets/media/` からのローカル音声相対パス | `209_BPM80.mp3` |
| `AMP_DEMO_SLOW_MO_MS` | Playwright 操作間隔 | `100` |
| `AMP_DEMO_PORT` | ローカル PHP サーバーの起動ポート | `8091` |
| `AMP_DEMO_OUTPUT_NAME` | WebM 出力ファイル名 | `ambient-demo.webm` |
| `AMP_DEMO_HEADLESS` | `1` の場合のみ headless mode で録画 | 未指定時は headful |
| `AMP_DEMO_CURSOR_SVG_PATH` | 疑似カーソルに使う SVG ファイルパス | 未指定時は内蔵 SVG |
| `AMP_DEMO_MP4_FRAME_RATE` | MP4 変換時の補間後フレームレート | `60` |

ローカルメディア素材は `assets/media/` 配下に配置する。

デモ用プレイリストは `tests/demo/fixtures/demo-playlist.json` を正本とする。
この JSON が存在する場合は、録画実行時に `assets/ambient-demo-playlist.json` へコピー相当の生成を行う。
JSON が存在しない場合のみ、`tests/demo/utils/demo-actions.ts` の `buildDemoPlaylist()` 内のフォールバック定義を使う。

`AMP_DEMO_YOUTUBE_VIDEO_ID` / `AMP_DEMO_LOCAL_VIDEO_PATH` / `AMP_DEMO_LOCAL_AUDIO_PATH` は、JSON 正本を使う場合も先頭3件の素材差し替えとして適用される。

録画シナリオは、JSON 内の最初のカテゴリをデモ対象カテゴリとして扱う。
このカテゴリには、少なくとも YouTube メディアを1件、ローカル動画ファイルを1件含める。
タイトルは自由に変更できる。

疑似カーソルを差し替える場合は、リポジトリルートからの相対パスで SVG を指定する。

```powershell
$env:AMP_DEMO_CURSOR_SVG_PATH='tests/demo/fixtures/cursor.svg'
npm run demo:record
```

## 4. 録画

```powershell
npm run demo:record
```

操作をさらにゆっくり見せる場合:

```powershell
$env:AMP_DEMO_SLOW_MO_MS='300'
npm run demo:record
```

画面表示なしで検証する場合:

```powershell
$env:AMP_DEMO_HEADLESS='1'
npm run demo:record
```

出力先:

```text
artifacts/demo/videos/ambient-demo.webm
```

`artifacts/demo/` は Git 管理対象外である。

## 5. 短縮検証

録画シナリオの構造確認だけを行う場合は、待機時間を短縮する。

```powershell
$env:AMP_DEMO_FAST='1'
npm run demo:record
```

短縮検証は実動画の尺確認には使わない。

短縮検証では必要に応じて headless mode を併用できる。

```powershell
$env:AMP_DEMO_FAST='1'
$env:AMP_DEMO_HEADLESS='1'
npm run demo:record
```

## 6. MP4 変換

ffmpeg が PATH に存在する環境では、最新の WebM を 60fps 補間付き MP4 に変換できる。

```powershell
npm run demo:mp4
```

入力と出力を明示する場合:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/demo/convert-demo-to-mp4.ps1 `
  -InputWebM ./artifacts/demo/videos/ambient-demo.webm `
  -OutputMp4 ./artifacts/demo/videos/ambient-demo.mp4
```

フレームレートを明示する場合:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/demo/convert-demo-to-mp4.ps1 `
  -InputWebM ./artifacts/demo/videos/ambient-demo.webm `
  -OutputMp4 ./artifacts/demo/videos/ambient-demo.mp4 `
  -FrameRate 60
```

## 7. 字幕

字幕ファイル:

```text
tests/demo/fixtures/ambient-demo.vtt
```

字幕原稿:

```text
tests/demo/fixtures/demo-caption-script.md
```

字幕は動画へ焼き込まず、外部 `.vtt` ファイルとして公開・配信する。

## 8. デモ演出

- 初回起動後に主要 SVG / 画像資材を preload する
- ローディングスプラッシュを録画向けに再表示する演出は行わない
- スプラッシュ後の UI 組み立て遅延を録画に載せないため、デモシナリオ冒頭では本体 UI を一時的に非表示にし、プレイリスト選択、左右ドロワー表示、カルーセル初期描画が完了してからフェードインする
- Playwright Test の `video: on` は page/context 作成時点から録画されるため、録画開始だけをリロード後に遅らせることは現行構成では行わない
- Media Edit モーダルでは YouTube / HTML preview と seek timeline の読み込みを待つ
- Media Edit モーダル表示後は、モーダルコンテンツを上から下へスムーズスクロールする
- Media Management では新規 YouTube メディアを実際に追加し、初期 YouTube、ローカルメディア、新規追加 YouTube の順に再生する
- 新規追加 YouTube の再生後はフルWindow表示、下部メニュー最小化、下部メニュー復帰、左ドロワー再表示、Media Edit モーダル表示へつなげる
- About Ambient では QR コードを含むカスタムコンテンツが収まるようにスクロール位置を調整する
- 主要操作は疑似カーソル overlay を使い、移動、クリック、入力を人間の操作に近づける

将来、実際に「一度起動してキャッシュを温め、再起動後から録画開始」する必要がある場合は、Playwright Test の `video: on` ではなく、persistent browser context を使う専用録画スクリプトへ切り替える。

## 9. クリーンアップ

録画成果物を削除する場合:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/demo/cleanup-demo-output.ps1
```

## 10. 検証コマンド

```powershell
npm run typecheck
npx playwright test -c playwright.demo.config.ts --list
$env:AMP_DEMO_FAST='1'; npm run demo:record
```

ffmpeg がない環境では `npm run demo:mp4` は実行せず、`ffmpeg is required but was not found in PATH.` の扱いを確認する。
