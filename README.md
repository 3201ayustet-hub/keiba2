# KEIBA QUIZ — GitHub Pages implementation

iPhone縦画面を前提にした競馬クイズアプリです。

## 構成
- 通常問題：`questions.json` から毎プレイ5問をランダム抽出
- 選択肢：毎問ランダム配置
- 正解位置：シャッフルにより固定化しない
- 回答後：○ / ×、正解時のみPANEL GET演出、NEXT表示
- 不正解時：正解馬名を表示しない
- FINAL：`final_races.json` から1レースをランダム抽出
- FINALのレース名はUIに表示しない
- FINALのヒント操作は存在しない
- 通常5問の正解数で、FINAL開始時に0〜5枚のパネルを開く
- 開放順：TIME → 4TH/5TH → 3RD → 2ND → VENUE
- FINALの正解のみ最終結果を決定

## データ
現在のFINAL DBは、2018〜2025年192レース＋2026年9月27日までの開催済み13レース＝205レースです。
2026年未開催レースは結果が存在しないため、プレイ可能FINAL DBには入れていません。

2〜5着・タイムは一次資料による全件再照合が未完のため、データ側で確認状態を隠していません。未確認データを新たに推測して補完していません。

## GitHub Pages
ZIPを展開し、直下に以下を置いてください。
`index.html / style.css / app.js / questions.json / final_races.json / manifest.json / icon.svg / icon-180.png / icon-512.png / README.md`
