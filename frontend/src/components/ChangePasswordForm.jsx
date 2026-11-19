import { useState } from 'react'
import api from '../api/client'
import { getErrorMessage } from '../api/errors'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-600 focus:outline-none'

const EMPTY = { current_password: '', new_password: '', confirm: '' }

function ChangePasswordForm() {
  const [form, setForm] = useState(EMPTY)
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

    if (form.new_password !== form.confirm) {
      setError('The new passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/auth/change-password', {
        current_password: form.current_password,
        new_password: form.new_password,
      })
      setForm(EMPTY)
      setSuccess('Password changed.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-gray-800">Change password</h2>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>
      )}

      <div>
        <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
          Current password
        </label>
        <input id="current_password" name="current_password" type="password" required
          autoComplete="current-password" value={form.current_password}
          onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
          New password (at least 8 characters)
        </label>
        <input id="new_password" name="new_password" type="password" required minLength={8}
          maxLength={72} autoComplete="new-password" value={form.new_password}
          onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
          Confirm new password
        </label>
        <input id="confirm" name="confirm" type="password" required
          autoComplete="new-password" value={form.confirm}
          onChange={handleChange} className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-amber-600 px-6 py-2 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {submitting ? 'Saving...' : 'Change password'}
      </button>
    </form>
  )
}

export default ChangePasswordForm