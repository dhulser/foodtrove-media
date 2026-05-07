import type { Metadata } from "next";
import SalesDashboardClient from "./SalesDashboardClient";

export const metadata: Metadata = {
  title: "Sales Report — FoodTrove Media",
  description: "Live advertiser roster, CPM rates, and estimated revenue by format",
};

export default function SalesPage() {
  return <SalesDashboardClient />;
}
