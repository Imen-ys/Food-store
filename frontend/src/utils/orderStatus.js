export const ORDER_STEPS = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
]

export const STATUS_INFO = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800' },
  out_for_delivery: { label: 'Out for delivery', color: 'bg-orange-100 text-orange-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
}

export function statusInfo(status) {
  return STATUS_INFO[status] ?? { label: status, color: 'bg-gray-100 text-gray-800' }
}

export function formatDate(isoString) {
  // SQLite returns UTC without a "Z", so we add it before converting.
  const value = /Z|[+-]\d\d:\d\d$/.test(isoString) ? isoString : `${isoString}Z`
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}