interface Props {
  status: 'high' | 'low' | 'normal' | 'near_optimal' | 'attention' | 'good' | 'mild_attention'
}

const config = {
  high: { label: 'High', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  low: { label: 'Low', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  normal: { label: 'Normal', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  near_optimal: { label: 'Near Optimal', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  attention: { label: 'Attention Needed', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  good: { label: 'Within Range', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  mild_attention: { label: 'Mild Abnormality', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
}

export default function StatusBadge({ status }: Props) {
  const c = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
