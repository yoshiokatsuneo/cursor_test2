# TalentHub HRBC

PORTERS（HRBC）のように、企業・求人・候補者・選考状況を一元管理する採用 CRM / ATS の静的プロトタイプです。

## 機能

- KPI、次アクション、優先求人を確認できるダッシュボード
- 候補者 DB の横断検索、スキルタグ、推薦求人の表示
- 求人別のマッチ候補ランキング
- 取引企業、契約条件、担当者、関連求人の管理ビュー
- 選考ステージ別のパイプラインボード
- バックエンド API による検索、集計、マッチング、候補者ステージ変更、タスク完了トグル
- JSON ファイル DB によるデータ永続化（既定: `.data/hrbc-db.json`）

## 使い方

```bash
npm start
```

ブラウザで `http://localhost:4173` を開きます。

## バックエンド API

- `GET /api/workspace?query=...` - 候補者、求人、企業、KPI、推薦候補をまとめて取得
- `PATCH /api/candidates/:id/stage` - 候補者の選考フェーズを更新
- `PATCH /api/tasks/:id/toggle` - タスクの完了/未完了を切り替え
- `POST /api/reset` - デモ DB を初期状態に戻す

DB ファイルの保存先は `HRBC_DB_PATH=/path/to/db.json npm start` で変更できます。

## テスト

```bash
npm test
```