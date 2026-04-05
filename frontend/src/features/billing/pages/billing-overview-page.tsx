import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";

export function BillingOverviewPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Billing"
        title="Panoramica billing"
        description="Modulo predisposto per subscription, invoice e metering quando entreranno nel perimetro del prodotto."
      />
      <Panel eyebrow="Scaffold" title="Funzionalita non ancora attiva">
        <p className="text-sm text-muted-foreground">
          La sezione e stata riallineata al layout condiviso, ma il dominio billing resta fuori scope per questo MVP.
        </p>
      </Panel>
    </div>
  );
}
