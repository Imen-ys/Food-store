import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-full text-sm font-medium transition ${
    isActive
      ? 'bg-amber-600 text-white'
      : 'text-gray-700 hover:bg-amber-100'
  }`

function Navbar() {
  const { totalItems } = useCart()
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <Link to="/" className="text-xl font-bold text-amber-700">
          Food Store
        </Link>

        <div className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/products" className={linkClass}>
            Products
          </NavLink>
          <NavLink to="/cart" className={linkClass}>
            Cart{totalItems > 0 && ` (${totalItems})`}
          </NavLink>

          {!loading && !user && (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Sign up
              </NavLink>
            </>
          )}

          {!loading && user && (
            <>
              <span className="px-3 text-sm text-gray-600">
                Hi, {user.full_name.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-amber-100"
              >
                Log out
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar