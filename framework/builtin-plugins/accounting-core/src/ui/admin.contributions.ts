import {
  defineAdminNav,
  defineCommand,
  definePage,
  defineWorkspace,
  type AdminContributionRegistry
} from "@platform/admin-contracts";

import { BusinessAdminPage } from "./admin/main.page";

export const adminContributions: Pick<AdminContributionRegistry, "workspaces" | "nav" | "pages" | "commands"> = {
  workspaces: [
    defineWorkspace({
      id: "accounting",
      label: "Accounting",
      icon: "scale",
      description: "Ledger truth, billing, and financial close operations.",
      permission: "accounting.billing.read",
      homePath: "/admin/business/accounting",
      quickActions: ["accounting-core.open.control-room"]
    })
  ],
  nav: [
    defineAdminNav({
      workspace: "accounting",
      group: "control-room",
      items: [
        {
          id: "accounting-core.overview",
          label: "Control Room",
          icon: "scale",
          to: "/admin/business/accounting",
          permission: "accounting.billing.read"
        }
      ]
    })
  ],
  pages: [
    definePage({
      id: "accounting-core.page",
      kind: "dashboard",
      route: "/admin/business/accounting",
      label: "Accounting Control Room",
      workspace: "accounting",
      group: "control-room",
      permission: "accounting.billing.read",
      component: BusinessAdminPage
    })
  ],
  commands: [
    defineCommand({
      id: "accounting-core.open.control-room",
      label: "Open Accounting Core",
      permission: "accounting.billing.read",
      href: "/admin/business/accounting",
      keywords: ["accounting core","accounting","business"]
    })
  ]
};
