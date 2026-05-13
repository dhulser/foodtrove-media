import { Metadata } from "next";
import PixelsClient from "./PixelsClient";

export const metadata: Metadata = {
  title: "Pixel Manager — FoodTrove Admin",
  description: "Conversion tag status, fire counts, and attribution tracking per advertiser",
};

export default function PixelsPage() {
  return <PixelsClient />;
}
