interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Toggle({ checked, onChange, disabled = false, size = 'md' }: ToggleProps) {
  const sizeClasses = size === 'sm'
    ? 'w-9 h-5'
    : 'w-11 h-6'
  const buttonSizeClasses = size === 'sm'
    ? 'w-4 h-4'
    : 'w-5 h-5'
  const translateClasses = size === 'sm'
    ? checked ? 'translate-x-4' : 'translate-x-0'
    : checked ? 'translate-x-5' : 'translate-x-0'

  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative ${sizeClasses} rounded-full transition-colors ${
        checked ? 'bg-primary-500' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 ${buttonSizeClasses} bg-white rounded-full shadow transition-transform ${translateClasses}`}
      />
    </button>
  )
}
