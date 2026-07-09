import { notFound } from "next/navigation";
import FlowBar from "./_components/FlowBar";

interface DevFlowsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * /dev/flows layout: dev-only chrome for the flow harness (see page.tsx for the
 * exists-check + owner ask). Renders the fixed FlowBar ("All flows" + "Restart")
 * ONLY under /dev/flows/*, same prod-guard as /dev/mockups/page.tsx.
 *
 * This file wraps ONLY its own subtree. It is never imported into the real
 * global layout (app/[locale]/layout.tsx) and never touches real product
 * chrome, the real booking wizard the hub links to renders completely
 * outside this tree.
 */
export default async function DevFlowsLayout({ children, params }: DevFlowsLayoutProps) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;

  return (
    <>
      {children}
      <FlowBar locale={locale} />
    </>
  );
}
