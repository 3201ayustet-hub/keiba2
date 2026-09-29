# 競馬クイズ

GitHub Pages向けのフラット構成です。ZIPを展開した中身をそのままリポジトリ直下へアップロードしてください。

## デザイン方針
90年代の高級な競馬ゲーム／競馬専門誌を想定し、装飾を増やすのではなく、タイポグラフィ・余白・罫線・紙質で世界観を構成しています。通常クイズ、FINAL、結果画面はそれぞれ1画面内で完結します。

## 構成
- `index.html` — アプリ本体
- `style.css` — UI / タイポグラフィ / レスポンシブデザイン
- `app.js` — ゲームロジック
- `questions.json` — 通常問題DB。後から追加可能
- `final_races.json` — FINAL問題DB。2018年以降のGⅠ
- `manifest.json` / `icon-180.png` / `icon-512.png` — ホーム画面追加用（初期版アイコンを固定）

## 問題追加
`questions.json` の `questions` 配列に同じ形式で追加します。`choices` は4択、`answer` は馬名のみです。

## FINAL問題追加
`final_races.json` の `races` 配列に追加します。`top` は1〜5着の馬名。ゲーム画面ではレース名を表示しません。

## ゲーム仕様
通常5問 → 正解数に応じてFINALの5ヒントを開示 → 1着馬名を入力。通常問題の不正解ではヒントは増えません。FINAL正解だけが勝敗です。

## GitHub Pages
リポジトリのSettings → Pages → Deploy from a branch → main / root を選択。
