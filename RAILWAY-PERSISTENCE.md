# Railway Persistence Setup

Railway deploy containers can reset their local filesystem. Use a Railway volume so admin products, orders, and uploaded photos survive redeploys.

## Railway Settings

1. Open the Vastravathi service in Railway.
2. Add a volume.
3. Mount it at:

```text
/data
```

4. Add these environment variables:

```text
VASTRAVATHI_DATA_DIR=/data
VASTRAVATHI_UPLOADS_DIR=/data/uploads
```

5. Redeploy Railway.

## Behavior

- `products.json` will be stored at `/data/products.json`.
- `orders.json` will be stored at `/data/orders.json`.
- Uploaded images will be stored at `/data/uploads`.
- On startup, the server merges bundled products from `data/products.json` into the persisted product list if they are missing.
