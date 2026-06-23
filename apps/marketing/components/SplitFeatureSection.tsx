import { PhoneMockup } from "@/components/PhoneMockup";

type SplitFeatureVariant = "spend" | "transactions" | "grow";
type SplitFeatureLayout = "image-left" | "image-right";
type SplitFeatureStageTone = "gray" | "plum";

type SplitFeatureSectionProps = {
  headline: string;
  body: string;
  variant?: SplitFeatureVariant;
  layout?: SplitFeatureLayout;
  stageTone?: SplitFeatureStageTone;
  id?: string;
};

export function SplitFeatureSection({
  headline,
  body,
  variant = "spend",
  layout = "image-left",
  stageTone = "gray",
  id = "spend",
}: SplitFeatureSectionProps) {
  const stage = (
    <div className={`split-feature-stage split-feature-stage--${stageTone}`}>
      <PhoneMockup variant={variant} />
    </div>
  );

  const copy = (
    <div className="split-feature-copy">
      <h2 id={`${id}-heading`} className="split-feature-headline">
        {headline}
      </h2>
      <p className="split-feature-body">{body}</p>
    </div>
  );

  return (
    <section
      id={id}
      className={`split-feature-section${
        layout === "image-right" ? " split-feature-section--reverse" : ""
      }`}
      aria-labelledby={`${id}-heading`}
    >
      <div className="container">
        <div className="split-feature-grid" data-layout={layout}>
          {layout === "image-left" ? (
            <>
              {stage}
              {copy}
            </>
          ) : (
            <>
              {copy}
              {stage}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
