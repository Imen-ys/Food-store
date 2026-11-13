import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import api from '../api/client'
import { getErrorMessage } from '../api/errors'
import { WILAYAS } from '../data/wilayas'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none'

function Checkout() {
  const { user } = useAuth()
  const { items, subtotal, clearCart } = useCart()
  const navigate = useNavigate()
  const orderPlaced = useRef(false)

  const [form, setForm] = useState({
    customer_name: user.full_name,
    phone: user.phone ?? '',
    wilaya: '',
    address: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Nothing to order (but don't redirect right after a successful order)
  if (items.length === 0 && !orderPlaced.current) {
    return <Navigate to="/cart" replace />
  }

  function handleChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/orders', {
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        wilaya: form.wilaya,
        address: form.address.trim(),
        notes: form.notes.trim() || null,
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      })
      orderPlaced.current = true
      clearCart()
      navigate('/order-success', { replace: true, state: { orderId: data.id } })
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session expired. Please log in again.')
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h1 className="text-3xl font-bold text-amber-700">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 space-y-4 rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="font-semibold text-gray-800">Delivery details</h2>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <div>
            <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input id="customer_name" name="customer_name" required minLength={2}
              value={form.customer_name} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input id="phone" name="phone" type="tel" required placeholder="0555123456"
              pattern="\+?[0-9 ]{8,15}" title="8 to 15 digits"
              value={form.phone} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label htmlFor="wilaya" className="block text-sm font-medium text-gray-700">
              Wilaya
            </label>
            <select id="wilaya" name="wilaya" required value={form.wilaya}
              onChange={handleChange} className={inputClass}>
              <option value="">Choose your wilaya</option>
              {WILAYAS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input id="address" name="address" required minLength={5} maxLength={255}
              value={form.address} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea id="notes" name="notes" rows={3} maxLength={500}
              value={form.notes} onChange={handleChange} className={inputClass} />
          </div>

          <p className="text-sm text-gray-500">Payment: cash on delivery.</p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-amber-600 px-6 py-2 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
          >
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <aside className="bg-white rounded-2xl shadow-sm p-6 h-fit">
          <h2 className="font-semibold text-gray-800">Your order</h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-2">
                <span>{item.quantity} × {item.name}</span>
                <span>{item.price * item.quantity} DZD</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t pt-4 flex justify-between text-lg font-bold text-gray-800">
            <span>Total</span>
            <span>{subtotal} DZD</span>
          </div>
          <Link to="/cart" className="mt-4 inline-block text-sm text-amber-700 underline">
            Edit cart
          </Link>
        </aside>
      </div>
    </section>
  )
}

export default Checkout