import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../utils/orderStatus'

function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadOrders() {
      try {
        const { data } = await api.get('/orders/me', { signal: controller.signal })
        setOrders(data)
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        setError('Could not load your orders.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadOrders()
    return () => controller.abort()
  }, [])

  return (
    <section>
      <h1 className="text-3xl font-bold text-amber-700">My Orders</h1>

      {loading && <p className="mt-6 text-gray-500">Loading orders...</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <div className="mt-6">
          <p className="text-gray-600">You have not placed any order yet.</p>
          <Link to="/products" className="mt-2 inline-block text-amber-700 underline">
            Browse products
          </Link>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              to={`/orders/${order.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div>
                <p className="font-semibold text-gray-800">Order #{order.id}</p>
                <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
              </div>
              <StatusBadge status={order.status} />
              <p className="font-bold text-amber-700">{order.total_amount} DZD</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MyOrders