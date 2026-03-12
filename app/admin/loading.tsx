export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-warm-50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="w-48 h-8 bg-warm-200 rounded-2xl animate-pulse mb-2" />
          <div className="w-72 h-5 bg-warm-100 rounded-full animate-pulse" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-warm-100 shadow-card">
              <div className="w-10 h-10 bg-warm-100 rounded-2xl animate-pulse mb-3" />
              <div className="w-16 h-7 bg-warm-100 rounded-full animate-pulse mb-1" />
              <div className="w-24 h-4 bg-warm-50 rounded-full animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-3xl border border-warm-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-warm-100">
            <div className="w-36 h-6 bg-warm-100 rounded-full animate-pulse" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-warm-50 last:border-0">
              <div className="w-10 h-10 bg-warm-100 rounded-2xl animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <div className="w-40 h-4 bg-warm-100 rounded-full animate-pulse mb-1.5" />
                <div className="w-24 h-3 bg-warm-50 rounded-full animate-pulse" />
              </div>
              <div className="w-20 h-6 bg-warm-100 rounded-full animate-pulse" />
              <div className="w-16 h-8 bg-warm-100 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
