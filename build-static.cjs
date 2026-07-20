const { cp, mkdir, rm } = require("fs/promises");
const { join } = require("path");

async function main() {
  const root = process.cwd();
  const source = join(root, "outputs", "vastravathi");
  const target = join(root, "public");

  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });

  const entries = [
    "index.html",
    "styles.css",
    "script.js",
    "vastravathi-logo.svg",
    "shipping.html",
    "returns.html",
    "privacy.html",
    "terms.html",
    "contact.html",
    "data",
    "uploads"
  ];

  for (const entry of entries) {
    await cp(join(source, entry), join(target, entry), { recursive: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
