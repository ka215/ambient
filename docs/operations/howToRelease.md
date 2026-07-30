# リリース手順メモ

このファイルは現行の実装済みコマンドに合わせた最短運用手順です。

## 作業開始前の確認

作業を始める前に、まず現在のブランチを確認します。

```bash
git branch --show-current
```

現在のブランチが feature 系でない場合は、そのまま作業を進めず、警告を出すか、必要な feature ブランチへ切り替えてから続行します。
例外がある場合でも、この確認だけは毎回行います。

feature / fix ブランチで通常実装を行う段階では、`package.json` の `version` は更新しません。
バージョン更新はリリース開始時に `npm run release:start -- X.Y.Z` が実施するため、実装・検証中に手動で `npm version` や `package.json` の version 編集を行わないでください。

## 標準フロー（推奨）

前提:

1. 作業ブランチの変更は `dev` にマージ済み
2. `git status --short` が空であること

実行:

1. リリース開始

```bash
npm run release:start -- X.Y.Z
```

2. GitHub 上で `release/vX.Y.Z -> main` PR をレビューしてマージ

3. リリース完了（dev 同期 + ブランチ整理）

```bash
npm run release:finish -- X.Y.Z
```

4. 必要なら公開相当 E2E 検証

リリース前の確認で、まだ本番 `https://amp.ka2.org/` が旧版を配信している場合は、先に v2.6.0 配信済みの VHOST 環境を使います。
現状の v2.6.0 想定では `https://dev-amp.ka2.org/` を使うのが正です。

```bash
npm run release:verify:public
```

または:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/release-verify-public-e2e.ps1 -BaseUrl https://dev-amp.ka2.org/
```

## E2E コマンドの使い分け

`npm run test:e2e` は、v2.6.0 以降の標準 E2E として release 判定に使える split cloud/local pack を実行します。

```bash
npm run test:e2e
```

実体は `npm run release:verify:split-e2e` と同じです。

一方で、単一 `baseURL` 上に cloud/local 混在シナリオを流す broad matrix は、開発用の参照コマンドとして明示名に切り出しました。

```bash
npm run test:e2e:matrix
```

この matrix は release gate ではありません。full regression の傾向観測や、個別シナリオ切り分けの入口としてのみ使います。

## release:start の実行内容

- clean worktree の確認
- `dev` checkout + `origin/dev` の ff-only pull
- `npm run check:i18n`
- `npm run typecheck`
- `npm run build`
- `dist` 差分チェック（差分があれば停止）
- `release/vX.Y.Z` 作成
- `package.json` の version を X.Y.Z に更新してコミット
- release ブランチを push
- `gh pr create` で main 向け PR を作成（既定）

### 便利オプション

- PR を手動作成したい場合

```bash
npm run release:start -- X.Y.Z -- -SkipPr
```

- pull をスキップしたい場合

```bash
npm run release:start -- X.Y.Z -- -SkipPull
```

## release:finish の実行内容

- clean worktree の確認
- `main` 最新化
- `dev` へ `main` を取り込み（既定は ff-only）
- `dev` push
- release ブランチ削除（既定）

### 便利オプション

- ff-only 不可時に merge commit を許容

```bash
npm run release:finish -- X.Y.Z -- -AllowMergeCommit
```

- release ブランチを残す

```bash
npm run release:finish -- X.Y.Z -- -KeepReleaseBranch
```

- finish 内で公開 E2E を連続実行

```bash
npm run release:finish -- X.Y.Z -- -RunPublicE2E
```

- 公開 E2E の URL を上書き

```bash
npm run release:finish -- X.Y.Z -- -RunPublicE2E -PublicE2EBaseUrl https://example.com/
```

## release:prepare について

`npm run release:prepare -- X.Y.Z` は事前整備用の補助コマンドです。

実行内容:

1. `feature/vX.Y.Z` を checkout（必要に応じて remote から作成）
2. `npm run check:i18n`
3. `npm run typecheck`
4. `npm run build`
5. `dist` 変更があれば feature ブランチにコミット
6. `dev` を ff-only pull して最新化
7. `feature/vX.Y.Z` を `dev` に merge（`--no-edit`）
8. `dev` を remote push（既定）

この後に `npm run release:start -- X.Y.Z` を実行します。

## トラブル時の確認ポイント

1. worktree が dirty で止まった場合: 変更をコミットまたは退避
2. ff-only で止まった場合: `-AllowMergeCommit` の利用可否を判断
3. public E2E 失敗時: 先に `npm run release:verify:public` を単体で再実行して切り分け
4. 失敗時に `amp.ka2.org` を向いていた場合: その環境が対象版を配信しているかを先に確認し、未反映なら `dev-amp.ka2.org` で再検証
