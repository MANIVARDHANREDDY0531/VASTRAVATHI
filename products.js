const { readFile } = require("fs/promises");
const { join } = require("path");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const productsPath = join(process.cwd(), "data", "products.json");
    const products = JSON.parse(await readFile(productsPath, "utf8"));
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Products could not be loaded." });
  }
};
