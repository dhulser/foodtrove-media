/**
 * /admin/alerts — Flight Ops Alert Center
 * Server component wrapper for the client-side alert dashboard.
 */

import AlertsClient from "./AlertsClient";

export const metadata = {
  title: "Flight Ops Alerts — FoodTrove Media",
  description: "Real-time pacing, fill rate, and creative health alerts for Ad Operations",
};

export default function AlertsPage() {
  return <AlertsClient />;
}
