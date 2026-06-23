import { MISSION } from "@/lib/content";

type TileIconProps = {
  className?: string;
};

function SavingsGoalIcon({ className }: TileIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <path
        d="M16 10v6l4 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CardIcon({ className }: TileIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="4" y="9" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M4 14h24" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 20h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

function GrowthChartIcon({ className }: TileIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 24V14M13 24V10M20 24V16M27 24V8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M5 24h22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

function ConfidenceIcon({ className }: TileIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16 26s-9-5.5-9-12a5 5 0 019-2.5A5 5 0 0125 14c0 6.5-9 12-9 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 15l2.5 2.5L20 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MISSION_TILES = [
  { icon: SavingsGoalIcon, tone: "plum" as const, position: 1 },
  { icon: CardIcon, tone: "gold" as const, position: 2 },
  { icon: GrowthChartIcon, tone: "green" as const, position: 3 },
  { icon: ConfidenceIcon, tone: "cream" as const, position: 4 },
] as const;

export function MissionSection() {
  return (
    <section
      id="mission"
      className="mission-section"
      aria-labelledby="mission-heading"
    >
      <div className="container">
        <div className="mission-grid">
          <div className="mission-copy">
            <p className="mission-eyebrow">{MISSION.eyebrow}</p>
            <h2 id="mission-heading" className="mission-headline">
              {MISSION.headline}
            </h2>
            <p className="mission-body">{MISSION.body}</p>
          </div>

          <div className="mission-visual" aria-hidden="true">
            <div className="mission-visual-lines" />
            {MISSION_TILES.map(({ icon: Icon, tone, position }) => (
              <div
                key={tone}
                className={`mission-icon-tile mission-icon-tile--${tone} mission-icon-tile--pos-${position}`}
              >
                <Icon className="mission-icon-tile__svg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
