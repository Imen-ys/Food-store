export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err.response) {
    return 'Cannot reach the server. Is the backend running?'
  }
  const detail = err.response.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg).join('. ')
  }
  return fallback
}