import { HOW_IT_WORKS } from "@/lib/content";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section" aria-labelledby="how-heading">
      <div className="container">
        <h2 id="how-heading" className="section-title">
          How it works
        </h2>
        <ol className="steps">
          {HOW_IT_WORKS.map((step) => (
            <li key={step.step} className="step card">
              <span className="step-num" aria-hidden="true">
                {step.step}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
