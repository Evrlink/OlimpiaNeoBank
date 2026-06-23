import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/content";
import { buildLearnUsdcJsonLd } from "@/lib/jsonld";

const TOPICS = [
  {
    id: "what-is-usdc",
    title: "What is USDC?",
    body: "USDC is a digital dollar stablecoin designed to stay close to $1 USD. Think of it as a digital representation of a dollar that moves on modern financial rails — without you needing to think about the technology behind it.",
  },
  {
    id: "what-is-stablecoin",
    title: "What is a stablecoin?",
    body: "A stablecoin is a digital asset pegged to a stable value — usually the US dollar — so it is less volatile than Bitcoin or other cryptocurrencies. That stability makes it useful for everyday saving and spending.",
  },
  {
    id: "why-olimpia",
    title: "Why Olimpia uses USDC",
    body: "Olimpia uses USDC as invisible infrastructure. You see dollars in the app — balances, goals, and growth — while reliable dollar-equivalent technology works quietly in the background. You never need to manage a crypto wallet or pick a blockchain network.",
  },
  {
    id: "how-yield",
    title: "How growth works (beginner)",
    body: "Optional growth puts part of your savings to work. Earnings are estimated and variable — not guaranteed. Olimpia explains everything in plain language, without DeFi jargon or protocol names.",
  },
  {
    id: "no-experience",
    title: "No crypto experience needed",
    body: "You do not need to understand wallets, private keys, gas fees, or trading. If you can use a modern banking app, you can use Olimpia. We built it for confidence — not for crypto experts.",
  },
];

export const metadata = {
  title: "Understanding USDC | Olimpia",
  description:
    "Learn what USDC and stablecoins are, why Olimpia uses them invisibly, and how savings growth works — no crypto experience required.",
  alternates: {
    canonical: `${SITE.url}/learn/usdc`,
  },
  openGraph: {
    title: "Understanding USDC | Olimpia",
    description:
      "Learn what USDC and stablecoins are, why Olimpia uses them invisibly, and how savings growth works.",
    url: `${SITE.url}/learn/usdc`,
  },
};

export default function LearnUsdcPage() {
  return (
    <>
      <JsonLd data={buildLearnUsdcJsonLd()} />
      <Navigation />
      <main className="learn-page">
        <article className="container learn-article">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true"> / </span>
            <span>Learn USDC</span>
          </nav>
          <h1>Understanding USDC — stable, simple, behind the scenes</h1>
          <p className="learn-intro">
            USDC powers part of Olimpia&apos;s infrastructure. Here&apos;s what
            that means in plain language — no crypto experience required.
          </p>
          {TOPICS.map((topic) => (
            <section key={topic.id} aria-labelledby={topic.id}>
              <h2 id={topic.id}>{topic.title}</h2>
              <p>{topic.body}</p>
            </section>
          ))}
          <p className="learn-cta">
            <Link href="/" className="btn btn-primary">
              Back to Olimpia
            </Link>
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
