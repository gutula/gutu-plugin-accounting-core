/** Host-plugin contribution for accounting-core.
 *
 *  Mounts at /api/<routes> via the shell's plugin loader. */
import type { HostPlugin } from "@gutu-host/plugin-contract";

import { glLedgerRoutes } from "./routes/gl-ledger";


export const hostPlugin: HostPlugin = {
  id: "accounting-core",
  version: "1.0.0",

  routes: [
    { mountPath: "/gl", router: glLedgerRoutes }
  ],

  // Resources owned by this plugin. The host auto-registers them in
  // the UI resource catalog and adds the namespace to the dynamic
  // allow-list used by the resource-write gate.
  resources: [
    "accounting.account",
    "accounting.accounting-period",
    "accounting.bank-account",
    "accounting.bank-transaction",
    "accounting.bill",
    "accounting.budget",
    "accounting.cost-center",
    "accounting.currency-rate",
    "accounting.dunning",
    "accounting.fiscal-year",
    "accounting.invoice",
    "accounting.journal-entry",
    "accounting.payment-entry",
    "accounting.tax-rule",
  ],
};

// Re-export the lib API so other plugins can `import` from
// "@gutu-plugin/accounting-core".
export * from "./lib";
