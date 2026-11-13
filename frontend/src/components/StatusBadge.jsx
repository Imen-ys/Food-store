import { statusInfo } from '../utils/orderStatus'

function StatusBadge({ status }) {
  const { label, color } = statusInfo(status)
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}

export default StatusBadge