export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fffef7]">
      {/* Navbar skeleton */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-warm-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-warm-100 rounded-2xl animate-pulse" />
            <div className="w-28 h-5 bg-warm-100 rounded-full animate-pulse hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-8 bg-warm-100 rounded-2xl animate-pulse hidden sm:block" />
            <div className="w-9 h-9 bg-warm-100 rounded-2xl animate-pulse" />
            <div className="w-9 h-9 bg-warm-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero skeleton */}
        <div className="mb-10">
          <div className="w-64 h-10 bg-warm-100 rounded-2xl animate-pulse mb-2" />
          <div className="w-48 h-10 bg-warm-100 rounded-2xl animate-pulse mb-4" />
          <div className="w-96 h-5 bg-warm-100 rounded-full animate-pulse" />
        </div>

        {/* Filters skeleton */}
        <div className="flex gap-3 mb-8">
          <div className="w-48 h-10 bg-warm-100 rounded-2xl animate-pulse" />
          <div className="w-20 h-10 bg-warm-100 rounded-2xl animate-pulse" />
          <div className="w-20 h-10 bg-warm-100 rounded-2xl animate-pulse" />
          <div className="w-24 h-10 bg-warm-100 rounded-2xl animate-pulse" />
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-warm-100 shadow-card overflow-hidden"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="aspect-[4/3] bg-warm-100 animate-pulse" />
              <div className="p-4">
                <div className="w-3/4 h-5 bg-warm-100 rounded-full animate-pulse mb-2" />
                <div className="w-full h-4 bg-warm-50 rounded-full animate-pulse mb-1" />
                <div className="w-2/3 h-4 bg-warm-50 rounded-full animate-pulse mb-4" />
                <div className="flex items-center justify-between pt-3 border-t border-warm-50">
                  <div className="w-16 h-6 bg-warm-100 rounded-full animate-pulse" />
                  <div className="w-10 h-10 bg-warm-100 rounded-2xl animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
