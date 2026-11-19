import { useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/orderStatus'
import ChangePasswordForm from '../components/ChangePasswordForm'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none'

function Profile() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: user.full_name,
    phone: user.phone ?? '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    setSuccess('')
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await updateProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null, // empty phone must be null
      })
      setSuccess('Profile updated.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold text-amber-700">My Profile</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {success && (
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input id="email" value={user.email} disabled
            className={`${inputClass} bg-gray-100 text-gray-500`} />
          <p className="mt-1 text-xs text-gray-400">The email cannot be changed.</p>
        </div>

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input id="full_name" name="full_name" required minLength={2} maxLength={100}
            autoComplete="name" value={form.full_name} onChange={handleChange}
            className={inputClass} />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" placeholder="0555123456"
            pattern="\+?[0-9 ]{8,15}" title="8 to 15 digits" autoComplete="tel"
            value={form.phone} onChange={handleChange} className={inputClass} />
        </div>

        <p className="text-xs text-gray-400">Member since {formatDate(user.created_at)}</p>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-amber-600 px-6 py-2 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
        >
          {submitting ? 'Saving...' : 'Save changes'}
        </button>
      </form>
      <ChangePasswordForm />
    </section>
  )
}

export default Profile