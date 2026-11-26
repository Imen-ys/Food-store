import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

export default api

// Local images are "/uploads/..." (need the backend address in front).
// Cloudinary images are full https addresses (use them as they are).
export function imageUrl(path) {
  if (!path) return ''
  return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`
}