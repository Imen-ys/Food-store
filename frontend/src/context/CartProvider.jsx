import { useEffect, useMemo, useState } from 'react'
import { CartContext } from './CartContext'

const STORAGE_KEY = 'food-store-cart'
const MAX_PER_ITEM = 50

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [] // corrupted or unavailable storage: start with an empty cart
  }
}

function limitFor(stock) {
  return Math.max(1, Math.min(stock, MAX_PER_ITEM))
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  // Save the cart every time it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage full or blocked: the cart still works in memory */
    }
  }, [items])

  function addItem(product, quantity = 1) {
    const image = product.images?.find((img) => img.is_main) ?? product.images?.[0]
    const limit = limitFor(product.stock_quantity)

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, stock: product.stock_quantity, quantity: Math.min(limit, item.quantity + quantity) }
            : item,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: image ? image.image_url : null,
          stock: product.stock_quantity,
          quantity: Math.min(limit, quantity),
        },
      ]
    })
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(limitFor(item.stock), quantity) }
          : item,
      ),
    )
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )

  const value = {
    items,
    totalItems,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}