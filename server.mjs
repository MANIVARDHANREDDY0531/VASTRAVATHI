import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4180);
const ADMIN_USER = process.env.ADMIN_USER || "MANIVARDHANREDDY";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "minnu9028";
const ADMIN_SESSION = "vastravathi_admin";
const DATA_DIR = join(__dirname, "data");
const UPLOADS_DIR = join(__dirname, "uploads");
const PRODUCTS_FILE = join(DATA_DIR, "products.json");
const ORDERS_FILE = join(DATA_DIR, "orders.json");

const DEFAULT_PRODUCTS = [
  {
    id: "kanjivaram-rose",
    name: "Rose Gold Kanjivaram Silk Saree",
    category: "silk",
    occasion: "Wedding",
    price: 6490,
    compare: 7290,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80",
    details: "A luminous silk saree with zari border, soft drape, and matching blouse piece for wedding functions.",
    fabric: "Pure silk blend",
    color: "Rose gold",
    stock: 14
  },
  {
    id: "cotton-indigo",
    name: "Indigo Handloom Cotton Saree",
    category: "cotton",
    occasion: "Everyday",
    price: 2490,
    compare: 2990,
    badge: "New",
    image: "https://images.unsplash.com/photo-1603217041431-9a99375be8d8?auto=format&fit=crop&w=900&q=80",
    details: "Breathable cotton with a graceful border, made for office days, temple visits, and easy festive styling.",
    fabric: "Handloom cotton",
    color: "Indigo",
    stock: 22
  },
  {
    id: "wedding-maroon",
    name: "Maroon Bridal Zari Saree",
    category: "wedding",
    occasion: "Wedding",
    price: 9990,
    compare: 11990,
    badge: "Festive",
    image: "https://images.unsplash.com/photo-1601482438629-346a273776af?auto=format&fit=crop&w=900&q=80",
    details: "A rich maroon saree with statement border work, styled for reception, engagement, and family ceremonies.",
    fabric: "Silk zari",
    color: "Maroon",
    stock: 9
  },
  {
    id: "organza-mint",
    name: "Mint Floral Organza Saree",
    category: "organza",
    occasion: "Party",
    price: 3990,
    compare: 4590,
    badge: "Lightweight",
    image: "https://images.unsplash.com/photo-1617059322009-17e0fd287b8a?auto=format&fit=crop&w=900&q=80",
    details: "A feather-light organza drape with soft floral detail, ideal for brunches and evening celebrations.",
    fabric: "Organza",
    color: "Mint",
    stock: 18
  },
  {
    id: "silk-teal",
    name: "Teal Temple Border Silk Saree",
    category: "silk",
    occasion: "Festive",
    price: 5790,
    compare: 6490,
    badge: "Premium",
    image: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?auto=format&fit=crop&w=900&q=80",
    details: "Traditional temple border detailing with a jewel-tone finish and elegant fall.",
    fabric: "Art silk",
    color: "Teal",
    stock: 12
  },
  {
    id: "cotton-rust",
    name: "Rust Linen Cotton Saree",
    category: "cotton",
    occasion: "Office",
    price: 2890,
    compare: 3290,
    badge: "Comfort",
    image: "https://images.unsplash.com/photo-1610189020464-076e0b110c8e?auto=format&fit=crop&w=900&q=80",
    details: "A crisp linen-cotton saree with quiet texture and an easy drape for repeat wear.",
    fabric: "Linen cotton",
    color: "Rust",
    stock: 20
  },
  {
    id: "wedding-gold",
    name: "Gold Tissue Celebration Saree",
    category: "wedding",
    occasion: "Reception",
    price: 8490,
    compare: 9490,
    badge: "Limited",
    image: "https://images.unsplash.com/photo-1600703136783-bdb5ea365239?auto=format&fit=crop&w=900&q=80",
    details: "A refined tissue saree with gold sheen, created for evening functions and grand gifting.",
    fabric: "Tissue silk",
    color: "Gold",
    stock: 7
  },
  {
    id: "organza-blush",
    name: "Blush Embroidered Organza Saree",
    category: "organza",
    occasion: "Party",
    price: 4290,
    compare: 4990,
    badge: "Trending",
    image: "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=900&q=80",
    details: "Soft blush organza with embroidered accents and a polished blouse piece.",
    fabric: "Organza silk",
    color: "Blush",
    stock: 16
  }
];

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

async function ensureData() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(UPLOADS_DIR, { recursive: true });
  if (!existsSync(PRODUCTS_FILE)) await writeJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  if (!existsSync(ORDERS_FILE)) await writeJson(ORDERS_FILE, []);
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter((pair) => pair.length === 2 && pair[0])
  );
}

function isAdmin(req) {
  return parseCookies(req)[ADMIN_SESSION] === "active";
}

function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  sendError(res, 401, "Admin login required.");
  return false;
}

function redirectToLogin(res) {
  res.writeHead(302, { Location: "/admin-login.html" });
  res.end();
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeProduct(input) {
  const images = Array.isArray(input.images)
    ? input.images.map((image) => String(image || "").trim()).filter(Boolean).slice(0, 8)
    : String(input.images || "")
      .split("\n")
      .map((image) => image.trim())
      .filter(Boolean)
      .slice(0, 8);
  const image = String(input.image || images[0] || "").trim();
  const normalizedImages = image ? [image, ...images.filter((item) => item !== image)].slice(0, 8) : images;

  return {
    id: input.id || makeId("saree"),
    name: String(input.name || "").trim(),
    category: String(input.category || "silk").trim(),
    occasion: String(input.occasion || "Festive").trim(),
    price: Number(input.price || 0),
    compare: Number(input.compare || 0),
    badge: String(input.badge || "New").trim(),
    image,
    images: normalizedImages,
    details: String(input.details || "").trim(),
    fabric: String(input.fabric || "").trim(),
    color: String(input.color || "").trim(),
    stock: Number(input.stock ?? 0)
  };
}

function normalizeOrder(input) {
  const items = Array.isArray(input.items)
    ? input.items.map((item) => ({
      id: String(item.id || "").trim(),
      sku: String(item.sku || item.id || "").trim(),
      name: String(item.name || "").trim(),
      qty: Math.max(1, Number(item.qty || 1)),
      price: Number(item.price || 0),
      image: String(item.image || "").trim(),
      fabric: String(item.fabric || "").trim(),
      color: String(item.color || "").trim()
    })).filter((item) => item.name && item.price)
    : [];
  const calculatedSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const subtotal = Number(input.subtotal || calculatedSubtotal || 0);
  const paymentMode = input.payment?.mode || input.customer?.payment || "cod";
  const customer = input.customer || {};
  const payment = {
    mode: paymentMode,
    collector: input.payment?.collector || (paymentMode === "cod" ? "Shiprocket" : "Razorpay"),
    status: input.payment?.status || (paymentMode === "cod" ? "COD Pending" : "Razorpay Pending"),
    razorpayOrderId: input.payment?.razorpayOrderId || null,
    razorpayPaymentId: input.payment?.razorpayPaymentId || null
  };
  return {
    id: makeId("order"),
    status: "Pending",
    shipmentStatus: paymentMode === "cod" ? "Ready for Shiprocket COD" : "Awaiting Razorpay payment",
    createdAt: new Date().toISOString(),
    customer: {
      name: String(customer.name || "").trim(),
      phone: String(customer.phone || "").trim(),
      email: String(customer.email || "").trim(),
      address: String(customer.address || "").trim(),
      landmark: String(customer.landmark || "").trim(),
      city: String(customer.city || "").trim(),
      state: String(customer.state || "").trim(),
      pin: String(customer.pin || "").trim(),
      note: String(customer.note || "").trim()
    },
    items,
    subtotal,
    shipping: 0,
    total: subtotal,
    payment,
    shipment: {
      provider: input.shipment?.provider || "Shiprocket",
      packageWeightKg: Number(input.shipment?.packageWeightKg || 0.5),
      pickupType: input.shipment?.pickupType || "Store pickup",
      cod: paymentMode === "cod"
    },
    shiprocket: {
      enabled: true,
      externalOrderId: null,
      awb: null,
      courier: null,
      trackingUrl: null
    }
  };
}

async function handleApi(req, res, url) {
  const products = await readJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  const orders = await readJson(ORDERS_FILE, []);
  const [resource, id, action] = url.pathname.replace(/^\/api\//, "").split("/");

  if (url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, app: "Vastravathi backend" });
    return;
  }

  if (url.pathname === "/api/admin/login" && req.method === "POST") {
    const body = await readBody(req);
    if (body.username === ADMIN_USER && body.password === ADMIN_PASSWORD) {
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": `${ADMIN_SESSION}=active; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
      });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    sendError(res, 401, "Invalid admin ID or password.");
    return;
  }

  if (url.pathname === "/api/admin/logout" && req.method === "POST") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `${ADMIN_SESSION}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
    });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === "/api/admin/me" && req.method === "GET") {
    sendJson(res, 200, { loggedIn: isAdmin(req), username: isAdmin(req) ? ADMIN_USER : null });
    return;
  }

  if (url.pathname === "/api/uploads" && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const contentType = req.headers["content-type"] || "";
    if (!contentType.startsWith("image/")) return sendError(res, 400, "Please upload an image file.");
    const extension = contentType.includes("png")
      ? ".png"
      : contentType.includes("webp")
        ? ".webp"
        : contentType.includes("gif")
          ? ".gif"
          : ".jpg";
    const bytes = await readRawBody(req);
    if (!bytes.length) return sendError(res, 400, "Image file is empty.");
    if (bytes.length > 8 * 1024 * 1024) return sendError(res, 400, "Image must be under 8 MB.");
    const fileName = `${makeId("saree_photo")}${extension}`;
    await writeFile(join(UPLOADS_DIR, fileName), bytes);
    sendJson(res, 201, { url: `/uploads/${fileName}` });
    return;
  }

  if (resource === "products" && req.method === "GET") {
    sendJson(res, 200, products);
    return;
  }

  if (resource === "products" && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const product = sanitizeProduct(await readBody(req));
    if (!product.name || !product.price) return sendError(res, 400, "Product name and price are required.");
    products.push(product);
    await writeJson(PRODUCTS_FILE, products);
    sendJson(res, 201, product);
    return;
  }

  if (resource === "products" && id && req.method === "PUT") {
    if (!requireAdmin(req, res)) return;
    const index = products.findIndex((item) => item.id === id);
    if (index === -1) return sendError(res, 404, "Product not found.");
    products[index] = { ...products[index], ...sanitizeProduct({ ...products[index], ...(await readBody(req)), id }) };
    await writeJson(PRODUCTS_FILE, products);
    sendJson(res, 200, products[index]);
    return;
  }

  if (resource === "products" && id && req.method === "DELETE") {
    if (!requireAdmin(req, res)) return;
    const next = products.filter((item) => item.id !== id);
    await writeJson(PRODUCTS_FILE, next);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (resource === "orders" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, orders);
    return;
  }

  if (resource === "orders" && req.method === "POST") {
    const order = normalizeOrder(await readBody(req));
    if (!order.items.length) return sendError(res, 400, "Order must include at least one item.");
    if (!order.customer.name || !order.customer.phone || !order.customer.address || !order.customer.city || !order.customer.state || !order.customer.pin) {
      return sendError(res, 400, "Name, phone, address, city, state, and PIN code are required.");
    }
    for (const orderItem of order.items) {
      const product = products.find((item) => item.id === orderItem.id);
      if (!product) return sendError(res, 400, `${orderItem.name} is no longer available.`);
      const stock = Number(product.stock ?? 0);
      if (stock <= 0) return sendError(res, 400, `${product.name} is sold out.`);
      if (orderItem.qty > stock) return sendError(res, 400, `Only ${stock} piece(s) available for ${product.name}.`);
    }
    order.items.forEach((orderItem) => {
      const product = products.find((item) => item.id === orderItem.id);
      product.stock = Math.max(0, Number(product.stock ?? 0) - orderItem.qty);
    });
    orders.unshift(order);
    await writeJson(PRODUCTS_FILE, products);
    await writeJson(ORDERS_FILE, orders);
    sendJson(res, 201, order);
    return;
  }

  if (resource === "orders" && id && req.method === "DELETE") {
    if (!requireAdmin(req, res)) return;
    const order = orders.find((item) => item.id === id);
    if (!order) return sendError(res, 404, "Order not found.");
    const nextOrders = orders.filter((item) => item.id !== id);
    (Array.isArray(order.items) ? order.items : []).forEach((orderItem) => {
      const product = products.find((item) => item.id === orderItem.id);
      if (product) product.stock = Number(product.stock ?? 0) + Number(orderItem.qty || 1);
    });
    await writeJson(PRODUCTS_FILE, products);
    await writeJson(ORDERS_FILE, nextOrders);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (resource === "orders" && id && action === "status" && req.method === "PATCH") {
    if (!requireAdmin(req, res)) return;
    const order = orders.find((item) => item.id === id);
    if (!order) return sendError(res, 404, "Order not found.");
    const body = await readBody(req);
    order.status = body.status || order.status;
    order.shipmentStatus = body.shipmentStatus || order.shipmentStatus;
    await writeJson(ORDERS_FILE, orders);
    sendJson(res, 200, order);
    return;
  }

  if (resource === "shiprocket" && id === "sync" && action && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const order = orders.find((item) => item.id === action);
    if (!order) return sendError(res, 404, "Order not found.");
    order.shipmentStatus = "Shiprocket API placeholder";
    order.shiprocket.externalOrderId = order.shiprocket.externalOrderId || `SR-${order.id.toUpperCase()}`;
    await writeJson(ORDERS_FILE, orders);
    sendJson(res, 200, order);
    return;
  }

  sendError(res, 404, "API route not found.");
}

function serveStatic(req, res, url) {
  if ((url.pathname === "/admin.html" || url.pathname === "/admin.js") && !isAdmin(req)) {
    redirectToLogin(res);
    return;
  }

  let filePath = normalize(join(__dirname, decodeURIComponent(url.pathname)));
  const root = resolve(__dirname);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (url.pathname === "/" || !existsSync(filePath)) filePath = join(__dirname, "index.html");
  const type = contentTypes[extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  createReadStream(filePath).pipe(res);
}

async function main() {
  await ensureData();
  createServer(async (req, res) => {
    try {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS"
        });
        res.end();
        return;
      }
      const url = new URL(req.url || "/", `http://${req.headers.host}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url);
        return;
      }
      serveStatic(req, res, url);
    } catch (error) {
      sendError(res, 500, error.message || "Server error");
    }
  }).listen(PORT, "0.0.0.0", () => {
    console.log(`Vastravathi backend: http://0.0.0.0:${PORT}`);
    console.log(`Admin dashboard:     http://0.0.0.0:${PORT}/admin.html`);
  });
}

main();
