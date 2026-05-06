import Link from "next/link";
import { getAllDepartments } from "@/lib/catalog";
import NavClient from "@/components/NavClient";

export default function Nav() {
  const departments = getAllDepartments();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
      {/* Top bar — logo + utility links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-bold tracking-tight text-emerald-700">
              FoodTrove
            </span>
            <span className="hidden sm:inline-block text-xs font-medium text-stone-400 mt-1 leading-none">
              Fresh. Local. Delivered.
            </span>
          </Link>

          {/* Search bar (visual only — browse-only MVP) */}
          <div className="hidden md:flex flex-1 mx-8">
            <div className="relative w-full max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-full bg-stone-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Search products…"
                readOnly
              />
            </div>
          </div>

          {/* Utility icons — cart wired to live state via NavClient */}
          <div className="flex items-center gap-4">
            <NavClient />
          </div>
        </div>
      </div>

      {/* Department nav strip */}
      <nav className="border-t border-stone-100 bg-stone-50 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-0 h-10">
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
