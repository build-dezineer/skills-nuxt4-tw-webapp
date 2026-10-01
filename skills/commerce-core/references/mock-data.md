# Commerce Core — Mock Data Files

Read this file before generating `public/data/products.json` or `public/data/orders.json`.
It carries the required shapes, counts, and complete examples.

## Mock data — generate `public/data/products.json` (+ `orders.json` for admin)

`useProducts`/`useOrders` fetch `/data/products.json` and `/data/orders.json`. This builder generates a
**frontend with mock data (no backend)**, so YOU create these files as part of building commerce — do
not wait for any separate data step.

`public/data/products.json` — **≥ 8 products across ≥ 2 categories**, matching `Product` in `commerce.ts`:

```json
[
  {
    "id": "p-1", "slug": "merino-crew-sweater", "name": "Merino Crew Sweater",
    "price": 129, "compareAtPrice": 169, "currency": "USD",
    "description": "Full-sentence product copy.",
    "images": ["https://images.unsplash.com/photo-...?w=900&h=1200&fit=crop"],
    "category": "Knitwear", "tags": ["wool"],
    "options": [{ "name": "Size", "values": [{ "label": "S", "value": "s" }, { "label": "M", "value": "m" }] }],
    "variants": [{ "id": "p-1-s", "options": { "Size": "s" }, "inStock": true }],
    "rating": 4.6, "reviewCount": 87, "inStock": true, "badges": ["Bestseller"], "featured": true
  }
]
```
`id`/`slug` (unique kebab-case)/`name`/`price`/`images` are required; add `options`+`variants` for
multi-variant goods; a few `compareAtPrice`/`inStock:false` for sale/sold-out states.

`public/data/orders.json` — **≥ 10 orders with a spread of statuses** (admin surface only), matching `Order`:

```json
[
  {
    "id": "o-1042", "number": "#1042", "customer": "Sarah Chen", "email": "sarah@example.com",
    "status": "shipped", "currency": "USD", "total": 268, "createdAt": "2026-06-14",
    "items": [{ "productId": "p-1", "name": "Merino Crew Sweater", "variantLabel": "Size: M", "price": 129, "quantity": 2 }]
  }
]
```
`status` ∈ `pending | paid | fulfilled | shipped | delivered | cancelled | refunded`.

