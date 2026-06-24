import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { SUPPORT_EMAIL, pageSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => {
    const seo = pageSeoHead("/privacy");
    return {
      meta: [
        { title: "Privacy Policy · Olimpia" },
        {
          name: "description",
          content:
            "How Olimpia collects, uses, and protects your information. Draft policy for the Olimpia financial app.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p className="text-body-sm text-ink-muted">Last updated: June 18, 2026</p>
      <p>
        Olimpia (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This
        policy explains what information we collect, how we use it, and the choices you have.
        Olimpia is a financial app, not a bank.
      </p>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">Information we collect</h2>
        <p>
          We may collect information you provide directly, such as your email address when you join
          our waitlist, and account information when you use the Olimpia app. We may also collect
          technical information such as device type, app version, and usage data needed to operate
          and improve the service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">How we use information</h2>
        <p>
          We use information to provide and improve Olimpia, communicate with you about the product,
          maintain security, comply with legal obligations, and support features such as savings
          goals, spending, and educational guidance from Pia.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">Service providers</h2>
        <p>
          Olimpia works with trusted infrastructure and financial partners to deliver the app. These
          providers process information only as needed to perform services on our behalf and are
          required to protect it appropriately.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">AI features</h2>
        <p>
          Pia provides educational guidance in plain language. Conversations may be processed to
          deliver and improve guidance features. We do not use Pia to provide personalized
          investment advice.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">Your choices</h2>
        <p>
          You may contact us to ask questions about your information or to request access,
          correction, or deletion where applicable law allows.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold text-foreground">Contact</h2>
        <p>
          Questions about this policy? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-raspberry underline-offset-2 hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <p className="text-body-sm">
          This is a draft policy for pre-launch. A final version will be published before the app is
          generally available.
        </p>
      </section>
    </LegalPage>
  );
}
