# 競馬クイズ — BOARD EDITION

GitHub Pages向けのフラット構成です。ZIPを展開した中身をそのままリポジトリ直下へアップロードしてください。

## 構成
- `index.html` — アプリ本体
- `style.css` — 高級感を意識した90年代競馬出版物×ゲームUI
- `app.js` — ゲームロジック
- `questions.json` — 通常問題DB。後から追加可能
- `final_races.json` — FINAL問題DB。2018年以降のGⅠ
- `manifest.json` / `icon-180.png` / `icon-512.png` — ホーム画面追加用

## 問題追加
`questions.json` の `questions` 配列に同じ形式で追加します。
`choices` は4択、`answer` は馬名のみです。

## FINAL問題追加
`final_races.json` の `races` 配列に追加します。
`top` は1〜5着の馬名。画面ではレース名を表示しません。

## ゲーム仕様
通常5問 → 正解数に応じてFINALの5ヒントを開示 → 1着馬名を入力。
不正解ではヒントは増えません。FINAL正解だけが勝敗です。

## GitHub Pages
リポジトリのSettings → Pages → Deploy from a branch → main / root を選択。
