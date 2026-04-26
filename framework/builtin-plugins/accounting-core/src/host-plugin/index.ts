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
};

// Re-export the lib API so other plugins can `import` from
// "@gutu-plugin/accounting-core".
export * from "./lib";
