import { ArrowLeftRight } from "lucide-react";

import { ModulePlaceholder } from "../_components/module-placeholder";

export default function TransfersPage() {
  return (
    <ModulePlaceholder
      icon={ArrowLeftRight}
      title="Stock Transfers"
      description="Transfer stock between Shop and Godown here. This module will be built in a later step."
    />
  );
}
