import { PLATFORM_BENEFITS } from "@/lib/content";
import { BenefitIconGraphic } from "@/components/FeatureIcons";

export function PlatformBenefits() {
  return (
    <section
      id="benefits"
      className="benefits-section"
      aria-labelledby="benefits-heading"
    >
      <div className="container">
        <h2 id="benefits-heading" className="benefits-headline">
          {PLATFORM_BENEFITS.headline}
        </h2>

        <div className="benefits-grid">
          {PLATFORM_BENEFITS.items.map((item) => (
            <article key={item.title} className="benefit-card-ui">
              <div className="benefit-icon-wrap">
                <BenefitIconGraphic icon={item.icon} className="benefit-icon" />
              </div>
              <h3 className="benefit-card-title">{item.title}</h3>
              <p className="benefit-card-desc">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
