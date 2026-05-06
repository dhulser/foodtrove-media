import Link from "next/link";
import { getAllDepartments } from "@/lib/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Departments — FoodTrove",
  description: "Browse all departments at FoodTrove — produce, dairy, bakery, snacks, beverages, meat, frozen, and household.",
};

export default function ShopPage() {
  const departments = getAllDepartments();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">All Departments</h1>
        <p className="text-stone-500 mt-1">Everything you need, all in one place.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {departments.map((dept) => (
          <Link
            key={dept.id}
            href={`/shop/${dept.slug}`}
            className="group relative bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all overflow-hidden"
          >
            {/* Color stripe */}
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-400" />

            <div className="p-6">
              <span className="text-4xl block mb-3">{dept.icon}</span>
              <h2 className="text-lg font-bold text-stone-800 group-hover:text-emerald-700 transition-colors">
                {dept.name}
              </h2>
              <p className="text-sm text-stone-500 mt-1 leading-relaxed">
                {dept.description}
              </p>
              <p className="text-xs text-stone-400 mt-3">
                {dept.products.length} products
              </p>
            </div>

            <div className="px-6 pb-5">
              <span className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 transition-colors">
                Shop now →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
