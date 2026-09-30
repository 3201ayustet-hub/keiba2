# KEIBA QUIZ — GitHub Pages + Supabase

## 今回の変更
- 通常問題の読み込み先を Supabase `quiz_questions` に変更
- Supabaseが利用できない場合は既存の `questions.json` に自動フォールバック
- FINAL問題は既存の `final_races.json` を使用
- 管理者ページから通常問題の追加・編集・削除に対応
- 元の100問を `questions.json` に同梱
- Supabaseの通常問題が0件の場合、管理者ページから元の100問を一括登録可能
- `quiz_seed_100.sql` による100問の一括登録にも対応
- 管理者ページのパスワードは従来どおり `4649`
- FINAL問題は管理者ページから閲覧のみ
- 既存のFINAL演出・5問正解時の1ST頭文字表示などは維持

## Supabase
Supabase側で `quiz_questions` テーブルと公開CRUDポリシーを作成済みであることが前提です。

ブラウザ用設定は `supabase-config.js` にあります。

- URL: `https://uczkqklqdbzkxerboatx.supabase.co/rest/v1`
- Table: `quiz_questions`

## quiz_questions の項目
- `id`
- `question`
- `option1`
- `option2`
- `option3`
- `option4`
- `correct_option`（1〜4）
- `explanation`
- `active`
- `created_at`
- `updated_at`

## GitHub Pages
このZIPのファイルをGitHub Pagesの公開ブランチへ配置してください。
`index.html` がゲーム、`admin.html` が管理者ページです。

## 初期100問の登録

管理者ページで通常問題が0件の場合、`初期100問を登録` ボタンが表示されます。これを押すと同梱の `questions.json` から元の100問をSupabaseの `quiz_questions` に登録します。登録後は通常問題と同じように編集・削除できます。

SQL Editorから登録する場合は、同梱の `quiz_seed_100.sql` を使用できます。

## 注意
この構成ではSupabaseのPublishable Keyをブラウザに配置します。Publishable Key自体は公開前提ですが、現在のSQLポリシーは匿名ユーザーの追加・編集・削除を許可しています。URLを知っている人全員で共同編集する今回の仕様に合わせたものです。

本番運用で荒らし対策が必要になった場合は、Supabase Auth + RLSによる編集者認証へ移行してください。
