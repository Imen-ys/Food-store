import { Link, NavLink } from 'react-router'
import { useCart } from '../context/CartContext'

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-full text-sm font-medium transition ${
    isActive
      ? 'bg-amber-600 text-white'
      : 'text-gray-700 hover:bg-amber-100'
  }`

function Navbar() {
  const { totalItems } = useCart()
  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <Link to="/" className="text-xl font-bold text-amber-700">
          Food Store
        </Link>
        <div className="flex gap-1">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/products" className={linkClass}>
            Products
          </NavLink>
          <NavLink to="/cart" className={linkClass}>
            Cart{totalItems > 0 && ` (${totalItems})`}
          </NavLink>
        </div>
      </nav>
    </header>
  )
}

export default Navbar