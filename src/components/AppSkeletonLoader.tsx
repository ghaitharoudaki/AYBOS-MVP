import React from 'react';

export const AppSkeletonLoader: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F6F7F9] font-sans antialiased" dir="ltr">
      {/* Sidebar Skeleton (Deep Navy) */}
      <aside className="w-[240px] flex flex-col bg-[#0F172A] border-r border-slate-800 p-3 space-y-4 flex-shrink-0 animate-pulse">
        {/* Brand header */}
        <div className="h-14 px-2 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-slate-800" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-20 bg-slate-800 rounded" />
            <div className="h-2.5 w-14 bg-slate-800/80 rounded" />
          </div>
        </div>

        {/* 7 Nav Item Placeholders */}
        <div className="flex-1 space-y-2 py-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-800/60 flex items-center px-3 gap-3">
              <div className="w-5 h-5 rounded bg-slate-700/60" />
              <div className="h-3 bg-slate-700/60 rounded flex-1" style={{ width: `${60 + (i % 3) * 15}%` }} />
            </div>
          ))}
        </div>

        {/* User Card Skeleton */}
        <div className="p-2 border-t border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-24 bg-slate-800 rounded" />
            <div className="h-2 w-16 bg-slate-800/80 rounded" />
          </div>
        </div>
      </aside>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top bar skeleton */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 animate-pulse">
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-48 bg-slate-100 rounded hidden sm:block" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48 sm:w-64 h-9 bg-slate-100 rounded-lg" />
            <div className="w-9 h-9 bg-slate-100 rounded-lg" />
            <div className="w-8 h-8 bg-slate-200 rounded-full" />
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="flex-1 overflow-hidden p-6 space-y-6 animate-pulse">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-24 bg-slate-200 rounded" />
                  <div className="w-8 h-8 rounded-lg bg-slate-100" />
                </div>
                <div className="h-7 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-36 bg-slate-100 rounded" />
              </div>
            ))}
          </div>

          {/* Large Content Card / Table Skeleton */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-slate-100 rounded-lg" />
                <div className="h-9 w-32 bg-slate-200 rounded-lg" />
              </div>
            </div>
            
            {/* Table Rows */}
            <div className="space-y-3 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center px-4 justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded bg-slate-200" />
                    <div className="space-y-1 flex-1">
                      <div className="h-3.5 w-48 bg-slate-200 rounded" />
                      <div className="h-2.5 w-24 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
