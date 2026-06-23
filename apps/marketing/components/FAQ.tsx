import { FAQ_ITEMS } from "@/lib/content";

function FaqChevron() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="faq-section" aria-labelledby="faq-heading">
      <div className="container faq-container">
        <h2 id="faq-heading" className="faq-title">
          FAQ
        </h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="faq-item">
              <summary>
                <span className="faq-question">{item.question}</span>
                <span className="faq-chevron" aria-hidden="true">
                  <FaqChevron />
                </span>
              </summary>
              <div
                className="faq-answer"
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
