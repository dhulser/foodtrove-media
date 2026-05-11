import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Network Settings — FoodTrove Media Admin",
  description: "Kevel network configuration, ad density rules, keyword routing, and API health",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
