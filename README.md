# 競馬クイズ / GitHub Pages

ZIP直下のファイルだけで構成しています。GitHubリポジトリのルートへそのままアップロードできます。

## ファイル
- `index.html` アプリ画面
- `style.css` 90年代競馬雑誌・スポーツ新聞風デザイン
- `app.js` ゲームロジック
- `questions.json` 通常問題DB
- `final_races.json` FINAL問題DB

## 1プレイ
通常問題5問 → 正解するたびにヒントを開示 → FINALで1着馬を馬名入力。

ヒント順:
1. タイム
2. 4着・5着
3. 3着
4. 2着
5. 競馬場

通常問題とFINAL問題は独立したDBなので、後から問題を追加しても固定セットにはなりません。

## 問題追加
JSONに同じ形式のオブジェクトを追加してGitHubへpushするだけです。

### 通常問題
`questions.json`
- id
- category
- difficulty
- question
- choices（4件）
- answer

### FINAL
`final_races.json`
- id
- year
- raceName
- course
- time
- winner
- finish2 / margin2
- finish3 / margin3
- finish4 / margin4
- finish5 / margin5

FINALは2018年以降のGⅠのみを登録してください。

## 注意
今回のデモはゲーム性確認用の1セットです。公開用データを大量投入する前に、競走成績を一次情報で検証してください。


## iPhoneホーム画面への追加
GitHub Pagesで公開後、iPhoneのSafariでサイトを開き、
「共有」→「ホーム画面に追加」でアプリとして追加できます。

`icon-180.png` がiPhoneホーム画面向けのアイコン、`icon-512.png` は高解像度・PWA用です。
`manifest.json` と `apple-touch-icon` の指定も `index.html` に組み込み済みです。

※ アイコンは今回指定した90年代競馬雑誌風のデザインに合わせています。
