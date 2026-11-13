import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import api, { API_URL } from '../../api/client'
import { getErrorMessage } from '../../api/errors'

const PAGE_SIZE = 10

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        const params = { skip: page * PAGE_SIZE, limit: PAGE_SIZE }
        if (search) params.search = search
        const { data } = await api.get('/products', {
          params,
          signal: controller.signal,
        })
        setProducts(data.items)
        setTotal(data.total)
        setError('')
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        setError(getErrorMessage(err, 'Could not load the products.'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadProducts()
    return () => controller.abort()
  }, [search, page, reloadKey])

  function handleSearch(event) {
    event.preventDefault()
    setLoading(true)
    setSearch(searchInput.trim())
    setPage(0)
    setActionError('')
  }

  function changePage(value) {
    setLoading(true)
    setPage(value)
  }

  async function toggleAvailability(product) {
    setActionError('')
    setBusyId(product.id)
    try {
      await api.put(`/products/${product.id}`, {
        category_id: product.category_id,
        name: product.name,
        description: product.description,
        price: product.price,
        ingredients: product.ingredients,
        allergens: product.allergens,
        nutrition_info: product.nutrition_info,
        stock_quantity: product.stock_quantity,
        is_available: !product.is_available,
      })
      setReloadKey((key) => key + 1)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}" permanently?`)) return

    setActionError('')
    setBusyId(product.id)
    try {
      await api.delete(`/products/${product.id}`)
      // If we deleted the last item of a page, go back one page
      if (products.length === 1 && page > 0) {
        setLoading(true)
        setPage(page - 1)
      } else {
        setReloadKey((key) => key + 1)
      }
    } catch (err) {
      setActionError(getErrorMessage(err)) // shows the 409 message from the backend
    } finally {
      setBusyId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <section>
      <Link to="/admin" className="text-sm text-amber-700 underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-amber-700">Manage Products</h1>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          type="search"
          placeholder="Search by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Search
        </button>
      </form>

      {loading && <p className="mt-6 text-gray-500">Loading products...</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {actionError && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{actionError}</p>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="mt-6 text-gray-500">No products found.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <p className="mt-6 text-sm text-gray-500">{total} products</p>
          <ul className="mt-2 space-y-3">
            {products.map((product) => {
              const image =
                product.images.find((img) => img.is_main) ?? product.images[0]
              return (
                <li
                  key={product.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm"
                >
                  {image ? (
                    <img
                      src={`${API_URL}${image.image_url}`}
                      alt={product.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-amber-100" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      {product.price} DZD · Stock: {product.stock_quantity}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      product.is_available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {product.is_available ? 'Visible' : 'Hidden'}
                  </span>

                  <div className="flex gap-3 text-sm">
                    <button
                      type="button"
                      disabled={busyId === product.id}
                      onClick={() => toggleAvailability(product)}
                      className="text-amber-700 underline disabled:opacity-50"
                    >
                      {product.is_available ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === product.id}
                      onClick={() => deleteProduct(product)}
                      className="text-red-600 underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
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

export default AdminProducts