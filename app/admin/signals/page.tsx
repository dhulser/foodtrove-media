import SignalsClient from "./SignalsClient";

export const metadata = {
  title: "Signal Intelligence — FoodTrove Media Admin",
  description:
    "Live shopper purchase signals: trending categories, intent keywords, and advertiser targeting recommendations powered by FoodTrove 1P data.",
};

export default function SignalsPage() {
  return <SignalsClient />;
}
