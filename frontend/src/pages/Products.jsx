import { useEffect, useState } from 'react'
import api from '../api/client'
import ProductCard from '../components/ProductCard'

function Products() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        const { data } = await api.get('/products', {
          params: { available_only: true, limit: 12 },
          signal: controller.signal,
        })
        setProducts(data.items)
        setTotal(data.total)
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        setError('Could not load products. Is the backend running?')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadProducts()
    return () => controller.abort()
  }, [])

  return (
    <section>
      <h1 className="text-3xl font-bold text-amber-700">Our Products</h1>

      {loading && <p className="mt-6 text-gray-500">Loading products...</p>}

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="mt-6 text-gray-500">No products available yet.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <p className="mt-2 text-gray-600">{total} products</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default Products