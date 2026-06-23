import { PROVIDERS } from "@/lib/content";

const MARQUEE_PROVIDERS = [...PROVIDERS, ...PROVIDERS];

export function TrustedInfrastructure() {
  return (
    <section
      id="infrastructure"
      className="infra-section"
      aria-labelledby="infrastructure-heading"
    >
      <div className="container infra-inner">
        <h2 id="infrastructure-heading" className="infra-title">
          Built on trusted infrastructure
        </h2>
        <p className="infra-lead">
          Powered by industry-leading providers in security, compliance, and payments.
        </p>

        <div className="provider-marquee" aria-hidden="true">
          <ul className="provider-marquee-track">
            {MARQUEE_PROVIDERS.map((name, index) => (
              <li key={`${name}-${index}`}>
                <span className="provider-logo">{name}</span>
              </li>
            ))}
          </ul>
        </div>

        <ul className="sr-only">
          {PROVIDERS.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
