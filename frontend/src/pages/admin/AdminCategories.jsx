import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import api from '../../api/client'
import { getErrorMessage } from '../../api/errors'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none'

const EMPTY_FORM = { name: '', description: '' }

function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadCategories() {
      try {
        const { data } = await api.get('/categories', { signal: controller.signal })
        setCategories(data)
        setError('')
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        setError(getErrorMessage(err, 'Could not load the categories.'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadCategories()
    return () => controller.abort()
  }, [reloadKey])

  function handleChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  function startEdit(category) {
    setEditingId(category.id)
    setForm({ name: category.name, description: category.description ?? '' })
    setFormError('')
    setActionError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setActionError('')
    setSubmitting(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
    }

    try {
      if (editingId === null) {
        await api.post('/categories', payload)
      } else {
        await api.put(`/categories/${editingId}`, payload)
      }
      cancelEdit()
      setReloadKey((key) => key + 1)
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Delete the category "${category.name}"?`)) return

    setActionError('')
    try {
      await api.delete(`/categories/${category.id}`)
      if (editingId === category.id) cancelEdit()
      setReloadKey((key) => key + 1)
    } catch (err) {
      setActionError(getErrorMessage(err)) // shows the 409 message
    }
  }

  return (
    <section>
      <Link to="/admin" className="text-sm text-amber-700 underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-amber-700">Manage Categories</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-gray-800">
          {editingId === null ? 'Add a category' : 'Edit category'}
        </h2>

        {formError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input id="name" name="name" required minLength={2} maxLength={100}
            value={form.name} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (optional)
          </label>
          <textarea id="description" name="description" rows={2}
            value={form.description} onChange={handleChange} className={inputClass} />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-amber-600 px-6 py-2 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : editingId === null ? 'Add category' : 'Save changes'}
          </button>
          {editingId !== null && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full px-5 py-2 text-sm text-gray-600 hover:bg-amber-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading && <p className="mt-6 text-gray-500">Loading categories...</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {actionError && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{actionError}</p>
      )}

      {!loading && !error && categories.length === 0 && (
        <p className="mt-6 text-gray-500">No categories yet. Add the first one above.</p>
      )}

      {!loading && !error && categories.length > 0 && (
        <ul className="mt-6 space-y-3">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800">{category.name}</p>
                {category.description && (
                  <p className="text-sm text-gray-500">{category.description}</p>
                )}
              </div>
              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => startEdit(category)}
                  className="text-amber-700 underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteCategory(category)}
                  className="text-red-600 underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default AdminCategories