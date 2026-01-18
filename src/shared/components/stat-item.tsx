interface StatItemProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export function StatItem({ label, value, icon, trend }: StatItemProps) {
  return (
    <div className="text-center">
      {icon && <div className="flex justify-center mb-2">{icon}</div>}
      <div className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-1">
        {value}
        {trend === 'up' && <span className="text-success-500 text-sm">↑</span>}
        {trend === 'down' && <span className="text-error-500 text-sm">↓</span>}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
