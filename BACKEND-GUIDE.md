# Vastravathi Backend Guide

## Run the backend

From this folder:

```powershell
node server.mjs
```

Open:

- Website: `http://127.0.0.1:4180`
- Admin dashboard: `http://127.0.0.1:4180/admin.html`

## What the backend includes

- Product API: add, edit, delete, list sarees
- Order API: save checkout orders
- Order status API: Pending, Packed, Shipped, Delivered, Cancelled
- Shiprocket placeholder API: marks an order as ready for Shiprocket connection
- Local JSON database in `data/products.json` and `data/orders.json`

## Shiprocket integration point

The current backend saves orders locally. When your Shiprocket account is ready, connect the real Shiprocket order creation API inside:

```text
server.mjs
```

Look for:

```text
/api/shiprocket/sync/:orderId
```

and replace the placeholder with the official Shiprocket API call using your Shiprocket credentials.
