# 沼タイマー (Numa Timer)

YouTube / X を見ている時間を、ドメインごとに「今日どれだけ使ったか」で可視化する Chrome 拡張です。

> [!WARNING]
> この拡張機能は Chrome ウェブストア未公開です。
> ローカルビルド、または GitHub Releases から取得したファイルを読み込んでください。

## できること

- YouTube / X の当日利用時間を秒単位で計測
- ドメインごとに `popup` から計測 ON/OFF
- 計測中のページ右上にタイマー表示
- 表示カードの折りたたみ（カウンターのみ表示）

## 対象ドメイン

- `https://youtube.com/*`
- `https://*.youtube.com/*`
- `https://x.com/*`
- `https://*.x.com/*`

## セットアップ

### 前提

- `node` 20.12.2
- `pnpm` 9.12.3

`mise` を使う場合:

```bash
mise install
```

### 依存インストール

```bash
pnpm install
```

### 開発ビルド

```bash
pnpm dev
```

### 本番ビルド

```bash
pnpm build
```

## 拡張機能の読み込み

### GitHub Releases から読み込む

1. [Releases](https://github.com/Kyo-s-s/numa-timer/releases) を確認し、`main-latest` または必要なバージョンの zip をダウンロード
2. ダウンロードした zip を展開
3. [`chrome://extensions/`](chrome://extensions/) を開く
4. 右上の「デベロッパー モード」を ON
5. 「パッケージ化されていない拡張機能を読み込む」から展開したフォルダを選択

### ローカルビルドから読み込む

1. `pnpm dev` または `pnpm build` を実行
2. [`chrome://extensions/`](chrome://extensions/) を開く
3. 右上の「デベロッパー モード」を ON
4. 「パッケージ化されていない拡張機能を読み込む」を選択
5. 開発時は `build/chrome-mv3-dev`、本番ビルド時は `build/chrome-mv3-prod` を指定


## 使い方

1. 拡張の popup を開く
2. YouTube / X のスイッチで計測対象を切り替える
3. 対象ドメインを開くと、右上に `Numa Timer · <Domain>` が表示される
4. ヘッダー右のアイコンで折りたたみ/展開

## 計測仕様（現時点）

- 計測するのは「タブが表示中」かつ「そのタブにフォーカスがある」時間
- ドメインが OFF のときは、計測も表示も行わない
- 日付が変わると当日カウンタは自動でリセット
- 日次合計キーに加算保存する

## データ保存

- 設定キー: `numa-timer:settings:v1`
- 日次合計キー: `numa-timer:daily-total:v1:<YYYY-MM-DD>:<domain>`
- 保存先: `chrome.storage.local`（`@plasmohq/storage`）

## 今後

- 統計情報ページ（履歴/傾向の可視化）は feature work として今後追加予定
