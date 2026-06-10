import { Settings } from "lucide-react";

import { ModulePlaceholder } from "../_components/module-placeholder";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      icon={Settings}
      title="Settings"
      description="Configure your company settings here. This module will be built in a later step."
    />
  );
}
