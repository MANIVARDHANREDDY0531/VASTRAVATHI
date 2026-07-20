module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const order = req.body || {};
  if (!Array.isArray(order.items) || !order.items.length) {
    res.status(400).json({ error: "Order must include at least one item." });
    return;
  }

  res.status(201).json({
    id: `order_${Date.now().toString(36)}`,
    status: "Pending",
    shipmentStatus: order.payment?.mode === "prepaid" ? "Awaiting Razorpay payment" : "Ready for Shiprocket COD",
    createdAt: new Date().toISOString(),
    ...order
  });
};
