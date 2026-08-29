export default function DeptAdminLoading() {
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-56 bg-surface-2 rounded-lg mb-2" />
        <div className="h-4 w-80 bg-surface-2 rounded-lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 h-28">
            <div className="h-3 w-20 bg-surface-2 rounded mb-4" />
            <div className="h-8 w-16 bg-surface-2 rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-24 bg-surface-2 rounded" />
              <div className="h-4 flex-1 bg-surface-2 rounded" />
              <div className="h-4 w-20 bg-surface-2 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
