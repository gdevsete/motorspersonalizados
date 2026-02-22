/**
 * Skeleton Loader Components
 * Componentes de loading para diferentes contextos
 */

// Skeleton base
export const Skeleton = ({ className = '', ...props }) => (
  <div className={`skeleton ${className}`} {...props} />
)

// Skeleton para card
export const CardSkeleton = () => (
  <div className="card animate-pulse">
    <Skeleton className="h-48 w-full mb-4" />
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2" />
  </div>
)

// Skeleton para lista de pedidos
export const OrderSkeleton = () => (
  <div className="card animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div>
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
)

// Skeleton para depoimento
export const TestimonialSkeleton = () => (
  <div className="card animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-4/5" />
  </div>
)

export default Skeleton
