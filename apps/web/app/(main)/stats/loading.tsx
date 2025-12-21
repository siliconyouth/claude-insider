/**
 * Stats Page Loading State
 *
 * Displayed while the stats page is loading.
 */

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function StatsLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pt-8 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 animate-pulse">
            {/* Hero skeleton */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-600/10 via-blue-600/10 to-cyan-600/10 border border-[#262626] p-8 md:p-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-800 mx-auto" />
                <div className="h-8 w-64 bg-gray-800 rounded mx-auto" />
                <div className="h-6 w-48 bg-gray-800 rounded mx-auto" />
              </div>
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5 bg-[#111111] border border-[#262626]"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-800 mb-3" />
                  <div className="h-8 w-20 bg-gray-800 rounded mb-2" />
                  <div className="h-4 w-16 bg-gray-800 rounded" />
                </div>
              ))}
            </div>

            {/* Two-column skeleton */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-xl p-6 bg-[#111111] border border-[#262626] h-64" />
              <div className="rounded-xl p-6 bg-[#111111] border border-[#262626] h-64" />
            </div>

            {/* Three-column skeleton */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
                <div className="rounded-xl p-6 bg-[#111111] border border-[#262626] h-48" />
                <div className="rounded-xl p-6 bg-[#111111] border border-[#262626] h-48" />
              </div>
              <div className="rounded-xl p-6 bg-[#111111] border border-[#262626] h-48" />
            </div>

            {/* Category skeleton */}
            <div className="rounded-xl p-6 bg-[#111111] border border-[#262626]">
              <div className="h-6 w-48 bg-gray-800 rounded mb-6" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-32 bg-gray-800 rounded" />
                      <div className="h-4 w-16 bg-gray-800 rounded" />
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
