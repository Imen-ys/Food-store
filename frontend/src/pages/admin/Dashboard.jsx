import { useEffect, useState } from 'react'
import api from '../../api/client'
import { getErrorMessage } from '../../api/errors'
import StatusBadge from '../../components/StatusBadge'
import { ORDER_STEPS } from '../../utils/orderStatus'
import { Link } from 'react-router'

const STATUS_ORDER = [...ORDER_STEPS, 'cancelled']

function formatNumber(value) {
  return value.toLocaleString('en-US')
}

function StatCard({ title, value, hint, highlight = false }) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm ${
        highlight ? 'bg-orange-50 ring-1 ring-orange-200' : 'bg-white'
      }`}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadStats() {
      try {
        const { data } = await api.get('/admin/stats', { signal: controller.signal })
        setStats(data)
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        setError(getErrorMessage(err, 'Could not load the statistics.'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadStats()
    return () => controller.abort()
  }, [])

  return (
    <section>
      <h1 className="text-3xl font-bold text-amber-700">Admin Dashboard</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          to="/admin/orders"
          className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Manage orders
        </Link>
        <Link
          to="/admin/products"
          className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Manage products
        </Link>
      </div>

      {loading && <p className="mt-6 text-gray-500">Loading statistics...</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

      {stats && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total orders" value={formatNumber(stats.total_orders)} />
            <StatCard title="Total products" value={formatNumber(stats.total_products)} />
            <StatCard title="Customers" value={formatNumber(stats.total_customers)} />
            <StatCard
              title="Revenue"
              value={`${formatNumber(stats.total_revenue)} DZD`}
              hint="Delivered orders only"
            />
            <StatCard
              title="Low stock products"
              value={formatNumber(stats.low_stock_products)}
              hint="Available, 5 or fewer left"
              highlight={stats.low_stock_products > 0}
            />
          </div>

          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800">Orders by status</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {STATUS_ORDER.map((status) => (
                <li key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="font-semibold text-gray-700">
                    {stats.orders_by_status[status] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  )
}

export default Dashboard