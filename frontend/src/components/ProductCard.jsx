import { Link } from 'react-router'
import { API_URL } from '../api/client'

function ProductCard({ product }) {
  const image =
    product.images.find((img) => img.is_main) ?? product.images[0]

  return (
    <Link
      to={`/products/${product.id}`}
      className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
    >
      <article className="h-full bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
        {image ? (
          <img
            src={`${API_URL}${image.image_url}`}
            alt={product.name}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="h-48 w-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm">
            No image
          </div>
        )}
        <div className="p-4 flex flex-col flex-1">
          <h2 className="font-semibold text-gray-800">{product.name}</h2>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {product.description}
          </p>
          <p className="mt-auto pt-3 text-lg font-bold text-amber-700">
            {product.price} DZD
          </p>
        </div>
      </article>
    </Link>
  )
}

export default ProductCard