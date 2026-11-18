import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import api from '../api/client'
import ProductCard from '../components/ProductCard'

const PAGE_SIZE = 12

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none'

function FilterForm({ categories, values, onApply, onClear }) {
  const [form, setForm] = useState(values)
  const [formError, setFormError] = useState('')

  function handleChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (form.min && form.max && Number(form.min) > Number(form.max)) {
      setFormError('The minimum price is higher than the maximum.')
      return
    }
    setFormError('')
    onApply({ ...form, search: form.search.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <input id="search" name="search" type="search" placeholder="Product name..."
            value={form.search} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select id="category" name="category" value={form.category}
            onChange={handleChange} className={inputClass}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="min" className="block text-sm font-medium text-gray-700">
            Min price (DZD)
          </label>
          <input id="min" name="min" type="number" min={0} step={1}
            value={form.min} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label htmlFor="max" className="block text-sm font-medium text-gray-700">
            Max price (DZD)
          </label>
          <input id="max" name="max" type="number" min={0} step={1}
            value={form.max} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      {formError && <p className="mt-3 text-sm text-red-700">{formError}</p>}

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full px-5 py-2 text-sm text-gray-600 hover:bg-amber-100"
        >
          Clear
        </button>
      </div>
    </form>
  )
}

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Applied filters come from the URL
  const search = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? ''
  const min = searchParams.get('min') ?? ''
  const max = searchParams.get('max') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)

  // Load the categories once, for the dropdown
  useEffect(() => {
    const controller = new AbortController()
    api
      .get('/categories', { signal: controller.signal })
      .then(({ data }) => setCategories(data))
      .catch(() => {}) // the filter still works without the dropdown names
    return () => controller.abort()
  }, [])

  // Load the products whenever the URL filters change
  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setLoading(true)
      setError('')
      try {
        const params = {
          available_only: true,
          skip: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        }
        if (search) params.search = search
        if (category) params.category_id = category
        if (min) params.min_price = min
        if (max) params.max_price = max

        const { data } = await api.get('/products', {
          params,
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
  }, [search, category, min, max, page])

  function applyFilters(values) {
    const next = new URLSearchParams()
    if (values.search) next.set('search', values.search)
    if (values.category) next.set('category', values.category)
    if (values.min) next.set('min', values.min)
    if (values.max) next.set('max', values.max)
    setSearchParams(next) // no "page" key: back to page 1
  }

  function clearFilters() {
    setSearchParams({})
  }

  function goToPage(value) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(value))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters = Boolean(search || category || min || max)

  return (
    <section>
      <h1 className="text-3xl font-bold text-amber-700">Our Products</h1>

      <FilterForm
        key={searchParams.toString()}
        categories={categories}
        values={{ search, category, min, max }}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {loading && <p className="mt-6 text-gray-500">Loading products...</p>}

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="mt-6 text-gray-500">
          {hasFilters
            ? 'No product matches your filters.'
            : 'No products available yet.'}
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <p className="mt-6 text-gray-600">
            {total} {total === 1 ? 'product' : 'products'}
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="rounded-full bg-white px-4 py-1 text-sm shadow-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="rounded-full bg-white px-4 py-1 text-sm shadow-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Products