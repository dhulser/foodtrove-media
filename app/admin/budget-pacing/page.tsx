import BudgetPacingClient from "./BudgetPacingClient";

export const metadata = {
  title: "Budget Pacing — FoodTrove Media",
  description:
    "Per-flight spend trajectory and end-of-flight budget projections for all active campaigns.",
};

export default function BudgetPacingPage() {
  return <BudgetPacingClient />;
}
