import { Link } from 'react-router'

function NotFound() {
  return (
    <section className="text-center py-12">
      <h1 className="text-5xl font-bold text-amber-700">404</h1>
      <p className="mt-3 text-gray-600">This page does not exist.</p>
      <Link to="/" className="inline-block mt-6 text-amber-700 underline">
        Back to home
      </Link>
    </section>
  )
}

export default NotFound