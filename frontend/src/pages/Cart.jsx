import { Link } from 'react-router'
import { API_URL } from '../api/client'
import { useCart } from '../context/CartContext'

function Cart() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <section className="text-center py-12">
        <h1 className="text-3xl font-bold text-amber-700">Your cart is empty</h1>
        <p className="mt-3 text-gray-600">Add some tasty products first.</p>
        <Link
          to="/products"
          className="inline-block mt-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2 rounded-full transition"
        >
          Browse products
        </Link>
      </section>
    )
  }

  return (
    <section>
      <h1 className="text-3xl font-bold text-amber-700">Your Cart</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <ul className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <li
              key={item.productId}
              className="bg-white rounded-2xl shadow-sm p-4 flex gap-4"
            >
              {item.imageUrl ? (
                <img
                  src={`${API_URL}${item.imageUrl}`}
                  alt={item.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-amber-100" />
              )}

              <div className="flex-1">
                <Link
                  to={`/products/${item.productId}`}
                  className="font-semibold text-gray-800 hover:underline"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-gray-500">{item.price} DZD each</p>

                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-amber-300">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="px-3 py-1 text-lg"
                    >
                      −
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="px-3 py-1 text-lg"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="font-bold text-amber-700">
                {item.price * item.quantity} DZD
              </p>
            </li>
          ))}
        </ul>

        <aside className="bg-white rounded-2xl shadow-sm p-6 h-fit">
          <h2 className="font-semibold text-gray-800">Summary</h2>
          <div className="mt-4 flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{subtotal} DZD</span>
          </div>
          <div className="mt-2 flex justify-between text-gray-600">
            <span>Delivery</span>
            <span>Free for now</span>
          </div>
          <div className="mt-4 border-t pt-4 flex justify-between text-lg font-bold text-gray-800">
            <span>Total</span>
            <span>{subtotal} DZD</span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 block w-full rounded-full bg-amber-600 px-6 py-2 text-center font-semibold text-white transition hover:bg-amber-700"
          >
            Checkout
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="mt-3 w-full text-sm text-gray-500 hover:underline"
          >
            Clear cart
          </button>
        </aside>
      </div>
    </section>
  )
}

export default Cart