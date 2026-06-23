import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Terms of Service | Olimpia",
};

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main className="legal-page container">
        <h1>Terms of Service</h1>
        <p>Terms of service placeholder — update before public launch.</p>
        <Link href="/">← Back to home</Link>
      </main>
      <Footer />
    </>
  );
}
