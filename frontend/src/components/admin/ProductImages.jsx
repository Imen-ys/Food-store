import { useEffect, useRef, useState } from 'react'
import api, { imageUrl } from '../../api/client'
import { getErrorMessage } from '../../api/errors'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function ProductImages({ productId }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const fileInput = useRef(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadImages() {
      try {
        const { data } = await api.get(`/products/${productId}`, {
          signal: controller.signal,
        })
        setImages(data.images)
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        setError(getErrorMessage(err, 'Could not load the images.'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadImages()
    return () => controller.abort()
  }, [productId, reloadKey])

  async function handleUpload(event) {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setError('')
    setBusy(true)
    try {
      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`"${file.name}" is not a JPEG, PNG or WebP image.`)
          break
        }
        if (file.size > MAX_SIZE) {
          setError(`"${file.name}" is larger than 5 MB.`)
          break
        }
        const formData = new FormData()
        formData.append('file', file)
        try {
          await api.post(`/products/${productId}/images`, formData)
        } catch (err) {
          setError(getErrorMessage(err))
          break
        }
      }
    } finally {
      if (fileInput.current) fileInput.current.value = ''
      setBusy(false)
      setReloadKey((key) => key + 1)
    }
  }

  async function makeMain(image) {
    setError('')
    setBusy(true)
    try {
      await api.patch(`/products/${productId}/images/${image.id}/main`)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function deleteImage(image) {
    if (!window.confirm('Delete this image?')) return
    setError('')
    setBusy(true)
    try {
      await api.delete(`/products/${productId}/images/${image.id}`)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-gray-800">Images</h2>
      <p className="mt-1 text-sm text-gray-500">
        JPEG, PNG or WebP, up to 5 MB each, at most 8 images. The main image is
        shown in the shop list.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="mt-4 text-gray-500">Loading images...</p>
      ) : (
        <>
          {images.length === 0 && (
            <p className="mt-4 text-sm text-gray-500">No images yet.</p>
          )}
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {images.map((image) => (
              <li key={image.id} className="overflow-hidden rounded-xl border border-gray-200">
                <div className="relative">
                  <img
                    src={imageUrl(image.image_url)}
                    alt=""
                    className="h-32 w-full object-cover"
                  />
                  {image.is_main && (
                    <span className="absolute left-2 top-2 rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">
                      Main
                    </span>
                  )}
                </div>
                <div className="flex justify-between gap-2 p-2 text-xs">
                  {image.is_main ? (
                    <span className="text-gray-400">Main image</span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => makeMain(image)}
                      className="text-amber-700 underline disabled:opacity-50"
                    >
                      Make main
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => deleteImage(image)}
                    className="text-red-600 underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-4">
        <label className="inline-block cursor-pointer rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700">
          {busy ? 'Working...' : '+ Upload images'}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )
}

export default ProductImages