function Footer() {
  return (
    <footer className="bg-white border-t border-amber-100">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Food Store. Healthy snacks and homemade sweets.
      </div>
    </footer>
  )
}

export default Footer