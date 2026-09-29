# 競馬クイズ GitHub Pages版

## 構成
- `index.html` — アプリ本体
- `assets/app.js` — ゲームロジック
- `assets/style.css` — UI
- `data/questions.json` — 通常問題DB
- `data/final_races.json` — FINAL問題DB

## ゲーム
通常問題5問 → 正解するたびにヒント開示 → FINALで2018年以降のG1着順掲示板から1着馬を回答。

ヒント順:
1. タイム
2. 4着・5着
3. 3着
4. 2着
5. 競馬場

## 問題追加
GitHub上でJSONを編集してpushするだけで追加できます。
通常問題とFINAL問題は完全に独立しているため、毎回別の組み合わせになります。

### 通常問題
`data/questions.json` に追加:
`id`, `category`, `difficulty`, `question`, `choices`（4件）, `answer`

### FINAL
`data/final_races.json` に追加:
`id`, `year`, `raceName`, `course`, `time`, `winner`, `finish2`, `margin2`, `finish3`, `margin3`, `finish4`, `margin4`, `finish5`, `margin5`

FINAL DBには2018年以降のG1のみ登録してください。

## 注意
サンプル問題の `source` は要確認です。公開前にJRA等の一次情報で全データを検証してください。
