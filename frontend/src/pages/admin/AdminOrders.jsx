import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import api from '../../api/client'
import { getErrorMessage } from '../../api/errors'
import StatusBadge from '../../components/StatusBadge'
import { ORDER_STEPS, formatDate, statusInfo } from '../../utils/orderStatus'

const PAGE_SIZE = 10
const FILTERS = ['all', ...ORDER_STEPS, 'cancelled']

// Same rules as ALLOWED_TRANSITIONS in the backend
const NEXT_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadOrders() {
      try {
        const params = { skip: page * PAGE_SIZE, limit: PAGE_SIZE }
        if (filter !== 'all') params.status = filter
        const { data } = await api.get('/orders', {
          params,
          signal: controller.signal,
        })
        setOrders(data.items)
        setTotal(data.total)
        setError('')
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        setError(getErrorMessage(err, 'Could not load the orders.'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadOrders()
    return () => controller.abort()
  }, [filter, page, reloadKey])

  function changeFilter(value) {
    setLoading(true)
    setFilter(value)
    setPage(0)
    setOpenId(null)
    setActionError('')
  }

  function changePage(value) {
    setLoading(true)
    setPage(value)
    setOpenId(null)
  }

  async function updateStatus(order, newStatus) {
    if (!newStatus) return
    if (
      newStatus === 'cancelled' &&
      !window.confirm(`Cancel order #${order.id}? The stock will be returned.`)
    ) {
      return
    }

    setActionError('')
    setUpdatingId(order.id)
    try {
      await api.patch(`/orders/${order.id}/status`, { status: newStatus })
      setReloadKey((key) => key + 1)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <section>
      <Link to="/admin" className="text-sm text-amber-700 underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-amber-700">Manage Orders</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => changeFilter(value)}
            className={`rounded-full px-4 py-1 text-sm font-medium transition ${
              filter === value
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 hover:bg-amber-100'
            }`}
          >
            {value === 'all' ? 'All' : statusInfo(value).label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-gray-500">Loading orders...</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {actionError && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{actionError}</p>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="mt-6 text-gray-500">No orders found.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          <p className="mt-6 text-sm text-gray-500">{total} orders</p>
          <ul className="mt-2 space-y-4">
            {orders.map((order) => {
              const next = NEXT_STATUSES[order.status] ?? []
              const open = openId === order.id
              return (
                <li key={order.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">Order #{order.id}</p>
                      <p className="text-sm text-gray-500">
                        {order.customer_name} · {order.wilaya} · {formatDate(order.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                    <p className="font-bold text-amber-700">{order.total_amount} DZD</p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : order.id)}
                      className="text-sm text-amber-700 underline"
                    >
                      {open ? 'Hide details' : 'Show details'}
                    </button>

                    {next.length > 0 ? (
                      <select
                        value=""
                        disabled={updatingId === order.id}
                        onChange={(e) => updateStatus(order, e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="">
                          {updatingId === order.id ? 'Updating...' : 'Change status...'}
                        </option>
                        {next.map((status) => (
                          <option key={status} value={status}>
                            {statusInfo(status).label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-400">Final status</span>
                    )}
                  </div>

                  {open && (
                    <div className="mt-4 grid gap-4 border-t pt-4 text-sm text-gray-600 md:grid-cols-2">
                      <div>
                        <h2 className="font-semibold text-gray-800">Items</h2>
                        <ul className="mt-2 space-y-1">
                          {order.items.map((item) => (
                            <li key={item.product_id} className="flex justify-between gap-2">
                              <span>{item.quantity} × {item.product_name}</span>
                              <span>{item.unit_price * item.quantity} DZD</span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2">
                          Delivery: {order.delivery_fee === 0 ? 'Free' : `${order.delivery_fee} DZD`}
                        </p>
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-800">Delivery details</h2>
                        <p className="mt-2">{order.customer_name}</p>
                        <p>{order.phone}</p>
                        <p>{order.address}</p>
                        <p>{order.wilaya}</p>
                        {order.notes && <p className="mt-2 italic">“{order.notes}”</p>}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => changePage(page - 1)}
              className="rounded-full bg-white px-4 py-1 text-sm shadow-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => changePage(page + 1)}
              className="rounded-full bg-white px-4 py-1 text-sm shadow-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default AdminOrders