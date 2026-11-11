import { Link } from 'react-router'

function Home() {
  return (
    <section className="text-center py-12">
      <h1 className="text-4xl font-bold text-amber-700">
        Healthy snacks and homemade sweets
      </h1>
      <p className="mt-4 text-gray-600">
        Discover our cookies, cakes and protein snacks.
      </p>
      <Link
        to="/products"
        className="inline-block mt-8 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2 rounded-full transition"
      >
        Shop now
      </Link>
    </section>
  )
}

export default Home