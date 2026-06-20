export type CitysuperProduct = {
  position?: number
  name: string
  brand?: string
  product_url: string
  image_url?: string
  regular_price_hkd?: number
  sale_price_hkd?: number
  currency?: string
  size?: string
  availability?: string
}

export type CitysuperProductDisplay = CitysuperProduct & {
  note?: string
}

const CITYSUPER_ORIGIN = "https://online.citysuper.com.hk"

function toAbsoluteUrl(url: string | undefined): string | undefined {
  if (!url || typeof url !== "string") return undefined
  const trimmed = url.trim()
  if (!trimmed) return undefined
  try {
    return new URL(trimmed, CITYSUPER_ORIGIN).href
  } catch {
    return /^https?:\/\//i.test(trimmed) ? trimmed : undefined
  }
}

function parsePrice(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  return undefined
}

function normalizeProductRow(
  raw: Record<string, unknown>,
): CitysuperProductDisplay | null {
  const name = typeof raw.name === "string" ? raw.name.trim() : ""
  const productUrl = toAbsoluteUrl(
    typeof raw.product_url === "string" ? raw.product_url : undefined,
  )
  if (!name || !productUrl) return null

  const product: CitysuperProductDisplay = {
    name,
    product_url: productUrl,
    currency: "HKD",
  }

  if (typeof raw.position === "number" && Number.isFinite(raw.position)) {
    product.position = Math.round(raw.position)
  }
  if (typeof raw.brand === "string" && raw.brand.trim()) {
    product.brand = raw.brand.trim()
  }
  const imageUrl = toAbsoluteUrl(
    typeof raw.image_url === "string" ? raw.image_url : undefined,
  )
  if (imageUrl) product.image_url = imageUrl

  const regular = parsePrice(raw.regular_price_hkd)
  const sale = parsePrice(raw.sale_price_hkd)
  if (regular !== undefined) product.regular_price_hkd = regular
  if (sale !== undefined) product.sale_price_hkd = sale
  if (typeof raw.currency === "string" && raw.currency.trim()) {
    product.currency = raw.currency.trim()
  }
  if (typeof raw.size === "string" && raw.size.trim()) {
    product.size = raw.size.trim()
  }
  if (typeof raw.availability === "string" && raw.availability.trim()) {
    product.availability = raw.availability.trim()
  }
  if (typeof raw.note === "string" && raw.note.trim()) {
    product.note = raw.note.trim()
  }

  return product
}

export function parseCitysuperProducts(output: unknown): CitysuperProductDisplay[] {
  if (!output || typeof output !== "object") return []
  const doc = output as Record<string, unknown>
  const productsRaw = doc.products
  if (!Array.isArray(productsRaw)) return []

  const products: CitysuperProductDisplay[] = []
  for (const item of productsRaw) {
    if (!item || typeof item !== "object") continue
    const normalized = normalizeProductRow(item as Record<string, unknown>)
    if (normalized) products.push(normalized)
  }
  return products
}

export function parseShowCitysuperDisplay(output: unknown): {
  title?: string
  products: CitysuperProductDisplay[]
} {
  if (!output || typeof output !== "object") {
    return { products: [] }
  }
  const doc = output as Record<string, unknown>
  const title =
    typeof doc.title === "string" && doc.title.trim()
      ? doc.title.trim()
      : undefined
  return {
    title,
    products: parseCitysuperProducts(output),
  }
}

export function formatCitysuperPrice(
  product: Pick<
    CitysuperProduct,
    "regular_price_hkd" | "sale_price_hkd" | "currency"
  >,
): { display: string; regular?: string; onSale: boolean } | null {
  const sale = product.sale_price_hkd
  const regular = product.regular_price_hkd
  const currency = product.currency ?? "HKD"
  const prefix = currency === "HKD" ? "HK$" : `${currency} `

  if (sale !== undefined) {
    const onSale =
      regular !== undefined && Math.abs(sale - regular) > 0.009
    return {
      display: `${prefix}${sale.toFixed(2)}`,
      regular:
        onSale && regular !== undefined
          ? `${prefix}${regular.toFixed(2)}`
          : undefined,
      onSale,
    }
  }
  if (regular !== undefined) {
    return { display: `${prefix}${regular.toFixed(2)}`, onSale: false }
  }
  return null
}

export function isSoldOutAvailability(availability?: string): boolean {
  if (!availability) return false
  const lower = availability.toLowerCase()
  return (
    lower.includes("sold out") ||
    lower.includes("discontinued") ||
    lower.includes("unavailable") ||
    availability.includes("售罄") ||
    availability.includes("缺貨") ||
    availability.includes("缺货") ||
    availability.includes("停產") ||
    availability.includes("停产")
  )
}
