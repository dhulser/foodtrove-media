import BillingClient from "./BillingClient";

export const metadata = {
  title: "Billing & Invoicing — FoodTrove Admin",
  description: "Invoice management, flight billing reconciliation, and make-good tracking",
};

export default function BillingPage() {
  return <BillingClient initialData={null} />;
}
