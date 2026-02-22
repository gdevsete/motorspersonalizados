/**
 * Loading Spinner Component
 */

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-2 border-[#2a2a2a] border-t-[#ff1e1e] 
                   rounded-full animate-spin`}
      />
    </div>
  )
}

export default LoadingSpinner
