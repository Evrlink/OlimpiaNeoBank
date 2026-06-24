import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { SUPPORT_EMAIL, pageSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => {
    const seo = pageSeoHead("/terms");
    return {
      meta: [
        { title: "Terms of Service · Olimpia" },
        {
          name: "description",
          content:
            "Terms for using the Olimpia financial app. Olimpia is not a bank. Draft terms for pre-launch.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p className="text-body-sm text-ink-muted">Last updated: June 18, 2026</p>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of the Olimpia website, waitlist,
        and mobile app (collectively, the &quot;Service&quot;). By using Olimpia, you agree to these
        Terms.
      </p>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">Olimpia is not a bank</h2>
        <p>
          Olimpia is a financial technology app that helps you save, spend, and grow money in
          dollars. Olimpia is not a bank and does not itself hold deposits or provide banking
          services. Banking, payment, card, and digital asset services may be provided by third-party
          partners subject to their own terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">Eligibility</h2>
        <p>
          You must be legally able to enter into these Terms and use financial services in your
          jurisdiction. You are responsible for providing accurate information and keeping your
          account secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">No financial advice</h2>
        <p>
          Olimpia and Pia provide education and product information in plain language. They do not
          provide investment, tax, or legal advice. You are responsible for your financial decisions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">Risks</h2>
        <p>
          Financial products involve risk. Optional yield on savings is variable and not guaranteed.
          Digital dollar products may be subject to partner, market, regulatory, or operational risks.
          We explain how features work, but we cannot eliminate risk.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">Acceptable use</h2>
        <p>
          You agree not to misuse the Service, attempt unauthorized access, or use Olimpia for unlawful
          activity. We may suspend or terminate access if these Terms are violated or if required for
          security or compliance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">Changes</h2>
        <p>
          We may update these Terms from time to time. Material changes will be posted on this page
          with an updated date. Continued use of the Service after changes means you accept the
          revised Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">Contact</h2>
        <p>
          Questions about these Terms? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-raspberry underline-offset-2 hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <p className="text-body-sm">
          This is a draft for pre-launch. Final terms will be published before the app is generally
          available.
        </p>
      </section>
    </LegalPage>
  );
}
