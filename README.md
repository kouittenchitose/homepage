# 🌌 光一天 サイト管理システム

公立千歳科学技術大学 YOSAKOIソーラン部「光一天」の公式ウェブサイト管理システムです。  
「サーバー代0円・メンテナンス不要・スマホ1つで更新」というコンセプトで構築された、Cloudflare Pages + 自作CMSベースのインフラを採用しています。

## 📋 概要

このプロジェクトは、YOSAKOIソーラン部の活動をオンラインで発信するための完全サーバーレスなウェブサイトです。  
コンテンツ管理はブラウザベースの管理画面から行え、技術的な知識がなくても更新可能です。

## 🏗 システムアーキテクチャ

### インフラ構成
- **Cloudflare Pages**: 静的サイトホスティング + Functions (API)
- **Cloudflare R2**: オブジェクトストレージ (JSONデータ + 画像)
- **GitHub**: ソースコード管理 + CI/CD

### データフロー
1. ユーザーがブラウザでサイトにアクセス
2. HTML/CSS/JSがCloudflare Pagesから配信
3. 動的コンテンツはCloudflare Functions経由でR2から取得
4. 管理画面からコンテンツ更新時はFunctions経由でR2に保存

## 🛠 技術スタック

### フロントエンド
- **HTML5/CSS3**: セマンティックなマークアップ + Apple風デザイン
- **Vanilla JavaScript**: jQuery不使用の軽量実装
- **レスポンシブデザイン**: モバイルファースト

### バックエンド
- **Cloudflare Workers**: エッジコンピューティング (Functions)
- **Cloudflare R2**: S3互換オブジェクトストレージ
- **RESTful API**: JSONベースのシンプルなAPI設計

### 開発ツール
- **Wrangler**: Cloudflare Workers開発CLI
- **Git**: バージョン管理
- **VS Code**: 開発環境

## 📁 ファイル構成

### ルートディレクトリ
```
/
├── wrangler.jsonc          # Cloudflare設定ファイル
├── package.json            # Node.js依存関係
├── .assetsignore           # アセット除外設定
├── README.md               # このファイル
├── index.html              # トップページ
├── about.html              # チーム紹介ページ
├── works.html              # 作品一覧ページ
├── work-detail.html        # 作品詳細ページ
├── news.html               # お知らせ一覧ページ
├── news-detail.html        # お知らせ詳細ページ
├── 10th-anniv.html         # 10周年記念ページ
├── sponsors.html           # 協賛ページ（CMS「表示管理」で公開）
├── anniv-visibility.js     # 記念ページ表示制御
├── admin/                  # 管理画面関連
├── functions/              # Cloudflare Functions
└── shared/                 # 共有コンポーネント
```

### 詳細ファイル説明

#### フロントエンド (ユーザーページ)
- **`index.html`**: トップページ
  - ヒーロー背景画像 (動的読み込み)
  - ピックアップ記事 (最新ニュースから3件)
  - 最新ニュース一覧 (5件)
  - Instagram埋め込み

- **`about.html`**: チーム紹介ページ
  - 沿革 (history) と受賞歴 (awards) のタイムライン表示

- **`works.html`**: 作品一覧
  - 全作品をグリッド表示
  - 年次順ソート

- **`work-detail.html?id={id}`**: 作品詳細ページ
  - 作品タイトル、年、ストーリー、受賞歴、画像表示

- **`news.html`**: お知らせ一覧
  - 全記事をリスト表示
  - 日付順ソート

- **`news-detail.html?id={id}`**: お知らせ詳細ページ
  - 記事タイトル、日付、本文、画像表示

- **`10th-anniv.html`**: 10周年記念特設ページ
  - 記念コンテンツ表示
  - 公開/非公開は CMS「表示管理」から

- **`sponsors.html`**: 協賛企業・団体一覧
  - CMS「表示管理」で項目入力・公開可否を設定

#### 管理画面
- **`admin/admin.html`**: CMSメイン画面
  - タブ式インターフェース (ニュース/作品/紹介/画像/**表示管理**/ゴミ箱)
  - ログイン認証
  - インライン画像アップロード

- **`admin/admin.css`**: 管理画面スタイル
- **`admin/admin.js`**: 管理画面メインスクリプト
  - データCRUD操作
  - UI状態管理

- **`admin/content-editors.js`**: コンテンツ編集機能
  - ニュース/作品編集フォーム
  - バリデーション

- **`admin/media-trash.js`**: メディア管理機能
  - 画像アップロード/削除
  - 固定アセット管理 (ロゴ/ヒーロー背景)
  - ゴミ箱機能

- **`admin/core.js`**: API通信ユーティリティ
  - fetchラッパー
  - エラーハンドリング

#### API (Cloudflare Functions)
- **`functions/api/content.js`**: メインAPIハンドラー
  - コンテンツ取得/保存
  - デフォルトデータ提供
  - ETagキャッシュ制御

- **`functions/api/admin-core.js`**: 管理APIハンドラー
  - 認証
  - CRUD操作
  - メディア管理
  - アセットマップ生成

#### 共有コンポーネント
- **`shared/site-shell.js`**: サイト共通機能
  - ロゴ動的読み込み
  - メニュー制御

- **`anniv-visibility.js`**: 記念ページ制御
  - 公開状態チェック
  - リダイレクト処理

### 依存関係マップ

```
index.html
├── shared/site-shell.js (ロゴ読み込み)
├── anniv-visibility.js (記念ページ制御)
└── functions/api/content.js (コンテンツ取得)

admin.html
├── admin/admin.css
├── admin/core.js (API通信)
├── admin/admin.js (メインUI)
├── admin/content-editors.js (編集機能)
└── admin/media-trash.js (メディア管理)

各ページ → functions/api/content.js (データ取得)
管理画面 → functions/api/admin-core.js (データ操作)
```

## 🔧 実行環境

### 必須要件
- **Node.js**: v16以上
- **npm**: 最新版
- **Cloudflareアカウント**: Pages + R2 + Workers有効
- **Git**: バージョン管理用

### 推奨環境
- **OS**: macOS/Linux (Windowsでも可)
- **ブラウザ**: Chrome最新版 (開発時)
- **エディタ**: VS Code + Wrangler拡張

## 🚀 セットアップ

### 1. リポジトリクローン
```bash
git clone <repository-url>
cd testkouitten
```

### 2. 依存関係インストール
```bash
npm install
```

### 3. Cloudflare設定
#### R2バケット作成
```bash
# CloudflareダッシュボードでR2バケットを作成
# バケット名: testkouitten-media
# 公開アクセス有効化
```

#### wrangler.jsonc設定
```jsonc
{
  "name": "testkouitten",
  "compatibility_date": "2026-05-12",
  "main": "functions/api/content.js",
  "assets": {
    "directory": "./",
    "binding": "ASSETS"
  },
  "r2_buckets": [
    {
      "binding": "MEDIA_BUCKET",
      "bucket_name": "testkouitten-media"
    }
  ],
  "vars": {
    "R2_PUBLIC_DOMAIN": "your-r2-domain.r2.dev",
    "ADMIN_USER": "your-admin-username",
    "ADMIN_PASSWORD": "your-admin-password"
  }
}
```

#### 認証情報設定
```bash
# Cloudflareアカウント認証
npx wrangler auth login

# 環境変数設定 (本番環境)
npx wrangler secret put ADMIN_USER
npx wrangler secret put ADMIN_PASSWORD
```

### 4. ローカル開発
```bash
# 開発サーバー起動
npx wrangler dev

# ブラウザで http://localhost:8787 にアクセス
```

## 📦 開発ワークフロー

### コンテンツ更新フロー
1. 管理画面 (`admin.html`) にログイン
2. 該当タブでコンテンツ編集
3. 保存ボタンクリック → API経由でR2保存
4. ホームページ自動反映

### 画像アップロードフロー
1. 管理画面の「固定画像管理」タブ
2. ヒーロー背景/ロゴを選択してアップロード
3. R2に保存され、URL生成
4. ホームページで動的読み込み

### コード変更フロー
1. ローカルで編集
2. `wrangler dev` でテスト
3. Gitコミット
4. GitHubプッシュ → Cloudflare Pages自動デプロイ

## 🌐 API仕様

### 公開API (functions/api/content.js)

#### GET /api/content?type={type}&id={id}
コンテンツ取得

**パラメータ:**
- `type`: news|works|about|anniv|anniv-config|sponsors
- `id`: (オプション) 作品/ニュースID
- `pinned`: (オプション) ピックアップ記事のみ
- `limit`: (オプション) 取得件数

**レスポンス:** JSON

#### 例
```javascript
// ピックアップニュース取得
fetch('/api/content?type=news&pinned=true')

// 作品詳細取得
fetch('/api/content?type=works&id=w2024')
```

### 管理API (functions/api/admin-core.js)

#### POST /api/admin-core
管理操作 (認証必須)

**アクション:**
- `ping`: 認証チェック
- `get-json`: データ取得
- `save-json`: データ保存
- `get-trash`: ゴミ箱取得
- `move-to-trash`: ゴミ箱移動
- `restore-trash`: 復元
- `delete-trash`: 完全削除
- `list-files`: ファイル一覧
- `upload`: ファイルアップロード
- `delete-file`: ファイル削除
- `rename-file`: ファイル名変更
- `get-assets-map`: アセットURLマップ取得

## 🚀 デプロイ

### Cloudflare Pages設定
1. Cloudflareダッシュボード → Pages
2. 「Create a project」→ GitHub連携
3. リポジトリ選択 → ビルド設定:
   - Build command: (空)
   - Build output directory: (空)
   - Functions directory: functions
4. 環境変数設定 (R2_PUBLIC_DOMAIN, ADMIN_USER, ADMIN_PASSWORD)
5. デプロイスキップ設定 (wrangler.jsonc を除外)

### 自動デプロイ
GitHub mainブランチにプッシュすると自動デプロイされます。

## 🔍 トラブルシューティング

### 画像が反映されない
1. 管理画面で固定画像がアップロードされているか確認
2. ブラウザキャッシュクリア (Ctrl+F5)
3. 開発者ツールでAPIレスポンス確認
4. R2_PUBLIC_DOMAIN が正しいか確認

### 管理画面がログインできない
1. ADMIN_USER / ADMIN_PASSWORD が正しく設定されているか確認
2. wrangler secret が本番環境に反映されているか確認

### APIエラー
1. Cloudflare Functionsログ確認
2. R2バケット権限確認
3. wrangler.jsonc のbinding設定確認

### ビルドエラー
1. Node.jsバージョン確認 (v16+)
2. 依存関係再インストール: `rm -rf node_modules && npm install`
3. wranglerバージョン確認: `npm update wrangler`

## 📝 開発メモ

- **データ構造**: JSONベースのシンプル設計
- **キャッシュ**: ETag + Cache-Controlヘッダー使用
- **セキュリティ**: 管理APIはBasic認証
- **パフォーマンス**: エッジロケーションでの高速配信
- **拡張性**: 新コンテンツタイプの容易な追加可能

## 🤝 貢献

1. Fork
2. Featureブランチ作成
3. 変更実装
4. Pull Request

## 📄 ライセンス

このプロジェクトは光一天部内での使用を目的としています。
