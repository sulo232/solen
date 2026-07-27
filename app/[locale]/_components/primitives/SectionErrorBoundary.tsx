"use client";

// exists-check: net-new vs app/error.tsx, app/[locale]/{spa,nails,inspo,search,
// profile,coiffeur,barbershop,dashboard}/error.tsx, salon/[slug]/error.tsx.
// Those are Next.js ROUTE-SEGMENT boundaries (error.tsx), which only catch a
// crash at the segment level and blank the WHOLE route; none of them isolate
// one sibling client component's render exception from its neighbors on the
// same page. This is a reusable in-tree component-level boundary meant to
// wrap individual sections INSIDE a route (fe-02) -- genuinely a different
// layer, not a duplicate of the route-level files above.

import * as React from "react";
import { useTranslations } from "next-intl";
import ErrorState from "@/components-legacy/ui/ErrorState";

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional section name, tagged onto the console.error for triage (e.g. "SalonReviews"). */
  section?: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

/**
 * SectionErrorBoundary (fe-02): catches a render-time exception thrown by ANY
 * descendant client component and shows a scoped <ErrorState onRetry> for
 * just that section, instead of the exception propagating up and
 * white-screening the whole route.
 *
 * Next.js's own error.tsx only catches errors at the ROUTE-SEGMENT level; it
 * does NOT isolate one sibling component's crash from its neighbors on the
 * same page. Without this, a malformed review, a null salon photo array, or
 * an unexpected API shape inside ANY ONE of a page's sibling sections (e.g.
 * the salon PDP's ~15 sections: SalonReviews, SalonTeam, SalonServices...)
 * can take down every other section on the page along with it.
 *
 * Wrap any client component whose render depends on data it fetched itself.
 * Start with the highest-risk sibling sections (PDP sections, booking wizard
 * steps, dashboard panels) and expand from there.
 */
export class SectionErrorBoundary extends React.Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[SectionErrorBoundary${this.props.section ? `:${this.props.section}` : ""}] render crashed:`,
      error,
      info.componentStack
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <SectionErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

function SectionErrorFallback({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("ui.error");
  return (
    <ErrorState
      title={t("title")}
      message={t("defaultMessage")}
      onRetry={onRetry}
      retryLabel={t("retry")}
    />
  );
}

export default SectionErrorBoundary;
