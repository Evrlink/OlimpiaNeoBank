export const SITE = {
  name: "Olimpia",
  title: "Olimpia | Financial freedom, designed for women",
  description:
    "Olimpia helps women save, spend, grow money, and earn yield with USDC through a simple financial app built for confidence, education, and freedom.",
  url: "https://olimpia.app",
  supportEmail: "hello@olimpia.app",
  tagline: "More choices. More freedom.",
} as const;

export const GOAL_CARDS = [
  {
    emoji: "✈️",
    name: "Girls Trip Fund",
    target: "$2,500",
    progress: 72,
    earnings: "+$18 earned this month",
  },
  {
    emoji: "💼",
    name: "Business Launch Fund",
    target: "$10,000",
    progress: 41,
    earnings: "+$63 earned this month",
  },
  {
    emoji: "🏡",
    name: "First Home Fund",
    target: "$25,000",
    progress: 29,
    earnings: "+$112 earned this month",
  },
  {
    emoji: "💜",
    name: "Financial Freedom Fund",
    target: "$50,000",
    progress: 18,
    earnings: "+$247 earned this month",
  },
] as const;

export const GOAL_FEATURE_CARDS = [
  {
    icon: "savings" as const,
    title: "Savings Goals",
    description: "Break big dreams into small wins.",
    href: "/#spend",
  },
  {
    icon: "card" as const,
    title: "Olimpia Card",
    description: "Spend confidently everyday.",
    href: "/#spend",
  },
  {
    icon: "yield" as const,
    title: "Earn Yield",
    description: "Grow your money with USDC yield.",
    href: "/#grow",
  },
  {
    icon: "learn" as const,
    title: "Learn & Grow",
    description: "Build confidence with bite-sized financial lessons.",
    href: "/#pia",
  },
] as const;

export const SPLIT_FEATURES = {
  spend: {
    headline: "Your money, ready when you are",
    body: "Your balance stays steady at dollar value, backed by USDC — so every swipe feels familiar. Use your virtual debit card for coffee runs, grocery hauls, and the everyday purchases that keep life moving. No wallets, no waiting for weekends to pass, and no crypto-speak — just your money, working when you need it.",
  },
  ownership: {
    headline: "Your money, your choices",
    body: "Your balance, your goals, and your progress — all in one place you control. See every deposit, transfer, and dollar earned with full transparency, so you're never left guessing where your money stands. Olimpia puts you in charge of your financial life — not a bank ledger you can't see inside.",
  },
  grow: {
    headline: "Grow your savings on your terms",
    body: "Put part of your USDC savings to work and watch your money make progress over time. Estimated returns are shown in plain language — no lock-ups, no fine print, and you can withdraw anytime. You stay in control while your savings quietly work for you.",
  },
} as const;

export const MISSION = {
  eyebrow: "OUR MISSION",
  headline: "Money tools built for your life — not someone else's rules.",
  body: "Traditional finance wasn't designed with women's lives in mind — too often it feels confusing, exclusive, or like someone else holds the keys. Olimpia exists to change that. We bring clarity to your money, help you reach real goals, and support steady growth at your own pace — without intimidation or jargon. Financial confidence should feel within reach, not reserved for insiders.",
} as const;

export type BenefitIcon = "goals" | "simple" | "grow" | "pia";

export const PLATFORM_BENEFITS = {
  headline: "Simpler than traditional banking. Built for the life you're actually living.",
  items: [
    {
      title: "Built around your goals",
      description:
        "Name savings after what matters — a girls trip, a business launch, or peace of mind. Every dollar maps to something real in your life, not a generic account number. Progress stays visible so you always know where you stand.",
      icon: "goals" as const,
    },
    {
      title: "Powerful tools, simple experience",
      description:
        "Olimpia runs on modern financial infrastructure, but you'd never know it from the app. Clean screens, plain language, and flows that feel familiar — like banking should have been all along. We handle the complexity behind the scenes.",
      icon: "simple" as const,
    },
    {
      title: "Grow without the guesswork",
      description:
        "Optional growth lets part of your savings work quietly over time. Earnings are estimated and explained upfront — no lock-ups, no surprises, and you're free to move money when you need it. You stay in control; we keep it clear.",
      icon: "grow" as const,
    },
    {
      title: "Guidance when you want it",
      description:
        "Meet Pia, your in-app money guide. Ask questions anytime and get answers in language you actually use. Learn at your own pace and make decisions with confidence — not pressure.",
      icon: "pia" as const,
    },
  ],
} as const;

export type FeatureIcon = "save" | "grow" | "spend" | "learn";

export const FEATURES: ReadonlyArray<{
  title: string;
  description: string;
  icon: FeatureIcon;
}> = [
  {
    title: "Save toward goals",
    description:
      "Create savings goals that match your life — a girls trip, emergency fund, or dream business. Watch your progress grow with clear tracking and gentle milestones that celebrate every step forward.",
    icon: "save",
  },
  {
    title: "Earn on your balance",
    description:
      "Put part of your savings to work and watch your money grow over time. Earnings are estimated and variable — no lock-ups, no jargon, and always explained in plain language.",
    icon: "grow",
  },
  {
    title: "Spend with confidence",
    description:
      "Use your virtual debit card for everyday purchases — coffee, groceries, and everything in between. Your balance stays in dollars, so spending feels familiar and stress-free.",
    icon: "spend",
  },
  {
    title: "Learn with Pia",
    description:
      "Meet Pia, your in-app money guide who answers questions in plain language. Build financial confidence at your own pace with supportive guidance — never judgment, never jargon.",
    icon: "learn",
  },
];

export const HOW_IT_WORKS = [
  { step: 1, title: "Add money", description: "Fund from bank or card" },
  {
    step: 2,
    title: "Receive USDC",
    description: "Dollars arrive in your account — conversion is invisible",
  },
  {
    step: 3,
    title: "Grow your money",
    description: "Optional growth on savings — estimated, variable",
  },
  {
    step: 4,
    title: "Spend anytime",
    description: "Card, send, and everyday use",
  },
] as const;

export const PROVIDERS = [
  "Privy",
  "Base",
  "Bridge",
  "Gnosis Pay",
  "LI.FI",
  "Morpho",
] as const;

export type FAQItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is Olimpia?",
    answer:
      "Olimpia is a financial app designed for women to save, spend, and grow money with confidence. Crypto works invisibly in the background — you see dollars, not jargon. Olimpia is not a licensed bank.",
  },
  {
    question: "Who is Olimpia for?",
    answer:
      "Olimpia is built for women who want financial independence, more confidence with money, and a supportive experience instead of intimidating jargon. Anyone who resonates with the mission is welcome.",
  },
  {
    question: "What is USDC?",
    answer:
      'USDC is a digital dollar stablecoin designed to stay close to $1 USD. Olimpia uses it behind the scenes so your balance feels like everyday dollars. <a href="/learn/usdc">Learn more about USDC</a>.',
  },
  {
    question: "What is a stablecoin?",
    answer:
      'A stablecoin is a digital asset pegged to a stable value — usually the US dollar — so it is less volatile than Bitcoin or other crypto. <a href="/learn/usdc">Read our beginner guide</a>.',
  },
  {
    question: "Do I need crypto experience?",
    answer:
      "No. Olimpia is designed so you never need to understand wallets, keys, or trading. You add money, set goals, and spend — we handle the rest.",
  },
  {
    question: "How does yield work?",
    answer:
      "Optional growth puts part of your savings to work. Earnings are estimated and variable — not guaranteed. We explain everything in plain language, with no DeFi jargon.",
  },
  {
    question: "Can I withdraw my money?",
    answer:
      "Yes. You can withdraw available balance to your linked bank account. Money in savings goals or growth may need to be moved back to available balance first.",
  },
  {
    question: "Is Olimpia a bank?",
    answer:
      "No. Olimpia is a consumer finance app that wraps trusted financial and stablecoin infrastructure into a simple experience. It is not a licensed bank or FDIC-insured institution.",
  },
];

export const FOOTER = {
  operatorLine: "Olimpia is a consumer finance app — not a licensed bank.",
  disclaimer:
    "Olimpia is a software interface that helps you save, spend, and optionally grow money using stablecoin infrastructure from trusted third-party providers. Olimpia is not a bank, broker, investment adviser, or tax advisor. Balances are not FDIC-insured. Optional growth features may use lending or yield protocols; returns are estimated, variable, and not guaranteed. You may lose value. Third-party services (including wallet, payments, and bridge providers) have their own terms and risks. Nothing on this site is financial, legal, or tax advice.",
  footnote:
    "¹ Growth and yield features involve market and protocol risks. Olimpia does not guarantee returns and does not hold customer funds as a bank would. Read provider terms and only allocate what you can afford to put at risk.",
} as const;
