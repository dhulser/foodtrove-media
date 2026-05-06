import Link from "next/link";
import { getAllDepartments } from "@/lib/catalog";
import NavClient from "@/components/NavClient";
import SearchBar from "@/components/SearchBar";

export default function Nav() {
  const departments = getAllDepartments();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
      {/* Top bar — logo + search + utility links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-bold tracking-tight text-emerald-700">
              FoodTrove
            </span>
            <span className="hidden sm:inline-block text-xs font-medium text-stone-400 mt-1 leading-none">
              Fresh. Local. Delivered.
            </span>
          </Link>

          {/* Search bar — functional, navigates to /search?q= */}
          <div className="hidden md:flex flex-1 max-w-lg">
            <SearchBar />
          </div>

          {/* Utility icons — cart wired to live state via NavClient */}
          <div className="flex items-center gap-4 shrink-0">
            <NavClient />
          </div>
        </div>
      </div>

      {/* Department nav strip */}
      <nav className="border-t border-stone-100 bg-stone-50 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-0 h-10">
            {/* Deals highlight link */}
            <Link
              href="/deals"
              className="flex items-center gap-1.5 px-3 h-full text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 whitespace-nowrap transition-colors border-b-2 border-transparent hover:border-red-500"
            >
              <span className="text-base leading-none">🔥</span>
              <span>Deals</span>
            </Link>
            <span className="w-px h-5 bg-stone-200 mx-1" />
            {departments.map((dept) => (
              <Link
                key={dept.id}
                href={`/shop/${dept.slug}`}
                className="flex items-center gap-1.5 px-3 h-full text-sm font-medium text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 whitespace-nowrap transition-colors border-b-2 border-transparent hover:border-emerald-600"
              >
                <span className="text-base leading-none">{dept.icon}</span>
                <span>{dept.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
