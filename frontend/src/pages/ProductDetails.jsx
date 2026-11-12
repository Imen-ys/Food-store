import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import api, { API_URL } from '../api/client'
import { useCart } from '../context/CartContext'

function ProductDetails() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [selectedImageId, setSelectedImageId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProduct() {
      setLoading(true)
      setError('')
      setProduct(null)
      setQuantity(1)
      setAdded(false)
      try {
        const { data } = await api.get(`/products/${id}`, {
          signal: controller.signal,
        })
        setProduct(data)
        const main = data.images.find((img) => img.is_main) ?? data.images[0]
        setSelectedImageId(main ? main.id : null)
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        const code = err.response?.status
        if (code === 404 || code === 422) {
          setError('This product was not found.')
        } else {
          setError('Could not load the product. Is the backend running?')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadProduct()
    return () => controller.abort()
  }, [id])

  if (loading) return <p className="text-gray-500">Loading product...</p>

  if (error) {
    return (
      <div>
        <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
        <Link to="/products" className="inline-block mt-4 text-amber-700 underline">
          Back to products
        </Link>
      </div>
    )
  }

  const selectedImage =
    product.images.find((img) => img.id === selectedImageId) ?? product.images[0]

  const inStock = product.is_available && product.stock_quantity > 0
  let stockText = 'Out of stock'
  let stockClass = 'text-red-600'
  if (inStock && product.stock_quantity <= 5) {
    stockText = `Only ${product.stock_quantity} left`
    stockClass = 'text-orange-600'
  } else if (inStock) {
    stockText = 'In stock'
    stockClass = 'text-green-600'
  }
  const maxQuantity = Math.max(1, Math.min(product.stock_quantity, 50))

  function handleAdd() {
    addItem(product, quantity)
    setAdded(true)
  }
  return (
    <section>
      <Link to="/products" className="text-sm text-amber-700 underline">
        ← Back to products
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <div>
          {selectedImage ? (
            <img
              src={`${API_URL}${selectedImage.image_url}`}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-2xl bg-white"
            />
          ) : (
            <div className="w-full aspect-square rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
              No image
            </div>
          )}

          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageId(img.id)}
                  className={`shrink-0 rounded-lg overflow-hidden border-2 ${
                    img.id === selectedImage.id
                      ? 'border-amber-600'
                      : 'border-transparent'
                  }`}
                >
                  <img
                    src={`${API_URL}${img.image_url}`}
                    alt=""
                    className="h-16 w-16 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Information */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {product.price} DZD
          </p>
          <p className={`mt-1 text-sm font-medium ${stockClass}`}>{stockText}</p>
          {inStock && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-full border border-amber-300 bg-white">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-lg"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  className="px-4 py-2 text-lg"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2 rounded-full transition"
              >
                Add to cart
              </button>
            </div>
          )}
          {added && (
            <p className="mt-2 text-sm text-green-700">
              Added to cart.{' '}
              <Link to="/cart" className="underline">
                View cart
              </Link>
            </p>
          )}
          {product.description && (
            <p className="mt-4 text-gray-600">{product.description}</p>
          )}

          <InfoBlock title="Ingredients" text={product.ingredients} />
          <InfoBlock title="Allergens" text={product.allergens} />
          <InfoBlock title="Nutrition" text={product.nutrition_info} />
        </div>
      </div>
    </section>
  )
}

function InfoBlock({ title, text }) {
  if (!text) return null
  return (
    <div className="mt-5">
      <h2 className="font-semibold text-gray-800">{title}</h2>
      <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{text}</p>
    </div>
  )
}

export default ProductDetails