import type { ComponentType } from "react";

type IconProps = { className?: string };

function SavingsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="7" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 7V5.5A4 4 0 0116 5.5V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 11h14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 15h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function YieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19V11M10 19V7M15 19v-5M20 19V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LearnIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L2.5 8.5 12 14l9.5-5.5L12 3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.5 11.2V16c0 1.8 2.4 3.5 5.5 3.5s5.5-1.7 5.5-3.5v-4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const ICONS = {
  savings: SavingsIcon,
  card: CardIcon,
  yield: YieldIcon,
  learn: LearnIcon,
} as const;

export function GoalFeatureIcon({
  name,
  className,
}: {
  name: keyof typeof ICONS;
  className?: string;
}) {
  const Icon = ICONS[name] as ComponentType<IconProps>;
  return <Icon className={className} />;
}
