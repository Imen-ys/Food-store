import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import api from '../../api/client'
import { getErrorMessage } from '../../api/errors'
import { formatDate } from '../../utils/orderStatus'

const PAGE_SIZE = 10

function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadCustomers() {
      try {
        const params = { skip: page * PAGE_SIZE, limit: PAGE_SIZE }
        if (search) params.search = search
        const { data } = await api.get('/admin/customers', {
          params,
          signal: controller.signal,
        })
        setCustomers(data.items)
        setTotal(data.total)
        setError('')
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        setError(getErrorMessage(err, 'Could not load the customers.'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadCustomers()
    return () => controller.abort()
  }, [search, page])

  function handleSearch(event) {
    event.preventDefault()
    setLoading(true)
    setSearch(searchInput.trim())
    setPage(0)
  }

  function changePage(value) {
    setLoading(true)
    setPage(value)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <section>
      <Link to="/admin" className="text-sm text-amber-700 underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-amber-700">Customers</h1>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          type="search"
          placeholder="Search by name or email..."
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

      {loading && <p className="mt-6 text-gray-500">Loading customers...</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

      {!loading && !error && customers.length === 0 && (
        <p className="mt-6 text-gray-500">No customers found.</p>
      )}

      {!loading && !error && customers.length > 0 && (
        <>
          <p className="mt-6 text-sm text-gray-500">
            {total} {total === 1 ? 'customer' : 'customers'}
          </p>
          <ul className="mt-2 space-y-3">
            {customers.map((customer) => (
              <li
                key={customer.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800">{customer.full_name}</p>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                  <p className="text-sm text-gray-500">
                    {customer.phone ?? 'No phone'} · Joined {formatDate(customer.created_at)}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-600">
                    {customer.orders_count}{' '}
                    {customer.orders_count === 1 ? 'order' : 'orders'}
                  </p>
                  <p className="font-bold text-amber-700">
                    {customer.total_spent} DZD
                  </p>
                  <p className="text-xs text-gray-400">delivered orders only</p>
                </div>
                {!customer.is_active && (
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                    Disabled
                  </span>
                )}
              </li>
            ))}
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

export default AdminCustomers