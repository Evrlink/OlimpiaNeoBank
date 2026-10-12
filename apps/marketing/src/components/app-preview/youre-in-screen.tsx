import { useState } from "react";
import { Link } from "@tanstack/react-router";

/**
 * Account-ready artboard (390×844). Sizes here are mockup-scale so the
 * preview matches the phone design; the frame already draws the status bar.
 */

const steps = [
  {
    label: "Step 1",
    title: "Add USDC",
    body: "Send USDC to your Olimpia account from an app like Coinbase.",
    help: true,
    thread: true,
  },
  {
    label: "Step 2",
    title: "Grow with Yield, no lock ups!",
    body: "Enjoy the benefits of yield with flexibility banks can't offer. Withdraw anytime!",
    thread: true,
  },
  {
    label: "Step 3",
    title: "Set a goal",
    body: "Choose what you're growing your money toward.",
    thread: false,
  },
] as const;

const helpLines = [
  "USDC is a digital dollar designed to hold a $1 value.",
  "Buy and add USDC from an app like Coinbase.",
  "We'll guide you through the steps.",
] as const;

export function YoureInScreen() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className={`relative flex min-h-0 flex-1 flex-col ${helpOpen ? "z-20" : ""}`}>
      <div
        className="pointer-events-none absolute inset-x-0 -top-11 -bottom-3 bg-[linear-gradient(160deg,#F5DFE4_0%,#F7EBEC_38%,#F8F3F0_70%,#F8F4F1_100%)]"
        aria-hidden
      />

      <div
        className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-[22px] pt-[30px]"
        aria-hidden={helpOpen}
      >
        <p className="font-display text-[30px] font-medium leading-[30px] tracking-normal text-[#6E2A45]">
          Olimpia
        </p>

        <h1 className="mt-8 font-display text-[46px] font-medium leading-[44px] tracking-[-0.8px] text-[#2E2B2C]">
          Your account
          <br />
          is ready.
        </h1>
        <p className="mt-3 text-[17px] leading-[26px] text-[#6F6869]">Here's how to get started.</p>

        <ol className="mt-8 flex list-none flex-col gap-6 p-0">
          {steps.map((step) => (
            <li key={step.label} className="relative pl-7">
              <span
                aria-hidden
                className="absolute left-0 top-[3px] h-[9px] w-[9px] rounded-[5px] bg-[#C93A6B]"
              />
              {step.thread ? (
                <span aria-hidden className="absolute bottom-[-27px] left-1 top-4 w-px bg-[#E8C2CE]" />
              ) : null}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase leading-[14px] tracking-[1.4px] text-[#C93A6B]">
                  {step.label}
                </span>
                <span className="mt-0.5 text-[18px] font-semibold leading-6 tracking-[-0.2px] text-[#2E2B2C]">
                  {step.title}
                </span>
                <span className="text-[15px] leading-[22px] text-[#6F6869]">{step.body}</span>
                {"help" in step ? (
                  <button
                    type="button"
                    onClick={() => setHelpOpen(true)}
                    className="-mb-3 -mt-2 self-start py-3 text-[15px] font-semibold leading-5 text-[#C93A6B] hover:text-[#A8325C]"
                  >
                    How does this work?
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <div className="min-h-4 flex-1" />

        <div className="flex flex-col gap-1">
          <Link
            to="/app-preview/add-funds"
            className="flex h-[54px] items-center justify-center rounded-full bg-[#E04E7B] text-[17px] font-semibold text-white transition hover:opacity-90"
          >
            Add USDC
          </Link>
          <Link
            to="/app-preview/home"
            className="flex min-h-11 items-center justify-center text-[15px] font-semibold text-[#5C5457] transition hover:text-[#2E2B2C]"
          >
            I'll do this later
          </Link>
          <p className="text-center text-[13px] leading-[18px] text-[#776C70]">
            Yield is variable and not guaranteed.
          </p>
        </div>
      </div>

      {helpOpen ? (
        <div className="absolute inset-x-0 -bottom-3 -top-11 z-20 flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(46,43,44,0.32)]"
            aria-label="Close"
            onClick={() => setHelpOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-usdc-help-title"
            className="relative flex flex-col rounded-t-[28px] bg-white px-6 pb-12 pt-[10px] text-[#2E2B2C]"
          >
            <div className="h-[5px] w-9 self-center rounded-[3px] bg-[#DDD3D4]" aria-hidden />
            <h2
              id="add-usdc-help-title"
              className="mt-7 text-[22px] font-bold leading-7 tracking-[-0.3px] text-[#2E2B2C]"
            >
              How do I add USDC?
            </h2>
            {helpLines.map((line, index) => (
              <p
                key={line}
                className={
                  index === 0
                    ? "mt-2 text-[17px] font-normal leading-[26px] text-[#5C5457]"
                    : "mt-3 text-[17px] font-normal leading-[26px] text-[#5C5457]"
                }
              >
                {line}
              </p>
            ))}
          </section>
        </div>
      ) : null}
    </div>
  );
}
