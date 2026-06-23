import type { ComponentType } from "react";
import type { BenefitIcon, FeatureIcon } from "@/lib/content";

type IconProps = {
  className?: string;
};

function SaveIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="8" y="18" width="64" height="44" rx="10" fill="#DEDEDF" />
      <rect x="16" y="28" width="48" height="8" rx="4" fill="#1B1B1D" opacity="0.15" />
      <rect x="16" y="28" width="32" height="8" rx="4" fill="#1B1B1D" />
      <circle cx="56" cy="52" r="14" fill="#E83D6E" opacity="0.2" />
      <circle cx="56" cy="52" r="10" fill="#1B1B1D" />
      <path
        d="M52 52l3 3 6-6"
        stroke="#FBF6F3"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="16" y="44" width="28" height="6" rx="3" fill="#1B1B1D" opacity="0.12" />
    </svg>
  );
}

function GrowIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="8" y="52" width="64" height="16" rx="6" fill="#DEDEDF" />
      <path
        d="M16 52V36c0-4 3-7 7-7h10"
        stroke="#1B1B1D"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M64 52V28c0-4-3-7-7-7H44"
        stroke="#E83D6E"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M28 52V44c0-4 3-7 7-7h10"
        stroke="#5B8A72"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="23" cy="29" r="8" fill="#1B1B1D" opacity="0.2" />
      <circle cx="23" cy="29" r="5" fill="#1B1B1D" />
      <circle cx="57" cy="21" r="8" fill="#E83D6E" opacity="0.2" />
      <circle cx="57" cy="21" r="5" fill="#E83D6E" />
      <circle cx="45" cy="37" r="8" fill="#5B8A72" opacity="0.2" />
      <circle cx="45" cy="37" r="5" fill="#5B8A72" />
      <path
        d="M14 24l6-4 4 6 8-10 10 14"
        stroke="#E83D6E"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpendIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="10" y="22" width="60" height="38" rx="8" fill="#1B1B1D" />
      <rect x="10" y="30" width="60" height="10" fill="#E83D6E" />
      <rect x="18" y="46" width="22" height="4" rx="2" fill="#FBF6F3" opacity="0.5" />
      <rect x="18" y="54" width="14" height="4" rx="2" fill="#FBF6F3" opacity="0.35" />
      <circle cx="58" cy="50" r="10" fill="#E83D6E" />
      <circle cx="58" cy="50" r="6" fill="#FBF6F3" opacity="0.3" />
      <rect x="14" y="14" width="52" height="8" rx="4" fill="#DEDEDF" />
    </svg>
  );
}

function LearnIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="12" y="20" width="40" height="32" rx="10" fill="#DEDEDF" />
      <path
        d="M20 32h24M20 40h18M20 48h14"
        stroke="#1B1B1D"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
      <rect x="48" y="28" width="24" height="28" rx="10" fill="#1B1B1D" />
      <circle cx="60" cy="38" r="3" fill="#FBF6F3" />
      <rect x="54" y="46" width="12" height="3" rx="1.5" fill="#FBF6F3" opacity="0.6" />
      <rect x="54" y="52" width="8" height="3" rx="1.5" fill="#FBF6F3" opacity="0.4" />
      <path
        d="M28 14l4 6 8-2"
        stroke="#E83D6E"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28" cy="14" r="4" fill="#E83D6E" opacity="0.25" />
    </svg>
  );
}

const ICONS: Record<FeatureIcon, ComponentType<IconProps>> = {
  save: SaveIcon,
  grow: GrowIcon,
  spend: SpendIcon,
  learn: LearnIcon,
};

function GoalsBenefitIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="10" y="14" width="60" height="52" rx="14" fill="#DEDEDF" />
      <circle cx="40" cy="36" r="16" stroke="#1B1B1D" strokeWidth="3" />
      <circle cx="40" cy="36" r="9" stroke="#C4A265" strokeWidth="2.5" opacity="0.85" />
      <circle cx="40" cy="36" r="3" fill="#1B1B1D" />
      <path
        d="M40 20v4M40 48v4M24 36h4M52 36h4"
        stroke="#1B1B1D"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
      <rect x="18" y="56" width="44" height="6" rx="3" fill="#1B1B1D" opacity="0.15" />
      <rect x="18" y="56" width="28" height="6" rx="3" fill="#E83D6E" />
    </svg>
  );
}

function SimpleBenefitIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="22" y="10" width="36" height="60" rx="10" fill="#1B1B1D" />
      <rect x="26" y="18" width="28" height="44" rx="6" fill="#FBF6F3" />
      <rect x="30" y="26" width="20" height="4" rx="2" fill="#DEDEDF" />
      <rect x="30" y="34" width="16" height="4" rx="2" fill="#DEDEDF" />
      <rect x="30" y="42" width="18" height="4" rx="2" fill="#C4A265" opacity="0.5" />
      <circle cx="40" cy="52" r="5" fill="#C4A265" />
      <path
        d="M58 24l6-4 2 8 8-12"
        stroke="#C4A265"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="58" cy="24" r="5" fill="#C4A265" opacity="0.25" />
    </svg>
  );
}

function GrowBenefitIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="8" y="54" width="64" height="14" rx="6" fill="#DEDEDF" />
      <path
        d="M18 54V38c0-3 2.5-5.5 5.5-5.5H30"
        stroke="#1B1B1D"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M62 54V30c0-3-2.5-5.5-5.5-5.5H48"
        stroke="#C4A265"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M40 54V44c0-3 2.5-5.5 5.5-5.5H48"
        stroke="#E83D6E"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M14 28l8-6 6 8 10-14 14 18"
        stroke="#E83D6E"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="22" r="6" fill="#1B1B1D" opacity="0.2" />
      <circle cx="22" cy="22" r="3.5" fill="#1B1B1D" />
    </svg>
  );
}

function PiaBenefitIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="8" y="22" width="38" height="28" rx="12" fill="#DEDEDF" />
      <path
        d="M16 34h22M16 42h16"
        stroke="#1B1B1D"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <rect x="34" y="30" width="38" height="32" rx="12" fill="#1B1B1D" />
      <circle cx="53" cy="42" r="4" fill="#C4A265" />
      <rect x="44" y="50" width="18" height="3" rx="1.5" fill="#FBF6F3" opacity="0.55" />
      <rect x="44" y="56" width="12" height="3" rx="1.5" fill="#FBF6F3" opacity="0.35" />
      <path
        d="M24 18c0-4 3-7 7-7"
        stroke="#E83D6E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="31" cy="11" r="5" fill="#E83D6E" opacity="0.25" />
      <circle cx="31" cy="11" r="3" fill="#E83D6E" />
    </svg>
  );
}

const BENEFIT_ICONS: Record<BenefitIcon, ComponentType<IconProps>> = {
  goals: GoalsBenefitIcon,
  simple: SimpleBenefitIcon,
  grow: GrowBenefitIcon,
  pia: PiaBenefitIcon,
};

export function FeatureIconGraphic({ icon, className }: { icon: FeatureIcon; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} />;
}

export function BenefitIconGraphic({ icon, className }: { icon: BenefitIcon; className?: string }) {
  const Icon = BENEFIT_ICONS[icon];
  return <Icon className={className} />;
}
