import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import api from '../api/client'
import ProductCard from '../components/ProductCard'

const FEATURES = [
  { title: 'Healthy options', text: 'Sugar-free cookies and protein snacks.' },
  { title: 'Homemade sweets', text: 'Cakes and desserts made with care.' },
  { title: 'Cash on delivery', text: 'Pay when your order arrives.' },
]

function Home() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          api.get('/categories', { signal: controller.signal }),
          api.get('/products', {
            params: { available_only: true, limit: 4 },
            signal: controller.signal,
          }),
        ])
        setCategories(categoriesResponse.data)
        setProducts(productsResponse.data.items)
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        setError('Could not load the shop content. Is the backend running?')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [])

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-amber-100 to-amber-200 px-6 py-14 text-center sm:py-20">
        <h1 className="text-4xl font-bold text-amber-800 sm:text-5xl">
          Healthy snacks and homemade sweets
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-gray-700">
          Discover our cookies, cakes and protein snacks, made fresh and
          delivered to your door.
        </p>
        <Link
          to="/products"
          className="mt-8 inline-block rounded-full bg-amber-600 px-8 py-3 font-semibold text-white transition hover:bg-amber-700"
        >
          Shop now
        </Link>
      </section>

      {/* Why us */}
      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <h2 className="font-semibold text-amber-700">{feature.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{feature.text}</p>
          </div>
        ))}
      </section>

      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

      {/* Categories */}
      {!loading && !error && categories.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800">Shop by category</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <h3 className="font-semibold text-amber-700">{category.name}</h3>
                {category.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {category.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {!loading && !error && products.length > 0 && (
        <section>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-gray-800">New arrivals</h2>
            <Link to="/products" className="text-sm text-amber-700 underline">
              See all products
            </Link>
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Home