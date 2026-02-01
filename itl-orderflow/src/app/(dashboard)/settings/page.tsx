import { getSettings } from "@/actions/settings";
import { getUsers } from "@/actions/users";
import { getAllOrderStatuses } from "@/actions/order-statuses";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const [settings, users, statuses] = await Promise.all([
    getSettings(),
    getUsers(),
    getAllOrderStatuses(),
  ]);

  return (
    <SettingsClient
      settings={settings}
      users={users}
      statuses={statuses}
    />
  );
}
