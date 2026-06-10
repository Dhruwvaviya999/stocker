import { ClipboardList } from "lucide-react";

import { ModulePlaceholder } from "../_components/module-placeholder";

export default function PurchaseOrdersPage() {
  return (
    <ModulePlaceholder
      icon={ClipboardList}
      title="Purchase Orders"
      description="Create and receive purchase orders here. This module will be built in a later step."
    />
  );
}
