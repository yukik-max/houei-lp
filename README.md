# ホーエーホーム 完成見学会 LP

株式会社宝栄工業「ホーエーホーム」完成見学会（5/23・24）の集客ランディングページ。
Figmaデザインを忠実に再現（各セクションは高解像度画像、ナビ／予約ボタン／申込みフォームは実働HTML）。

## 構成
```
index.html               … 本体
assets/css/style.css    … スタイル
assets/js/main.js       … 追従ナビ・任意項目開閉・フォーム検証＆送信
assets/img/             … セクション画像（WebP）／ロゴ
.github/workflows/      … GitHub Actions（pushでFTP自動デプロイ）
```

## 公開前にやること（2つ）

### 1. 申込みフォームの送信先を設定（メール受信）
1. [SSGform](https://ssgform.com/)（無料）など、メール送信型フォームサービスに登録
2. 受信用メールアドレス（宝栄さん／古賀さん）を設定し、発行された **エンドポイントURL** を取得
3. `assets/js/main.js` 冒頭の `FORM_ENDPOINT` にそのURLを貼る
   ```js
   var FORM_ENDPOINT = "https://ssgform.com/s/xxxxxxxxxxxx";
   ```
   ※未設定でも画面は動きますが、送信は行われません（コンソールに警告）。

### 2. GitHub自動デプロイ用のSecretを登録（FTP）
GitHubリポジトリ → Settings → Secrets and variables → Actions → New repository secret で以下を登録:

| Secret名 | 内容 |
|:--|:--|
| `FTP_SERVER` | 宝栄サーバーのFTPホスト名 |
| `FTP_USERNAME` | FTPユーザー名 |
| `FTP_PASSWORD` | FTPパスワード |
| `FTP_SERVER_DIR` | 公開ディレクトリのパス（末尾スラッシュ必須。例 `./public_html/`） |

登録後、`main` ブランチに push すると自動でFTPアップロードされます（手動実行も可: Actions → Deploy to FTP → Run workflow）。

## あとで差し替える項目
- フッターの会社情報（住所・TEL）… `index.html` 末尾
- 「お施主さまの声」セクション … Figmaでも本文未制作。コンテンツ確定後に画像差し替え／HTML化
- OGPの絶対URL … 公開ドメイン確定後に `index.html` の `og:image` / `og:url`
- 希望日のラジオ … Figmaは仮日付だったため、実開催日 **5/23(土)・24(日)** に修正済み

## ローカル確認
```
cd houei-lp && python3 -m http.server 8000
# http://localhost:8000 を開く
```
