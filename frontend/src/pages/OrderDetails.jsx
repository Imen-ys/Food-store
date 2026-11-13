import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { ORDER_STEPS, formatDate, statusInfo } from '../utils/orderStatus'

function OrderDetails() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadOrder() {
      setLoading(true)
      setError('')
      setOrder(null)
      try {
        const { data } = await api.get(`/orders/${id}`, { signal: controller.signal })
        setOrder(data)
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        const code = err.response?.status
        setError(
          code === 404 || code === 422
            ? 'Order not found.'
            : 'Could not load the order.',
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadOrder()
    return () => controller.abort()
  }, [id])

  if (loading) return <p className="text-gray-500">Loading order...</p>

  if (error) {
    return (
      <div>
        <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
        <Link to="/orders" className="mt-4 inline-block text-amber-700 underline">
          Back to my orders
        </Link>
      </div>
    )
  }

  const currentStep = ORDER_STEPS.indexOf(order.status)
  const cancelled = order.status === 'cancelled'

  return (
    <section>
      <Link to="/orders" className="text-sm text-amber-700 underline">
        ← Back to my orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-gray-800">Order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>

      {/* Progress tracker */}
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        {cancelled ? (
          <p className="font-medium text-red-700">This order was cancelled.</p>
        ) : (
          <ol className="grid grid-cols-5 gap-2 text-center text-xs sm:text-sm">
            {ORDER_STEPS.map((step, index) => {
              const done = index <= currentStep
              return (
                <li key={step} className="flex flex-col items-center gap-2">
                  <span
                    className={`h-3 w-full rounded-full ${done ? 'bg-amber-600' : 'bg-gray-200'}`}
                  />
                  <span className={done ? 'font-semibold text-amber-700' : 'text-gray-400'}>
                    {statusInfo(step).label}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800">Items</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {order.items.map((item) => (
              <li key={item.product_id} className="flex justify-between gap-2">
                <span>
                    {item.quantity} × {item.product_name}
                </span>
                <span>{item.unit_price * item.quantity} DZD</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t pt-3 text-sm text-gray-600">
            <span>Delivery</span>
            <span>{order.delivery_fee === 0 ? 'Free' : `${order.delivery_fee} DZD`}</span>
          </div>
          <div className="mt-2 flex justify-between font-bold text-gray-800">
            <span>Total</span>
            <span>{order.total_amount} DZD</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm text-sm text-gray-600">
          <h2 className="font-semibold text-gray-800">Delivery details</h2>
          <p className="mt-3">{order.customer_name}</p>
          <p>{order.phone}</p>
          <p>{order.address}</p>
          <p>{order.wilaya}</p>
          {order.notes && <p className="mt-3 italic">“{order.notes}”</p>}
        </div>
      </div>
    </section>
  )
}

export default OrderDetails