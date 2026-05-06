import Link from "next/link";
import { getAllDepartments } from "@/lib/catalog";

export default function Footer() {
  const departments = getAllDepartments();

  return (
    <footer className="bg-stone-900 text-stone-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-white">
              FoodTrove
            </Link>
            <p className="mt-2 text-sm text-stone-400 leading-relaxed">
              Fresh groceries, delivered fast. Quality you can taste.
            </p>
            <p className="mt-4 text-xs text-stone-500">
              © {new Date().getFullYear()} FoodTrove Media. All rights reserved.
            </p>
          </div>

          {/* Departments */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Shop
            </h3>
            <ul className="space-y-2">
              {departments.map((dept) => (
                <li key={dept.id}>
                  <Link
                    href={`/shop/${dept.slug}`}
                    className="text-sm text-stone-400 hover:text-emerald-400 transition-colors"
                  >
                    {dept.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Help
            </h3>
            <ul className="space-y-2">
              {["FAQ", "Delivery Info", "Returns", "Contact Us", "Store Locations"].map((item) => (
                <li key={item}>
                  <span className="text-sm text-stone-400 cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Company
            </h3>
            <ul className="space-y-2">
              {["About Us", "Careers", "Press", "Advertise With Us", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <span className="text-sm text-stone-400 cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            Prices and availability subject to change. We reserve the right to limit quantities.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-600">Powered by</span>
            <span className="text-xs font-semibold text-stone-400">Kevel</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
