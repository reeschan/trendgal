# TrendGal - AIファッション解析システム 👗✨

AIを活用したファッション画像解析・商品推薦アプリケーション

## 🌟 特徴

- **AI画像解析**: Google Vision APIを使用したファッションアイテム検出
- **商品検索**: Yahoo Shopping APIによる類似商品の自動検索
- **キャラクターシステム**: 2つの個性的なAIキャラクター（クリス・マリン）
- **リアルタイム解析**: 画像アップロード後の即座の解析・推薦
- **レスポンシブデザイン**: モダンでインタラクティブなUI

## 🎭 キャラクター

### クリス（牧瀬紅莉栖風）
- AI研究員としてのツンデレな口調
- 科学的・論理的なアプローチ
- 「被験者」「アルゴリズム」などの専門用語を使用

### マリン（喜多川海夢風）
- 明るく親しみやすい口調
- コスプレとファッションへの情熱
- 「〜だよ〜♡」「めっちゃ可愛い！」などの表現

## 🚀 技術スタック

- **フロントエンド**: Next.js 15, React, TypeScript, Tailwind CSS
- **アニメーション**: Framer Motion
- **画像解析**: Google Vision API
- **商品検索**: Yahoo Shopping API
- **状態管理**: Zustand
- **開発環境**: ESLint, TypeScript

## 📦 セットアップ

### 前提条件

- Node.js 18以上
- Google Cloud Platform アカウント
- Yahoo Developer Network アカウント

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/reeschan/trendgal.git
cd trendgal
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.local.example .env.local
```

4. `.env.local`に以下を設定:
```env
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
YAHOO_CLIENT_ID=your_yahoo_client_id_here
```

5. 開発サーバーを起動
```bash
npm run dev
```

## 🎨 機能

### 画像解析
- ファッションアイテムの自動検出
- 色彩分析とカラーパレット抽出
- スタイル推定（カジュアル、フォーマルなど）
- アイテム属性の詳細分析

### 商品推薦
- 検出されたアイテムに基づく類似商品検索
- 色・カテゴリ・スタイルを考慮した絞り込み
- 価格・評価・レビュー数による並び替え
- フォールバック検索による結果最適化

### キャラクターシステム
- ランダムキャラクター選択
- キャラクター別の口調・UI文言
- 感情表現に基づくアニメーション
- リアルタイムキャラクター切り替え

## 🛠️ 開発

### コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
npm run lint         # ESLintチェック
```

### デバッグ

- ブラウザの開発者ツールで詳細なログを確認
- 画像解析・商品検索の各ステップをトレース
- APIレスポンスとエラー情報の詳細表示

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストや課題報告は歓迎です！

---

Made with ❤️ by reeschan
