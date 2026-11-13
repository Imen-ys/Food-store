import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none'

function Register() {
    const location = useLocation()
    const redirectTo = location.state?.from || '/'
  const { user, loading, register } = useAuth()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

if (!loading && user) return <Navigate to={redirectTo} replace />

  function handleChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null, // empty phone must be null, not ""
        password: form.password,
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold text-amber-700">Create an account</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input id="full_name" name="full_name" required autoComplete="name"
            value={form.full_name} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email"
            value={form.email} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input id="phone" name="phone" type="tel"required autoComplete="tel" placeholder="0555123456"
            value={form.phone} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password (at least 8 characters)
          </label>
          <input id="password" name="password" type="password" required minLength={8}
            autoComplete="new-password" value={form.password} onChange={handleChange}
            className={inputClass} />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <input id="confirm" name="confirm" type="password" required
            autoComplete="new-password" value={form.confirm} onChange={handleChange}
            className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-amber-600 px-6 py-2 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-amber-700 underline">
          Log in
        </Link>
      </p>
    </section>
  )
}

export default Register