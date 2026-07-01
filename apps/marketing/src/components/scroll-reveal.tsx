import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in milliseconds */
  delay?: number;
  /** Slightly stronger motion for main content sections */
  emphasis?: boolean;
};

function getObserverOptions(emphasis: boolean) {
  const narrow = window.matchMedia("(max-width: 767px)").matches;

  return {
    threshold: emphasis ? (narrow ? 0.1 : 0.14) : narrow ? 0.06 : 0.08,
    rootMargin: emphasis
      ? narrow
        ? "0px 0px -4% 0px"
        : "0px 0px -10% 0px"
      : narrow
        ? "0px 0px 8% 0px"
        : "0px 0px 12% 0px",
  };
}

export function ScrollReveal({ children, className, delay = 0, emphasis = false }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      hasRevealed.current = true;
      setVisible(true);
      return;
    }

    let observer: IntersectionObserver | null = null;

    const observe = () => {
      observer?.disconnect();
      if (hasRevealed.current) return;

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            hasRevealed.current = true;
            setVisible(true);
            observer?.disconnect();
          }
        },
        getObserverOptions(emphasis),
      );

      observer.observe(el);
    };

    observe();

    const mq = window.matchMedia("(max-width: 767px)");
    mq.addEventListener("change", observe);

    return () => {
      observer?.disconnect();
      mq.removeEventListener("change", observe);
    };
  }, [emphasis]);

  return (
    <div
      ref={ref}
      className={cn("scroll-reveal", emphasis && "scroll-reveal--emphasis", visible && "is-visible", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** Standard scroll reveal for homepage sections below the hero (emphasis + responsive observer). */
export function SectionScrollReveal({
  children,
  className,
  delay = 0,
}: Omit<ScrollRevealProps, "emphasis">) {
  return (
    <ScrollReveal emphasis className={className} delay={delay}>
      {children}
    </ScrollReveal>
  );
}
