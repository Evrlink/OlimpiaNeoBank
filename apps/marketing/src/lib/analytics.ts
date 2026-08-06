export const GA_MEASUREMENT_ID = "G-EGSKZG2DL4";

export const AnalyticsEvents = {
  waitlistSignup: "waitlist_signup",
  heroCtaClick: "hero_cta_click",
  learnMoreClick: "learn_more_click",
  usdcPageView: "usdc_page_view",
} as const;

type AnalyticsParamValue = string | number | boolean | undefined;
type AnalyticsParams = Record<string, AnalyticsParamValue>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Fire a GA4 custom event in production only. Queues via dataLayer until gtag.js loads. */
export function trackEvent(eventName: string, params?: AnalyticsParams) {
  if (!import.meta.env.PROD || typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(..._args: unknown[]) {
      // GA4 requires the native Arguments object
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }

  window.gtag("event", eventName, params);
}
