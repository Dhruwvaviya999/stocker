import { ShoppingCart } from "lucide-react";

import { ModulePlaceholder } from "../_components/module-placeholder";

export default function SalesOrdersPage() {
  return (
    <ModulePlaceholder
      icon={ShoppingCart}
      title="Sales Orders"
      description="Record sales and manage orders here. This module will be built in a later step."
    />
  );
}
