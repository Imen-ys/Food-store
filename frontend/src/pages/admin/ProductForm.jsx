import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import api from '../../api/client'
import { getErrorMessage } from '../../api/errors'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none'

const EMPTY_FORM = {
  category_id: '',
  name: '',
  description: '',
  price: '',
  ingredients: '',
  allergens: '',
  nutrition_info: '',
  stock_quantity: '0',
  is_available: true,
}

function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      setLoading(true)
      setLoadError('')
      try {
        const categoriesRequest = api.get('/categories', { signal: controller.signal })
        const productRequest = isEdit
          ? api.get(`/products/${id}`, { signal: controller.signal })
          : null

        const { data: cats } = await categoriesRequest
        setCategories(cats)

        if (productRequest) {
          const { data: product } = await productRequest
          setForm({
            category_id: String(product.category_id),
            name: product.name,
            description: product.description ?? '',
            price: String(product.price),
            ingredients: product.ingredients ?? '',
            allergens: product.allergens ?? '',
            nutrition_info: product.nutrition_info ?? '',
            stock_quantity: String(product.stock_quantity),
            is_available: product.is_available,
          })
        } else if (cats.length > 0) {
          setForm((prev) => ({ ...prev, category_id: String(cats[0].id) }))
        }
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        const code = err.response?.status
        setLoadError(
          code === 404 || code === 422
            ? 'This product was not found.'
            : getErrorMessage(err, 'Could not load the form data.'),
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [id, isEdit])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = {
      category_id: Number(form.category_id),
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      ingredients: form.ingredients.trim() || null,
      allergens: form.allergens.trim() || null,
      nutrition_info: form.nutrition_info.trim() || null,
      stock_quantity: Number(form.stock_quantity),
      is_available: form.is_available,
    }

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload)
      } else {
        await api.post('/products', payload)
      }
      navigate('/admin/products')
    } catch (err) {
      setError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>

  if (loadError) {
    return (
      <div>
        <p className="rounded-lg bg-red-50 p-4 text-red-700">{loadError}</p>
        <Link to="/admin/products" className="mt-4 inline-block text-amber-700 underline">
          Back to products
        </Link>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div>
        <p className="rounded-lg bg-yellow-50 p-4 text-yellow-800">
          You need at least one category before adding a product. Create one in
          Postman with POST /categories (we will build a categories page later).
        </p>
        <Link to="/admin/products" className="mt-4 inline-block text-amber-700 underline">
          Back to products
        </Link>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-2xl">
      <Link to="/admin/products" className="text-sm text-amber-700 underline">
        ← Back to products
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-amber-700">
        {isEdit ? 'Edit product' : 'Add a product'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input id="name" name="name" required minLength={2} maxLength={150}
            value={form.name} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">Category</label>
          <select id="category_id" name="category_id" required value={form.category_id}
            onChange={handleChange} className={inputClass}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (DZD)</label>
            <input id="price" name="price" type="number" required min={1} step={1}
              value={form.price} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700">Stock quantity</label>
            <input id="stock_quantity" name="stock_quantity" type="number" required min={0} step={1}
              value={form.stock_quantity} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" name="description" rows={3}
            value={form.description} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">Ingredients</label>
          <textarea id="ingredients" name="ingredients" rows={2}
            value={form.ingredients} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label htmlFor="allergens" className="block text-sm font-medium text-gray-700">Allergens</label>
          <textarea id="allergens" name="allergens" rows={2}
            value={form.allergens} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label htmlFor="nutrition_info" className="block text-sm font-medium text-gray-700">Nutrition information</label>
          <textarea id="nutrition_info" name="nutrition_info" rows={3}
            value={form.nutrition_info} onChange={handleChange} className={inputClass} />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="is_available" checked={form.is_available}
            onChange={handleChange} />
          Visible in the shop
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-amber-600 px-6 py-2 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
        >
          {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create product'}
        </button>
      </form>
    </section>
  )
}

export default ProductForm