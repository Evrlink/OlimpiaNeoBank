/** Set `VITE_SITE_URL` in production for absolute canonical URLs in JSON-LD. */
import sitemapRoutes from "../../seo.routes.json";

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

/** Set `VITE_SUPPORT_EMAIL` in production. Used for footer contact and legal pages. */
export const SUPPORT_EMAIL =
  (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? "hello@olimpia.app";

export const SITEMAP_ROUTES = sitemapRoutes as Array<{
  path: string;
  priority: string;
  changefreq: string;
}>;

export const OLIMPIA_DEFINITION =
  "Olimpia is a financial app for women to save, spend, and grow money in dollars, with savings goals, optional yield on USDC, and Pia, your AI guide. It is not a bank. No crypto experience required.";

export const FAQ_ITEMS = [
  { q: "What is Olimpia?", a: OLIMPIA_DEFINITION },
  {
    q: "How is Olimpia different from a traditional bank?",
    a: "Traditional banks primarily help you store and move money. Olimpia helps you save, spend, earn yield on USDC, create savings goals, and learn about modern financial tools through Pia, your AI money guide.",
  },
  {
    q: "What is USDC?",
    a: "USDC is a digital dollar, also known as a stablecoin. One USDC is designed to maintain a value equal to one U.S. dollar, making it easier to save, spend, send money, and earn yield without the price swings associated with many cryptocurrencies.",
  },
  {
    q: "What is a stablecoin?",
    a: "A stablecoin is a digital currency designed to maintain a stable value by being linked to a real-world currency such as the U.S. dollar. Stablecoins like USDC make it possible to move money quickly online while maintaining a familiar dollar value.",
  },
  {
    q: "Do I need to know anything about crypto?",
    a: "No. Olimpia is designed to be simple and beginner-friendly. You can save, spend, earn yield, and learn about modern money tools without needing prior crypto experience.",
  },
  {
    q: "Who is Pia?",
    a: "Pia is your AI money guide. She helps explain investing, USDC, savings goals, yield, and modern financial tools in simple language so you can make informed decisions with confidence.",
  },
  {
    q: "Who controls my money?",
    a: "You do. Olimpia helps you access modern financial tools, but your money remains yours. Our goal is to give you more control, more transparency, and more choices when it comes to managing your finances.",
  },
  {
    q: "Can I withdraw at any time?",
    a: "Yes. Your money remains accessible and can be transferred back to your bank account whenever you need it. We believe financial tools should help you grow your money without locking it away.",
  },
  {
    q: "Is my money safe?",
    a: "Olimpia uses trusted infrastructure providers, modern security practices, and established financial partners to help protect your account and transactions.",
  },
  {
    q: "Do I need to verify my identity?",
    a: "In some cases, yes. Identity verification may be required when connecting traditional banking services or moving money between your bank account and digital dollars. This helps our partners meet financial regulations and keep the platform secure.",
  },
  {
    q: "What are the risks?",
    a: "If someone gains access to your email account, they could gain access to your wallet. We recommend enabling two-factor authentication. Decentralized protocols carry smart contract risk, the possibility of a bug or exploit.",
  },
  {
    q: "Is Olimpia safe if I'm not an expert?",
    a: "Yes. Olimpia is designed to make DeFI simple without taking control away from you. Sign up with your email, we'll handle the technical details behind the scenes, while you stay in control of your money. For added protection, we recommend enabling two-factor authentication.",
  },
  {
    q: "What happens if Olimpia shuts down?",
    a: "Your money remains yours. Olimpia is designed around giving users ownership and access to their financial tools. Our goal is to help you maintain control over your finances, independent of any single company.",
  },
  {
    q: "Why was Olimpia created?",
    a: "Olimpia was created to help women build financial confidence through education and access to decentralized finance (DeFi).",
  },
] as const;

export function absoluteUrl(path = "/") {
  if (!SITE_URL) return path;
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

export function pageSeoHead(path: string) {
  if (!SITE_URL) {
    return { meta: [] as const, links: [] as const };
  }

  const url = absoluteUrl(path);
  return {
    meta: [{ property: "og:url", content: url }] as const,
    links: [{ rel: "canonical", href: url }] as const,
  };
}

export function getHomepageStructuredData() {
  const siteUrl = absoluteUrl("/");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}#organization`,
        name: "Olimpia",
        url: siteUrl,
        description:
          "Financial freedom designed for women. Olimpia helps women save, spend, and grow money in dollars with confidence.",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        name: "Olimpia",
        url: siteUrl,
        description: OLIMPIA_DEFINITION,
        publisher: { "@id": `${siteUrl}#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}#application`,
        name: "Olimpia",
        applicationCategory: "FinanceApplication",
        operatingSystem: "iOS, Android",
        description: OLIMPIA_DEFINITION,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        publisher: { "@id": `${siteUrl}#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}#faq`,
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };
}
