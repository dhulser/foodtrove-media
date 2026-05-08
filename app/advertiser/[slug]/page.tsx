import { BRANDS } from "@/lib/brands";
import AdvertiserPortalClient from "./AdvertiserPortalClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);
  if (!brand) return { title: "Advertiser Not Found — FoodTrove Media" };
  return {
    title: `${brand.name} — Advertiser Portal · FoodTrove Media`,
    description: `Campaign performance dashboard for ${brand.name} on the FoodTrove Media retail media network.`,
  };
}

export default async function AdvertiserPortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);
  if (!brand) notFound();

  return <AdvertiserPortalClient slug={slug} />;
}
