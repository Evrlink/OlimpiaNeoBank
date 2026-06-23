import Link from "next/link";
import { GOAL_FEATURE_CARDS } from "@/lib/content";
import { GoalFeatureIcon } from "./GoalFeatureIcons";

export function RealLifeGoals() {
  return (
    <section
      id="real-life"
      className="goals-v1-section"
      aria-labelledby="real-life-heading"
    >
      <div className="container goals-v1-inner">
        <header className="goals-v1-header">
          <h2 id="real-life-heading" className="goals-v1-title">
            Build around real-life money goals
          </h2>
          <p className="goals-v1-lead">
            Simple tools to help you save, spend, and grow — your way.
          </p>
        </header>

        <div className="goals-v1-grid">
          {GOAL_FEATURE_CARDS.map((card) => (
            <article key={card.title} className="goals-v1-card">
              <div className="goals-v1-icon-wrap">
                <GoalFeatureIcon name={card.icon} className="goals-v1-icon" />
              </div>
              <h3 className="goals-v1-card-title">{card.title}</h3>
              <p className="goals-v1-card-desc">{card.description}</p>
              <Link href={card.href} className="goals-v1-link">
                Learn more →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
