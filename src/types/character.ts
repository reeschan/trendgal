export interface Character {
  id: string;
  name: string;
  avatarPath: string;
  personality: 'kurisu' | 'marin';
  description: string;
}

export interface CharacterMessage {
  greeting: string;
  thinking: string;
  analysis: string;
  recommendation: string;
  reaction: string;
}

export const CHARACTERS: Character[] = [
  {
    id: 'kurisu',
    name: 'クリス',
    avatarPath: '/images/avatar.jpg',
    personality: 'kurisu',
    description: 'AI研究員クリスのファッション解析システム'
  },
  {
    id: 'marin',
    name: 'マリン',
    avatarPath: '/images/avatar2.png',
    personality: 'marin',
    description: 'コスプレイヤーマリンのトレンドファッション'
  }
];

// フォールバック用のデフォルト画像
export const DEFAULT_AVATAR_PATH = '/images/placeholder.svg';

export const CHARACTER_MESSAGES: Record<string, CharacterMessage> = {
  kurisu: {
    greeting: 'ふむ...また新しい被験者ね。まあ、私のAIファッション解析システムで、あなたの趣味を分析してあげる。',
    thinking: 'ちょっと待って...画像データを詳細に解析中よ。私の高精度アルゴリズムに任せておきなさい。',
    analysis: 'なるほど...思ったより悪くないコーディネートじゃない。データ解析完了よ。',
    recommendation: 'はあ...仕方ないから、私が厳選した類似アイテムを教えてあげる。感謝しなさい！',
    reaction: 'ちょっと！この類似度、私の予測を上回ってるじゃない...！'
  },
  marin: {
    greeting: 'やっほー♡ まりんだよ〜！今日はどんなキュートな服を見つけちゃおうかな？',
    thinking: 'うーん、どんなコーデかな〜？まりんがバッチリ分析しちゃうから待ってて！',
    analysis: 'わあああ！めっちゃ可愛いじゃん！このコーデ、まりん的にはかなり高得点だよ〜♡',
    recommendation: 'じゃじゃーん！まりんが選んだ超キュートなアイテムたち〜！絶対似合うと思う♡',
    reaction: 'えええ！？この類似度やばくない！？まりんもびっくりしちゃった〜！'
  }
};

export const CHARACTER_TITLES: Record<string, { main: string; sub: string; user: string }> = {
  kurisu: {
    main: 'TrendGal',
    sub: 'AI研究員クリスのファッション解析システム',
    user: '被験者ID:'
  },
  marin: {
    main: 'TrendGal',
    sub: 'コスプレイヤーマリンのトレンドファッション',
    user: 'ユーザー:'
  }
};

export const CHARACTER_SECTION_TITLES: Record<string, { upload: { title: string; description: string }, results: { title: string; description: string } }> = {
  kurisu: {
    upload: {
      title: '解析対象の画像データを提供しなさい',
      description: 'ファッション画像をアップロードすれば、私の高精度AIアルゴリズムで類似アイテムを検索してあげる。'
    },
    results: {
      title: '解析結果: 類似アイテム一覧',
      description: '私のアルゴリズムが検出した、統計的に類似度の高いアイテムよ。'
    }
  },
  marin: {
    upload: {
      title: 'お気に入りの画像をアップしてね♡',
      description: 'まりんが可愛いコーデを見つけて、ぴったりなアイテムを探しちゃうから〜！'
    },
    results: {
      title: 'まりんセレクト♡おすすめアイテム',
      description: 'まりんが選んだ、絶対可愛いアイテムたち！きっと気に入ると思うな〜♡'
    }
  }
};