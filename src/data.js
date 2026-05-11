export const pipelineStages = [
  { id: "sourcing", label: "ソーシング", tone: "blue" },
  { id: "screening", label: "書類確認", tone: "purple" },
  { id: "interview", label: "面接調整", tone: "orange" },
  { id: "offer", label: "内定・条件", tone: "green" },
  { id: "placed", label: "決定", tone: "teal" }
];

export const clients = [
  {
    id: "cl-001",
    name: "株式会社クラウドリンク",
    industry: "SaaS",
    owner: "佐藤",
    location: "東京",
    contract: "成功報酬 35%",
    openJobs: 3,
    health: "high",
    contacts: [
      { name: "田中 美咲", role: "VP of Engineering", email: "misaki.tanaka@example.com" },
      { name: "山本 陽介", role: "HR Business Partner", email: "yosuke.yamamoto@example.com" }
    ],
    memo: "エンタープライズ向けワークフロー製品を展開。採用意思決定が速い。"
  },
  {
    id: "cl-002",
    name: "ネクストリテール株式会社",
    industry: "Retail Tech",
    owner: "鈴木",
    location: "大阪",
    contract: "成功報酬 30%",
    openJobs: 2,
    health: "medium",
    contacts: [
      { name: "小林 拓也", role: "CTO", email: "takuya.kobayashi@example.com" }
    ],
    memo: "店舗 DX のプロダクトを拡大中。関西勤務とリモート併用の相談可。"
  },
  {
    id: "cl-003",
    name: "メディカルデータラボ",
    industry: "Healthcare AI",
    owner: "高橋",
    location: "福岡",
    contract: "固定 + 成功報酬",
    openJobs: 2,
    health: "high",
    contacts: [
      { name: "井上 彩", role: "採用責任者", email: "aya.inoue@example.com" }
    ],
    memo: "医療データ基盤と AI 解析を提供。ドメイン経験者を優先。"
  }
];

export const jobs = [
  {
    id: "job-001",
    title: "シニアバックエンドエンジニア",
    clientId: "cl-001",
    status: "open",
    priority: "A",
    location: "東京 / リモート",
    salaryMin: 850,
    salaryMax: 1200,
    positions: 2,
    owner: "佐藤",
    requiredSkills: ["Node.js", "TypeScript", "AWS", "API設計"],
    niceToHave: ["SaaS", "DDD"],
    stageGoal: "一次面接を今週 3 名設定",
    description: "B2B SaaS のワークフロー基盤を設計し、スケールする API と権限モデルを改善するポジション。"
  },
  {
    id: "job-002",
    title: "プロダクトマネージャー",
    clientId: "cl-001",
    status: "open",
    priority: "A",
    location: "東京",
    salaryMin: 900,
    salaryMax: 1300,
    positions: 1,
    owner: "佐藤",
    requiredSkills: ["B2B SaaS", "ロードマップ", "顧客折衝", "データ分析"],
    niceToHave: ["エンタープライズ営業", "SQL"],
    stageGoal: "要件定義経験のある候補者を追加提案",
    description: "顧客要望とプロダクト戦略を接続し、エンタープライズ向け機能の優先順位を決める役割。"
  },
  {
    id: "job-003",
    title: "フロントエンドリード",
    clientId: "cl-002",
    status: "open",
    priority: "B",
    location: "大阪 / リモート",
    salaryMin: 750,
    salaryMax: 1050,
    positions: 1,
    owner: "鈴木",
    requiredSkills: ["React", "TypeScript", "UI設計", "アクセシビリティ"],
    niceToHave: ["Design System", "Retail Tech"],
    stageGoal: "UI 実績の強い候補者を 2 名推薦",
    description: "店舗オペレーション支援アプリの体験設計とフロントエンド基盤をリードする。"
  },
  {
    id: "job-004",
    title: "データサイエンティスト",
    clientId: "cl-003",
    status: "open",
    priority: "A",
    location: "福岡 / フルリモート",
    salaryMin: 800,
    salaryMax: 1150,
    positions: 2,
    owner: "高橋",
    requiredSkills: ["Python", "機械学習", "SQL", "統計"],
    niceToHave: ["医療データ", "MLOps"],
    stageGoal: "医療または金融データ経験者を優先",
    description: "医療データの解析モデルを構築し、研究チームとプロダクトチームを橋渡しする。"
  },
  {
    id: "job-005",
    title: "カスタマーサクセスマネージャー",
    clientId: "cl-002",
    status: "paused",
    priority: "C",
    location: "大阪",
    salaryMin: 600,
    salaryMax: 850,
    positions: 1,
    owner: "鈴木",
    requiredSkills: ["SaaS", "導入支援", "顧客折衝", "KPI管理"],
    niceToHave: ["Retail", "オンボーディング"],
    stageGoal: "要件再確認待ち",
    description: "大手小売企業の導入・活用を推進し、継続率とアップセルを高める。"
  }
];

export const candidates = [
  {
    id: "ca-001",
    name: "中村 蓮",
    title: "Backend Engineer",
    stage: "interview",
    status: "選考中",
    owner: "佐藤",
    source: "LinkedIn",
    location: "東京",
    desiredSalary: 1000,
    availability: "1ヶ月以内",
    lastTouch: "2026-05-10",
    skills: ["Node.js", "TypeScript", "AWS", "API設計", "SaaS"],
    desiredRoles: ["シニアバックエンドエンジニア", "Tech Lead"],
    matchedJobIds: ["job-001"],
    summary: "決済 SaaS で API 基盤と権限管理を担当。技術選定と採用面接の経験あり。",
    nextAction: "クラウドリンク一次面接の日程を確定"
  },
  {
    id: "ca-002",
    name: "伊藤 さくら",
    title: "Product Manager",
    stage: "screening",
    status: "推薦準備",
    owner: "佐藤",
    source: "紹介",
    location: "東京",
    desiredSalary: 1100,
    availability: "2ヶ月以内",
    lastTouch: "2026-05-09",
    skills: ["B2B SaaS", "ロードマップ", "顧客折衝", "SQL", "データ分析"],
    desiredRoles: ["プロダクトマネージャー"],
    matchedJobIds: ["job-002"],
    summary: "業務改善 SaaS の PM。エンタープライズ顧客からの要望整理とロードマップ策定が強み。",
    nextAction: "職務経歴書の PM 実績を追記依頼"
  },
  {
    id: "ca-003",
    name: "山田 海斗",
    title: "Frontend Lead",
    stage: "offer",
    status: "条件調整",
    owner: "鈴木",
    source: "イベント",
    location: "京都",
    desiredSalary: 950,
    availability: "即日",
    lastTouch: "2026-05-11",
    skills: ["React", "TypeScript", "UI設計", "Design System", "アクセシビリティ"],
    desiredRoles: ["フロントエンドリード", "Engineering Manager"],
    matchedJobIds: ["job-003"],
    summary: "デザインシステム立ち上げとアクセシビリティ改善を主導。リモート勤務希望。",
    nextAction: "最終条件の希望レンジを確認"
  },
  {
    id: "ca-004",
    name: "森 彩乃",
    title: "Data Scientist",
    stage: "sourcing",
    status: "接点化",
    owner: "高橋",
    source: "スカウト",
    location: "福岡",
    desiredSalary: 900,
    availability: "3ヶ月以内",
    lastTouch: "2026-05-08",
    skills: ["Python", "機械学習", "SQL", "統計", "医療データ"],
    desiredRoles: ["データサイエンティスト"],
    matchedJobIds: ["job-004"],
    summary: "大学病院との共同研究で予測モデルを構築。医療データの匿名化と解析に知見あり。",
    nextAction: "研究テーマと転職意向をヒアリング"
  },
  {
    id: "ca-005",
    name: "高木 悠真",
    title: "Customer Success",
    stage: "screening",
    status: "求人確認中",
    owner: "鈴木",
    source: "自社DB",
    location: "大阪",
    desiredSalary: 750,
    availability: "1ヶ月以内",
    lastTouch: "2026-05-06",
    skills: ["SaaS", "導入支援", "顧客折衝", "KPI管理", "オンボーディング"],
    desiredRoles: ["カスタマーサクセスマネージャー"],
    matchedJobIds: ["job-005"],
    summary: "SMB からエンタープライズまでオンボーディングを経験。求人再開待ち。",
    nextAction: "求人ステータス更新後に再提案"
  },
  {
    id: "ca-006",
    name: "小野 真央",
    title: "ML Engineer",
    stage: "placed",
    status: "決定",
    owner: "高橋",
    source: "紹介",
    location: "リモート",
    desiredSalary: 1050,
    availability: "入社済み",
    lastTouch: "2026-05-01",
    skills: ["Python", "MLOps", "AWS", "機械学習", "SQL"],
    desiredRoles: ["ML Engineer", "データサイエンティスト"],
    matchedJobIds: ["job-004"],
    summary: "推薦から 24 日で決定。入社後フォローを予定。",
    nextAction: "入社 30 日フォローを設定"
  }
];

export const activities = [
  {
    id: "ac-001",
    type: "interview",
    title: "中村 蓮 / クラウドリンク一次面接",
    owner: "佐藤",
    due: "2026-05-12 10:00",
    relatedTo: "job-001"
  },
  {
    id: "ac-002",
    type: "call",
    title: "伊藤 さくら 職務経歴書レビュー",
    owner: "佐藤",
    due: "2026-05-12 14:00",
    relatedTo: "ca-002"
  },
  {
    id: "ac-003",
    type: "offer",
    title: "山田 海斗 条件面談",
    owner: "鈴木",
    due: "2026-05-13 16:30",
    relatedTo: "ca-003"
  },
  {
    id: "ac-004",
    type: "meeting",
    title: "メディカルデータラボ 求人要件すり合わせ",
    owner: "高橋",
    due: "2026-05-14 11:00",
    relatedTo: "cl-003"
  }
];

export const tasks = [
  { id: "ta-001", title: "候補者 3 名へスカウト再送", owner: "佐藤", status: "open", due: "2026-05-11" },
  { id: "ta-002", title: "ネクストリテール求人票の公開条件を更新", owner: "鈴木", status: "open", due: "2026-05-12" },
  { id: "ta-003", title: "入社後フォローアンケート作成", owner: "高橋", status: "done", due: "2026-05-09" },
  { id: "ta-004", title: "今週の推薦進捗レポート送付", owner: "佐藤", status: "open", due: "2026-05-13" }
];
