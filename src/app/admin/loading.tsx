export default function AdminLoading() {
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-56 bg-surface-2 rounded-lg mb-2" />
        <div className="h-4 w-80 bg-surface-2 rounded-lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 h-28">
            <div className="h-3 w-20 bg-surface-2 rounded mb-4" />
            <div className="h-8 w-16 bg-surface-2 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="h-4 w-32 bg-surface-2 rounded" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
            <div className="h-4 w-24 bg-surface-2 rounded" />
            <div className="h-4 w-40 bg-surface-2 rounded flex-1" />
            <div className="h-4 w-20 bg-surface-2 rounded" />
            <div className="h-4 w-16 bg-surface-2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
