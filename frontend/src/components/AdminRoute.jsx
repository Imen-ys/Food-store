import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'

function AdminRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="text-gray-500">Loading...</p>

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default AdminRoute