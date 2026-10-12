import { Link } from "@tanstack/react-router";

/**
 * Welcome artboard (390×844). Sizes here are mockup-scale so the preview
 * matches the phone design; the frame already draws the status bar.
 */

function YieldIcon() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 3.5l1.6 4.4 4.4 1.6-4.4 1.6L10 15.5l-1.6-4.4L4 9.5l4.4-1.6z"
        stroke="#E04E7B"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"
        stroke="#E04E7B"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 3v3M16.5 4.5h3"
        stroke="#E04E7B"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LearnIcon() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M2.5 5h6a3.5 3.5 0 0 1 3.5 3.5V20a2.5 2.5 0 0 0-2.5-2.5h-7z"
        stroke="#E04E7B"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.5 5h-6A3.5 3.5 0 0 0 12 8.5V20a2.5 2.5 0 0 1 2.5-2.5h7z"
        stroke="#E04E7B"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const features = [
  { key: "yield", Icon: YieldIcon, label: "Earn yield on USDC" },
  { key: "learn", Icon: LearnIcon, label: "Learn DeFi on your terms" },
] as const;

export function WelcomeScreen() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className="pointer-events-none absolute inset-x-0 -top-11 -bottom-3 bg-[linear-gradient(160deg,#F5DFE4_0%,#F7EBEC_38%,#F8F3F0_70%,#F8F4F1_100%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-[52px] pt-[30px]">
        <p className="font-display text-[30px] font-medium leading-[30px] tracking-normal text-[#6E2A45]">
          Olimpia
        </p>

        <p className="mt-14 text-[11px] font-semibold uppercase leading-[14px] tracking-[1.4px] text-[#E04E7B]">
          Financial freedom, designed for women
        </p>

        <h1 className="mt-5 whitespace-nowrap text-[25px] font-bold leading-8 tracking-[-0.4px] text-[#2E2B2C]">
          Better than a checking
          <br />
          account,{" "}
          <span className="font-display text-[28px] font-normal italic leading-8 tracking-normal">
            everything your bank
            <br />
            can&apos;t do.
          </span>
        </h1>

        <ul className="mt-11 flex flex-col gap-5">
          {features.map(({ key, Icon, label }) => (
            <li key={key} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBE1E8]">
                <Icon />
              </span>
              <span className="text-[16px] font-medium leading-[22px] text-[#2E2B2C]">{label}</span>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-[15px] font-semibold leading-5 text-[#7A2E4A]">
          More choices. More freedom.
        </p>
        <p className="mt-3 text-[17px] font-normal leading-7 text-[#85797D]">
          Save, spend, and grow your money with confidence.
        </p>

        <div className="min-h-6 flex-1" />

        <div className="flex flex-col gap-2">
          <Link
            to="/app-preview/auth"
            className="flex h-[54px] items-center justify-center rounded-full bg-[#E04E7B] text-[17px] font-semibold text-white transition hover:opacity-90"
          >
            Get started
          </Link>
          <p className="flex min-h-11 items-center justify-center gap-[5px] text-[15px] leading-5 text-[#6F6869]">
            Already have an account?
            <Link
              to="/app-preview/auth"
              search={{ mode: "signin" }}
              className="font-semibold text-[#C93A6B] no-underline hover:text-[#A8325C]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
