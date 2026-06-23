import { FEATURES } from "@/lib/content";
import { FeatureIconGraphic } from "@/components/FeatureIcons";

export function Features() {
  return (
    <section id="features" className="features-section" aria-labelledby="features-heading">
      <div className="container">
        <h2 id="features-heading" className="sr-only">
          Everything you need to build financial confidence
        </h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="features-card">
              <div className="features-icon-wrap">
                <FeatureIconGraphic icon={f.icon} className="features-icon" />
              </div>
              <h3 className="features-card-title">{f.title}</h3>
              <p className="features-card-desc">{f.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
