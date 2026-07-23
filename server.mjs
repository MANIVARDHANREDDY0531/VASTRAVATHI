import { createServer } from "node:http";
import { request as httpsRequest } from "node:https";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  const content = String(readFileSync(file, "utf8"));
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
    }
  });
}

loadEnvFile(join(process.cwd(), ".env"));
loadEnvFile(join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 4180);
const ADMIN_USER = process.env.ADMIN_USER || "MANIVARDHANREDDY";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "minnu9028";
const ADMIN_SESSION = "vastravathi_admin";
const PREPAID_DISCOUNT_RATE = 0.1;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL || "";
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD || "";
const SHIPROCKET_PICKUP_LOCATION = process.env.SHIPROCKET_PICKUP_LOCATION || "";
const SHIPROCKET_CHANNEL_ID = process.env.SHIPROCKET_CHANNEL_ID || "";
const SHIPROCKET_COMPANY_NAME = process.env.SHIPROCKET_COMPANY_NAME || "Vastravathi";
const SHIPROCKET_SUPPORT_EMAIL = process.env.SHIPROCKET_SUPPORT_EMAIL || "souledsarees@gmail.com";
const SHIPROCKET_PACKAGE_LENGTH_CM = Number(process.env.SHIPROCKET_PACKAGE_LENGTH_CM || 32);
const SHIPROCKET_PACKAGE_BREADTH_CM = Number(process.env.SHIPROCKET_PACKAGE_BREADTH_CM || 24);
const SHIPROCKET_PACKAGE_HEIGHT_CM = Number(process.env.SHIPROCKET_PACKAGE_HEIGHT_CM || 4);
const SHIPROCKET_PACKAGE_WEIGHT_KG = Number(process.env.SHIPROCKET_PACKAGE_WEIGHT_KG || 0.5);
const BUNDLED_DATA_DIR = join(__dirname, "data");
const BUNDLED_UPLOADS_DIR = join(__dirname, "uploads");
const DATA_DIR = process.env.VASTRAVATHI_DATA_DIR || BUNDLED_DATA_DIR;
const UPLOADS_DIR = process.env.VASTRAVATHI_UPLOADS_DIR || join(DATA_DIR, "uploads");
const PRODUCTS_FILE = join(DATA_DIR, "products.json");
const ORDERS_FILE = join(DATA_DIR, "orders.json");
const BUNDLED_PRODUCTS_FILE = join(BUNDLED_DATA_DIR, "products.json");

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
  if (!existsSync(PRODUCTS_FILE)) {
    const seedProducts = await readJson(BUNDLED_PRODUCTS_FILE, DEFAULT_PRODUCTS);
    await writeJson(PRODUCTS_FILE, seedProducts);
  }
  if (!existsSync(ORDERS_FILE)) await writeJson(ORDERS_FILE, []);

  const currentProducts = await readJson(PRODUCTS_FILE, []);
  const bundledProducts = await readJson(BUNDLED_PRODUCTS_FILE, DEFAULT_PRODUCTS);
  const existingIds = new Set(currentProducts.map((product) => product.id));
  const missingBundledProducts = bundledProducts.filter((product) => product.id && !existingIds.has(product.id));
  if (missingBundledProducts.length) {
    await writeJson(PRODUCTS_FILE, [...currentProducts, ...missingBundledProducts]);
  }
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

function razorpayReady() {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

function shiprocketReady() {
  return Boolean(SHIPROCKET_EMAIL && SHIPROCKET_PASSWORD && SHIPROCKET_PICKUP_LOCATION);
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature || !RAZORPAY_KEY_SECRET) return false;
  const expected = createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(String(signature));
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function razorpayRequest(path, payload) {
  return new Promise((resolvePromise, reject) => {
    const body = JSON.stringify(payload);
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    const request = httpsRequest({
      hostname: "api.razorpay.com",
      path,
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const responseText = Buffer.concat(chunks).toString("utf8");
        const data = responseText ? JSON.parse(responseText) : {};
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolvePromise(data);
          return;
        }
        const error = new Error(data.error?.description || data.error?.reason || "Razorpay request failed");
        error.statusCode = response.statusCode;
        reject(error);
      });
    });
    request.setTimeout(20000, () => {
      request.destroy(new Error("Razorpay is taking too long to respond. Please try again."));
    });
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

function shiprocketRequest(path, payload, token = "") {
  return new Promise((resolvePromise, reject) => {
    const body = JSON.stringify(payload);
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body)
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const request = httpsRequest({
      hostname: "apiv2.shiprocket.in",
      path,
      method: "POST",
      headers
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const responseText = Buffer.concat(chunks).toString("utf8");
        let data = {};
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          data = { message: responseText };
        }
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolvePromise(data);
          return;
        }
        const message = data.message || data.error || data.errors?.join?.(", ") || "Shiprocket request failed";
        const error = new Error(message);
        error.statusCode = response.statusCode;
        error.data = data;
        reject(error);
      });
    });
    request.setTimeout(20000, () => {
      request.destroy(new Error("Shiprocket is taking too long to respond. Please try again."));
    });
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

async function getShiprocketToken() {
  if (!shiprocketReady()) {
    throw new Error("Shiprocket email, password, and pickup location are required.");
  }
  const response = await shiprocketRequest("/v1/external/auth/login", {
    email: SHIPROCKET_EMAIL,
    password: SHIPROCKET_PASSWORD
  });
  if (!response.token) throw new Error("Shiprocket login did not return a token.");
  return response.token;
}

function splitCustomerName(name) {
  const parts = String(name || "Customer").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || "Customer",
    lastName: parts.join(" ")
  };
}

function buildShiprocketPayload(order) {
  const customer = order.customer || {};
  const { firstName, lastName } = splitCustomerName(customer.name);
  const externalOrderId = order.shiprocket?.externalOrderId || `VS${Date.now()}`;
  const paymentMethod = order.payment?.mode === "cod" ? "COD" : "Prepaid";
  const items = Array.isArray(order.items) ? order.items : [];

  return {
    order_id: externalOrderId,
    order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 19).replace("T", " "),
    pickup_location: SHIPROCKET_PICKUP_LOCATION,
    channel_id: SHIPROCKET_CHANNEL_ID || "",
    comment: "Vastravathi website order",
    company_name: SHIPROCKET_COMPANY_NAME,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: customer.address,
    billing_address_2: customer.landmark || "",
    billing_city: customer.city,
    billing_pincode: customer.pin,
    billing_state: customer.state,
    billing_country: "India",
    billing_email: customer.email || SHIPROCKET_SUPPORT_EMAIL,
    billing_phone: String(customer.phone || "").replace(/\D/g, "").slice(-10),
    shipping_is_billing: true,
    order_items: items.map((item) => ({
      name: item.name,
      sku: item.sku || item.id || item.name,
      units: Number(item.qty || 1),
      selling_price: Number(item.price || 0),
      discount: 0,
      tax: "",
      hsn: ""
    })),
    payment_method: paymentMethod,
    shipping_charges: Number(order.shipping || 0),
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: Number(order.discount || 0),
    sub_total: Number(order.total || order.subtotal || 0),
    length: SHIPROCKET_PACKAGE_LENGTH_CM,
    breadth: SHIPROCKET_PACKAGE_BREADTH_CM,
    height: SHIPROCKET_PACKAGE_HEIGHT_CM,
    weight: Number(order.shipment?.packageWeightKg || SHIPROCKET_PACKAGE_WEIGHT_KG)
  };
}

async function syncOrderToShiprocket(order) {
  if (!shiprocketReady()) {
    throw new Error("Shiprocket is not configured in Railway Variables.");
  }
  order.shiprocket = order.shiprocket || {};
  order.shiprocket.externalOrderId = order.shiprocket.externalOrderId || `VS${Date.now()}`;
  const token = await getShiprocketToken();
  const payload = buildShiprocketPayload(order);
  const response = await shiprocketRequest("/v1/external/orders/create/adhoc", payload, token);
  order.shiprocket.externalOrderId = String(response.order_id || payload.order_id);
  order.shiprocket.shipmentId = response.shipment_id || order.shiprocket.shipmentId || null;
  order.shiprocket.awb = response.awb_code || order.shiprocket.awb || null;
  order.shiprocket.courier = response.courier_name || order.shiprocket.courier || null;
  order.shiprocket.statusCode = response.status_code || order.shiprocket.statusCode || null;
  order.shiprocket.syncedAt = new Date().toISOString();
  order.shiprocket.lastError = null;
  order.shipmentStatus = response.awb_code
    ? `Shiprocket synced - AWB ${response.awb_code}`
    : `Shiprocket synced - ${response.status || "NEW"}`;
  return response;
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
  const requestedPaymentMode = input.payment?.mode || input.customer?.payment || "cod";
  const paymentMode = requestedPaymentMode === "prepaid" ? "prepaid" : "cod";
  const discount = paymentMode === "prepaid" ? Math.round(subtotal * PREPAID_DISCOUNT_RATE) : 0;
  const total = Math.max(0, subtotal - discount);
  const customer = input.customer || {};
  const payment = {
    mode: paymentMode,
    collector: paymentMode === "cod" ? "Shiprocket" : "Razorpay",
    status: paymentMode === "cod" ? "COD Pending" : String(input.payment?.status || "Razorpay Pending"),
    razorpayOrderId: input.payment?.razorpayOrderId || null,
    razorpayPaymentId: input.payment?.razorpayPaymentId || null,
    razorpaySignature: input.payment?.razorpaySignature || null
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
    discount,
    shipping: 0,
    total,
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
      shipmentId: null,
      awb: null,
      courier: null,
      trackingUrl: null,
      syncedAt: null,
      lastError: null
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

  if (url.pathname === "/api/create-order" && req.method === "POST") {
    if (!razorpayReady()) return sendError(res, 500, "Razorpay keys are not configured.");
    const body = await readBody(req);
    const amount = Math.round(Number(body.amount || 0));
    const currency = String(body.currency || "INR").trim().toUpperCase();
    const receipt = String(body.receipt || makeId("receipt")).trim().slice(0, 40);
    if (!Number.isFinite(amount) || amount < 100) return sendError(res, 400, "Minimum Razorpay amount is 100 paise.");

    try {
      const razorpayOrder = await razorpayRequest("/v1/orders", {
        amount,
        currency,
        receipt,
        payment_capture: 1
      });
      sendJson(res, 200, {
        key_id: RAZORPAY_KEY_ID,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      });
    } catch (error) {
      sendError(res, error.statusCode === 401 ? 401 : 500, error.message || "Razorpay order could not be created.");
    }
    return;
  }

  if (url.pathname === "/api/verify-payment" && req.method === "POST") {
    const body = await readBody(req);
    const orderId = body.razorpay_order_id || body.order_id;
    const paymentId = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;
    if (!orderId || !paymentId || !signature) return sendError(res, 400, "Payment verification fields are required.");
    if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
      return sendError(res, 400, "Payment signature mismatch.");
    }
    sendJson(res, 200, { ok: true });
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
    if (order.payment.mode === "prepaid") {
      const verified = verifyRazorpaySignature({
        orderId: order.payment.razorpayOrderId,
        paymentId: order.payment.razorpayPaymentId,
        signature: order.payment.razorpaySignature
      });
      if (!verified) return sendError(res, 400, "Verified Razorpay payment is required for prepaid orders.");
      order.payment.status = "Paid";
      order.shipmentStatus = "Razorpay paid - Ready for Shiprocket";
    }
    for (const orderItem of order.items) {
      const product = products.find((item) => item.id === orderItem.id);
      if (!product) continue;
      const stock = Number(product.stock ?? 0);
      if (stock <= 0) return sendError(res, 400, `${product.name} is sold out.`);
      if (orderItem.qty > stock) return sendError(res, 400, `Only ${stock} piece(s) available for ${product.name}.`);
    }
    order.items.forEach((orderItem) => {
      const product = products.find((item) => item.id === orderItem.id);
      if (product) product.stock = Math.max(0, Number(product.stock ?? 0) - orderItem.qty);
    });
    if (shiprocketReady()) {
      try {
        await syncOrderToShiprocket(order);
      } catch (error) {
        order.shiprocket.lastError = error.message || "Shiprocket sync failed.";
        order.shipmentStatus = `Shiprocket sync pending - ${order.shiprocket.lastError}`;
      }
    }
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
    try {
      const response = await syncOrderToShiprocket(order);
      await writeJson(ORDERS_FILE, orders);
      sendJson(res, 200, { order, shiprocket: response });
    } catch (error) {
      order.shiprocket = order.shiprocket || {};
      order.shiprocket.lastError = error.message || "Shiprocket sync failed.";
      order.shipmentStatus = `Shiprocket sync failed - ${order.shiprocket.lastError}`;
      await writeJson(ORDERS_FILE, orders);
      sendError(res, error.statusCode === 401 ? 401 : 500, order.shiprocket.lastError);
    }
    return;
  }

  sendError(res, 404, "API route not found.");
}

function serveStatic(req, res, url) {
  if ((url.pathname === "/admin.html" || url.pathname === "/admin.js" || url.pathname === "/orders.html") && !isAdmin(req)) {
    redirectToLogin(res);
    return;
  }

  const root = resolve(__dirname);
  const uploadRoot = resolve(UPLOADS_DIR);
  const bundledUploadRoot = resolve(BUNDLED_UPLOADS_DIR);
  let filePath = normalize(join(__dirname, decodeURIComponent(url.pathname)));

  if (url.pathname.startsWith("/uploads/")) {
    const uploadName = decodeURIComponent(url.pathname.replace(/^\/uploads\//, ""));
    const persistedUpload = normalize(join(UPLOADS_DIR, uploadName));
    const bundledUpload = normalize(join(BUNDLED_UPLOADS_DIR, uploadName));
    if (resolve(persistedUpload).startsWith(uploadRoot) && existsSync(persistedUpload)) {
      filePath = persistedUpload;
    } else if (resolve(bundledUpload).startsWith(bundledUploadRoot) && existsSync(bundledUpload)) {
      filePath = bundledUpload;
    }
  }

  const resolvedFilePath = resolve(filePath);
  if (!resolvedFilePath.startsWith(root) && !resolvedFilePath.startsWith(uploadRoot) && !resolvedFilePath.startsWith(bundledUploadRoot)) {
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
