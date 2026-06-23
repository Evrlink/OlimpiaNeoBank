import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | Olimpia",
};

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="legal-page container">
        <h1>Privacy Policy</h1>
        <p>Privacy policy placeholder — update before public launch.</p>
        <Link href="/">← Back to home</Link>
      </main>
      <Footer />
    </>
  );
}
