require("dotenv").config();
const https = require("https");
const http = require("http");

const ELASTIC_URL = process.env.ELASTIC_URL;
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY;
const ELASTIC_USER = process.env.ELASTIC_USER;
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD;

function elasticRequest(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, ELASTIC_URL);
    const lib = url.protocol === "https:" ? https : http;
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        ...(ELASTIC_API_KEY
          ? { "Authorization": `ApiKey ${ELASTIC_API_KEY}` }
          : ELASTIC_USER
            ? { "Authorization": `Basic ${Buffer.from(`${ELASTIC_USER}:${ELASTIC_PASSWORD}`).toString("base64")}` }
            : {}),
      },
      rejectUnauthorized: process.env.ELASTIC_TLS_VERIFY !== "false",
    };
    const req = lib.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.end();
  });
}

const INDICES = [
  "demo-smarttransactions",
  "demo-smarttransactions-optimized",
  "demo-generalstores",
  "demo-generalstores-optimized",
  "demo-loyaltytransactions",
  "demo-loyaltytransactions-optimized",
];

async function main() {
  console.log("Lösche demo-Indices...\n");
  for (const name of INDICES) {
    const res = await elasticRequest("DELETE", `/${name}`);
    if (res.status === 200 || res.status === 404) {
      console.log(`  ✓ ${name} gelöscht`);
    } else {
      console.log(`  ✗ ${name}: ${res.body}`);
    }
  }
  console.log("\n✓ Aufgeräumt.");
}

main().catch(console.error);
