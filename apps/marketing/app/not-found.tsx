import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
      <h1>Page not found</h1>
      <p style={{ color: "var(--olimpia-text-muted)" }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/">Back to home</Link>
    </main>
  );
}
