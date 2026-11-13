import { Link, useLocation } from 'react-router'

function OrderSuccess() {
    const { state } = useLocation()

    return (
    <section className="text-center py-12">
        <h1 className="text-3xl font-bold text-green-700">Thank you for your order!</h1>
        {state?.orderId && (
            <p className="mt-3 text-gray-600">
                Your order number is{' '}
                <Link to={`/orders/${state.orderId}`} className="text-amber-700 underline">
                #{state.orderId}
                </Link>
                .
            </p>
        )}
      <p className="mt-2 text-gray-600">We will contact you to confirm the delivery.</p>
      <Link
        to="/products"
        className="inline-block mt-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2 rounded-full transition"
      >
        Continue shopping
      </Link>
    </section>
  )
}

export default OrderSuccess