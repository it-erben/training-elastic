require("dotenv").config();
const https = require("https");
const http = require("http");

const ELASTIC_URL = process.env.ELASTIC_URL;
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY;
const ELASTIC_USER = process.env.ELASTIC_USER;
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD;

if (!ELASTIC_URL) {
  console.error("Bitte ELASTIC_URL in .env setzen.");
  process.exit(1);
}

// --- HTTP helper ---
function elasticRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, ELASTIC_URL);
    const lib = url.protocol === "https:" ? https : http;
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
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
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

// --- Random data helpers ---
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randId(prefix, n) { return `${prefix}_${String(n).padStart(6, "0")}`; }
function randDate() {
  const now = Date.now();
  const fifteenMin = 15 * 60 * 1000;
  return new Date(now - Math.random() * fifteenMin).toISOString().replace(/\.\d{3}Z/, "+00:00");
}

const MERCHANTS = Array.from({ length: 20 }, (_, i) => ({
  id: randId("MRC", i + 1), object: "general.merchants",
  companyname: pick(["TechStore GmbH", "ModeHaus AG", "BioMarkt KG", "AutoTeile Schmidt",
    "Buchhandlung Werner", "SportShop Meier", "ElektroWelt", "GartenCenter Nord",
    "Apotheke am Markt", "Bäckerei Müller", "Café Sonnenschein", "Optik Fischer",
    "Juwelier Gold", "Reisebüro Fernweh", "Weinhandlung Keller", "Blumen Krause",
    "Schuhhaus Becker", "Spielwaren König", "Möbel Holz", "Pizza Roma"])
}));

const STORES = Array.from({ length: 30 }, (_, i) => ({
  id: randId("STO", i + 1), object: "general.stores",
  name: `Filiale ${pick(["Berlin", "München", "Hamburg", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dresden", "Nürnberg"])} ${randInt(1, 5)}`,
}));

const STATUSES = ["ok", "pending", "failed", "cancelled", "refunded"];
const PAYMENT_METHODS = ["creditcard", "debit", "paypal", "sofort", "invoice", "prepaid"];
const CATEGORIES = ["Lebensmittel", "Elektronik", "Bekleidung", "Haushalt", "Sport", "Bücher", "Spielwaren", "Auto", "Garten", "Gesundheit"];
const CURRENCIES = ["EUR", "EUR", "EUR", "CHF", "USD"];
const PRODUCTS = [
  { desc: "Wireless Kopfhörer Pro", ean: "4001234567890", articleNumber: "WKP-001", priceOne: 7999 },
  { desc: "Bio-Olivenöl 500ml", ean: "4009876543210", articleNumber: "BOO-500", priceOne: 899 },
  { desc: "Laufschuhe UltraFlex", ean: "4005551234567", articleNumber: "LSU-42", priceOne: 12999 },
  { desc: "Roman: Die letzte Reise", ean: "9783456789012", articleNumber: "BUC-4711", priceOne: 1999 },
  { desc: "Kaffeebohnen Arabica 1kg", ean: "4007778889990", articleNumber: "KBA-1000", priceOne: 1499 },
  { desc: "USB-C Ladekabel 2m", ean: "4002223334440", articleNumber: "UCL-200", priceOne: 1299 },
  { desc: "Gartenschere Premium", ean: "4006667778880", articleNumber: "GSP-01", priceOne: 3499 },
  { desc: "Vitamin D3 Tabletten", ean: "4001112223330", articleNumber: "VD3-90", priceOne: 1199 },
];

const RECEIPT_LINES = [
  { type: "separator", value: { text: "================================" } },
  { type: "name_value", value: { name: "Datum", value: "26.03.2026 14:23", decoration: "bold" } },
  { type: "name_value", value: { name: "Terminal", value: "T-00142", decoration: "normal" } },
  { type: "name_value", value: { name: "Beleg-Nr.", value: "000847123", decoration: "normal" } },
  { type: "name_value", value: { name: "Karte", value: "************1234", decoration: "normal" } },
  { type: "separator", value: { text: "--------------------------------" } },
  { type: "name_value", value: { name: "Betrag", value: "EUR 49,99", decoration: "bold" } },
  { type: "name_value", value: { name: "Autorisierung", value: "GENEHMIGT", decoration: "bold" } },
  { type: "separator", value: { text: "================================" } },
];

// --- Generate smarttransaction document ---
function genSmartTransaction(i) {
  const merchant = pick(MERCHANTS);
  const store = pick(STORES);
  const prods = Array.from({ length: randInt(1, 4) }, (_, j) => {
    const p = pick(PRODUCTS);
    const qty = randInt(1, 3);
    return {
      id: j, desc: p.desc, ean: p.ean, articleNumber: p.articleNumber,
      priceOne: p.priceOne, quantity: qty, sum: p.priceOne * qty, tax: Math.round(p.priceOne * qty * 0.19),
      item_type: "article", parent: 0, reference_id: randId("REF", randInt(1, 9999)),
      group: { id: randId("GRP", randInt(1, 20)), desc: pick(CATEGORIES), level: 1 },
    };
  });
  const total = prods.reduce((s, p) => s + p.sum, 0);
  const created = randDate();
  const forename = pick(["Anna", "Bernd", "Clara", "David", "Eva", "Frank", "Greta", "Hans", "Ida", "Jan"]);
  const surname = pick(["Müller", "Schmidt", "Weber", "Fischer", "Wagner", "Becker", "Hoffmann", "Schäfer", "Koch", "Bauer"]);
  const city = pick(["Berlin", "München", "Hamburg", "Köln", "Frankfurt"]);

  return {
    id: randId("STX", i),
    object: "smart.transactions",
    trans_id: 100000 + i,
    status: pick(STATUSES),
    created,
    updated: randDate(),
    merchant: { id: merchant.id, object: merchant.object, companyname: merchant.companyname },
    store: { id: store.id, object: "general.stores" },
    basket: { type: "default", products: prods },
    basket_info: { sum: total, currency: pick(CURRENCIES), gratuity: 0 },
    payment_method: pick(PAYMENT_METHODS),
    tax_amount: Math.round(total * 0.19),
    tax_rate: 19,
    intent: "sale",
    is_demo: false,
    customer: {
      id: randId("CUS", randInt(1, 500)), object: "payment.customers",
      contact: {
        forename, surname, name: `${forename} ${surname}`,
        email: `${forename.toLowerCase()}.${surname.toLowerCase()}@example.com`,
        phone: `+49${randInt(151, 179)}${randInt(1000000, 9999999)}`,
        salutation: pick(["Mr", "Mrs"]), gender: pick(["m", "f"]),
        address: {
          street: pick(["Hauptstraße", "Berliner Allee", "Goethestraße", "Schillerplatz", "Marktstraße"]),
          street_number: String(randInt(1, 200)),
          postal_code: String(randInt(10000, 99999)),
          city, country: "DE",
        },
      },
    },
    // Duplicated customer data in idents (this is the problem we want to show)
    idents: {
      customer: {
        id: randId("CUS", randInt(1, 500)), object: "payment.customers",
        forename, surname, name: `${forename} ${surname}`,
        email: `${forename.toLowerCase()}.${surname.toLowerCase()}@example.com`,
      },
      merchantcard: {
        id: randId("MCC", randInt(1, 1000)), object: "loyalty.merchantcards",
        card: { id: randId("CRD", randInt(1, 2000)), cardnumber: String(randInt(1000000000, 9999999999)), object: "loyalty.cards" },
        customer: {
          id: randId("CUS", randInt(1, 500)), object: "payment.customers",
          forename, surname, name: `${forename} ${surname}`,
          contact: {
            forename, surname, name: `${forename} ${surname}`,
            email: `${forename.toLowerCase()}.${surname.toLowerCase()}@example.com`,
            address: { street: "Hauptstraße", street_number: "1", postal_code: "10115", city, country: "DE" },
          },
        },
      },
    },
    // Receipt data (the big overhead we want to show)
    receipt: RECEIPT_LINES.map(l => ({ ...l })),
    receipt_merchant: RECEIPT_LINES.map(l => ({ ...l })),
    receipt_merchant_print: pick([true, false]),
    receipt_number: randInt(100000, 999999),
    container: {
      id: randId("PCT", randInt(1, 500)), object: "payment.containers", type: "credit_card",
      token_status: { status: "active", created: created, last_modified: created, version: 1 },
    },
    contract: { id: randId("GCT", randInt(1, 100)), object: "general.contracts" },
    device_source: { id: randId("SDV", randInt(1, 200)), object: "general.devices" },
    device_destination: { id: randId("SDV", randInt(1, 200)), object: "general.devices" },
    transactions: [{ id: randId("PTA", randInt(1, 5000)), object: "payment.transactions", trans_id: 200000 + i, transaction_hash: `hash_${randInt(100000, 999999)}` }],
    transactionRef: `REF-${randInt(100000, 999999)}`,
    merchantRef: `MREF-${randInt(10000, 99999)}`,
    // Application context with dual-mapped fields (text + keyword subfield)
    application_context: {
      language: "de",
      shop_details: {
        shop_system: "WooCommerce", shop_system_version: "8.2.1",
        shop_domain: `www.${merchant.companyname.toLowerCase().replace(/\s+/g, "-")}.de`,
        plugin_vendor: "secuconnect", plugin_version: "3.4.1",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    },
  };
}

// --- Generate loyaltytransaction document ---
function genLoyaltyTransaction(i) {
  const merchant = pick(MERCHANTS);
  const store = pick(STORES);
  const amount = randInt(100, 50000);
  const created = randDate();
  return {
    id: randId("LTX", i),
    object: "loyalty.transactions",
    trans_id: 300000 + i,
    status: pick(["ok", "pending", "cancelled"]),
    created,
    last_change: created,
    amount,
    balance: randInt(0, 100000),
    currency: "EUR",
    purpose: pick(["charge", "discharge", "sale", "cashreport"]),
    description: pick(["Punktesammlung", "Einlösung", "Bonus", "Storno", "Gutschrift"]),
    cleared: pick([true, false]),
    is_cancelling: 0,
    merchant: { id: merchant.id, object: merchant.object },
    origin_merchant: { id: merchant.id, object: merchant.object },
    store: { id: store.id, object: "general.stores", name: store.name, name_raw: store.name },
    origin_store: { id: store.id, object: "general.stores", name: store.name, name_raw: store.name },
    card: { id: randId("CRD", randInt(1, 2000)), cardnumber: String(randInt(1000000000, 9999999999)), object: "loyalty.cards" },
    cardgroup: { id: randId("CGR", randInt(1, 50)), display_name: pick(["Gold", "Silber", "Bronze", "Premium", "Standard"]), object: "loyalty.cardgroups", stock_warn_limit: 100 },
    merchantcard: { id: randId("MCC", randInt(1, 1000)), object: "loyalty.merchantcards" },
    tid: randId("TID", randInt(1, 500)),
    transaction: { id: randId("LTX", i), object: "loyalty.transactions" },
    children: [{ id: randId("LTX", randInt(1, 200)), object: "loyalty.transactions", trans_id: randInt(300000, 399999), ref_type_id: 1, relation_type: "child" }],
    parents: [],
    // additional_data with wrong types (all text via dynamic template)
    additional_data: {
      custom_fields: {
        business_type: pick(["retail", "gastro", "service", "automotive"]),
        category: pick(CATEGORIES),
        company_id: `CID-${randInt(10000, 99999)}`,
        debitor_number: `DEB-${randInt(100000, 999999)}`,
        invoice_number: `INV-2026-${randInt(10000, 99999)}`,
        invoice_date: `${randInt(1, 28)}.${randInt(1, 12)}.2026`, // Date as text - the problem!
        commission_number: `COM-${randInt(1000, 9999)}`,
      },
    },
    // Receipt with deep nesting
    receipt: {
      type: "default",
      body: RECEIPT_LINES.slice(0, 5).map(l => ({ type: l.type, value: l.value })),
      header: [{ type: "text", value: { text: "Loyalty Beleg", decoration: "bold" } }],
    },
    clearing_information: { id: randId("CLR", randInt(1, 1000)), object: "loyalty.clearings", date: created },
  };
}

// --- Generate generalstore document ---
function genGeneralStore(i) {
  const merchant = pick(MERCHANTS);
  const city = pick(["Berlin", "München", "Hamburg", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig"]);
  const lat = 47.3 + Math.random() * 7;
  const lon = 6.0 + Math.random() * 9;
  return {
    id: randId("STO", i),
    object: "general.stores",
    name: `${merchant.companyname} - ${city}`,
    name_raw: `${merchant.companyname} - ${city}`,
    store_name: `${merchant.companyname} - ${city}`,
    category: pick(CATEGORIES),       // text in original - should be keyword
    category_main: pick(["Einzelhandel", "Gastronomie", "Dienstleistung", "Handwerk"]),
    hash: `sha256_${randInt(100000000, 999999999)}`,  // text - should be keyword
    key: `store_key_${randInt(1000, 9999)}`,           // text - should be keyword
    source: pick(["api", "import", "manual", "migration"]),
    merchant: { id: merchant.id, object: merchant.object },
    address_formatted: `${pick(["Hauptstr.", "Berliner Allee", "Marktplatz"])} ${randInt(1, 100)}, ${randInt(10000, 99999)} ${city}`,
    address_components: {
      long_name: city, short_name: city.substring(0, 3).toUpperCase(),
      types: "locality",
    },
    geometry: { lat, lon },
    phone_number_formatted: `+49 ${randInt(30, 89)} ${randInt(1000000, 9999999)}`,
    url_website: `https://www.${merchant.companyname.toLowerCase().replace(/\s+/g, "-")}.de`,
    photo: `https://example.com/photos/store_${i}.jpg`,
    photo_main: `https://example.com/photos/store_${i}_main.jpg`,
    facebook_id: `fb_${randInt(100000, 999999)}`,
    acceptance_point: pick([true, false]),
    has_beacon: pick([true, false]),
    open_now: pick([true, false]),
    open_time: pick(["Mo-Fr 09:00-18:00", "Mo-Sa 08:00-20:00", "täglich 10:00-22:00"]),
    utc_offset: "+01:00",
    open_hours: {
      open: { day: 1, time: "09:00" },
      close: { day: 1, time: "18:00" },
    },
    assigned_by: { id: randId("USR", randInt(1, 50)), object: "general.users", owner: true },
    invited_by: { id: randId("USR", randInt(1, 50)), object: "general.users", invited: randDate() },
  };
}

// ============================================================
// MAPPINGS
// ============================================================

// Subset of the original smarttransactions mapping (showing the problems)
const SMART_MAPPING_ORIGINAL = {
  dynamic: "true",
  date_detection: false,
  properties: {
    id: { type: "keyword" },
    object: { type: "keyword" },
    trans_id: { type: "integer" },
    status: { type: "keyword" },
    created: { type: "date", format: "date_time_no_millis||strict_date_optional_time" },
    updated: { type: "date", format: "date_time_no_millis||strict_date_optional_time" },
    intent: { type: "text" }, // should be keyword
    is_demo: { type: "boolean" },
    payment_method: { type: "keyword" },
    tax_amount: { type: "integer" },
    tax_rate: { type: "integer" },
    receipt_number: { type: "integer" },
    receipt_merchant_print: { type: "boolean" },
    merchantRef: { type: "keyword" },
    transactionRef: { type: "keyword" },
    merchant: {
      properties: {
        id: { type: "keyword" },
        object: { type: "keyword" },
        companyname: { type: "text" }, // dual-map candidate
      }
    },
    store: {
      properties: {
        id: { type: "keyword" },
        object: { type: "keyword" },
      }
    },
    basket_info: {
      properties: {
        sum: { type: "integer" },
        currency: { type: "keyword" },
        gratuity: { type: "integer" },
      }
    },
    basket: {
      properties: {
        type: { type: "keyword" },
        products: {
          properties: {
            id: { type: "integer" },
            desc: { type: "text" },
            ean: { type: "keyword" },
            articleNumber: { type: "keyword" },
            priceOne: { type: "integer" },
            quantity: { type: "integer" },
            sum: { type: "integer" },
            tax: { type: "integer" },
            item_type: { type: "keyword" },
            parent: { type: "integer" },
            reference_id: { type: "keyword" },
            group: {
              properties: {
                id: { type: "keyword" },
                desc: { type: "text" },
                level: { type: "integer" },
              }
            },
          }
        }
      }
    },
    customer: {
      properties: {
        id: { type: "keyword" },
        object: { type: "keyword" },
        contact: {
          properties: {
            forename: { type: "text" },
            surname: { type: "text" },
            name: { type: "text" },
            email: { type: "text" },
            phone: { type: "text" },
            salutation: { type: "keyword" },
            gender: { type: "keyword" },
            address: {
              properties: {
                street: { type: "text" },
                street_number: { type: "text" },
                postal_code: { type: "text" },
                city: { type: "text" },
                country: { type: "text" },
              }
            }
          }
        }
      }
    },
    // DUPLICATED customer data in idents (the problem!)
    idents: {
      properties: {
        customer: {
          properties: {
            id: { type: "keyword" },
            object: { type: "keyword" },
            forename: { type: "text" },
            surname: { type: "text" },
            name: { type: "text" },
            email: { type: "text" },
          }
        },
        merchantcard: {
          properties: {
            id: { type: "keyword" },
            object: { type: "keyword" },
            card: {
              properties: {
                id: { type: "keyword" },
                cardnumber: { type: "text" },
                object: { type: "keyword" },
              }
            },
            customer: {
              properties: {
                id: { type: "keyword" },
                object: { type: "keyword" },
                forename: { type: "text" },
                surname: { type: "text" },
                name: { type: "text" },
                contact: {
                  properties: {
                    forename: { type: "text" },
                    surname: { type: "text" },
                    name: { type: "text" },
                    email: { type: "text" },
                    address: {
                      properties: {
                        street: { type: "text" },
                        street_number: { type: "text" },
                        postal_code: { type: "text" },
                        city: { type: "text" },
                        country: { type: "text" },
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    // Receipt (lots of fields, never searched)
    receipt: {
      properties: {
        type: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
        value: {
          properties: {
            name: { type: "text" },
            value: { type: "text" },
            text: { type: "keyword" },
            decoration: { type: "keyword" },
            caption: { type: "keyword" },
            data: { type: "keyword" },
          }
        }
      }
    },
    receipt_merchant: {
      properties: {
        type: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
        value: {
          properties: {
            name: { type: "text" },
            value: { type: "text" },
            text: { type: "keyword" },
            decoration: { type: "keyword" },
            caption: { type: "keyword" },
            data: { type: "keyword" },
          }
        }
      }
    },
    container: {
      properties: {
        id: { type: "keyword" },
        object: { type: "keyword" },
        type: { type: "text" }, // should be keyword
        token_status: {
          properties: {
            status: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
            created: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } }, // date as text!
            last_modified: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
            version: { type: "long" },
          }
        }
      }
    },
    contract: { properties: { id: { type: "keyword" }, object: { type: "keyword" } } },
    device_source: { properties: { id: { type: "keyword" }, object: { type: "keyword" } } },
    device_destination: { properties: { id: { type: "keyword" }, object: { type: "keyword" } } },
    transactions: {
      properties: {
        id: { type: "keyword" },
        object: { type: "keyword" },
        trans_id: { type: "integer" },
        transaction_hash: { type: "keyword" },
        reference_id: { type: "keyword" },
      }
    },
    application_context: {
      properties: {
        language: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
        shop_details: {
          properties: {
            shop_system: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
            shop_system_version: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
            shop_domain: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
            plugin_vendor: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
            plugin_version: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
            user_agent: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
          }
        }
      }
    },
  }
};

// OPTIMIZED smarttransactions mapping
const SMART_MAPPING_OPTIMIZED = {
  dynamic: "strict",
  date_detection: false,
  properties: {
    id: { type: "keyword" },
    object: { type: "keyword", index: false, doc_values: false },
    trans_id: { type: "integer" },
    status: { type: "keyword" },
    created: { type: "date", format: "date_time_no_millis||strict_date_optional_time" },
    updated: { type: "date", format: "date_time_no_millis||strict_date_optional_time" },
    intent: { type: "keyword" },
    is_demo: { type: "boolean" },
    payment_method: { type: "keyword" },
    tax_amount: { type: "integer" },
    tax_rate: { type: "integer" },
    receipt_number: { type: "integer" },
    receipt_merchant_print: { type: "boolean" },
    merchantRef: { type: "keyword", doc_values: false },
    transactionRef: { type: "keyword", doc_values: false },
    merchant: {
      properties: {
        id: { type: "keyword" },
        object: { type: "keyword", index: false, doc_values: false },
        companyname: { type: "keyword" },
      }
    },
    store: {
      properties: {
        id: { type: "keyword" },
        object: { type: "keyword", index: false, doc_values: false },
      }
    },
    basket_info: {
      properties: {
        sum: { type: "integer" },
        currency: { type: "keyword" },
        gratuity: { type: "integer" },
      }
    },
    basket: {
      properties: {
        type: { type: "keyword" },
        products: {
          properties: {
            id: { type: "integer" },
            desc: { type: "text" },
            ean: { type: "keyword" },
            articleNumber: { type: "keyword" },
            priceOne: { type: "integer" },
            quantity: { type: "integer" },
            sum: { type: "integer" },
            tax: { type: "integer" },
            item_type: { type: "keyword" },
            parent: { type: "integer" },
            reference_id: { type: "keyword", doc_values: false },
            group: {
              properties: {
                id: { type: "keyword", doc_values: false },
                desc: { type: "keyword" }, // was text
                level: { type: "integer" },
              }
            },
          }
        }
      }
    },
    customer: {
      properties: {
        id: { type: "keyword" },
        object: { type: "keyword", index: false, doc_values: false },
        contact: {
          properties: {
            forename: { type: "keyword" },
            surname: { type: "keyword" },
            name: { type: "text" }, // keep text for full-name search
            email: { type: "keyword" },
            phone: { type: "keyword" },
            salutation: { type: "keyword" },
            gender: { type: "keyword" },
            address: {
              properties: {
                street: { type: "keyword" },
                street_number: { type: "keyword" },
                postal_code: { type: "keyword" },
                city: { type: "keyword" },
                country: { type: "keyword" },
              }
            }
          }
        }
      }
    },
    // idents: Only keep the IDs, rest goes to enabled: false
    idents: {
      properties: {
        customer: { type: "object", enabled: false },
        merchantcard: {
          properties: {
            id: { type: "keyword", doc_values: false },
            object: { type: "keyword", index: false, doc_values: false },
            card: {
              properties: {
                id: { type: "keyword", doc_values: false },
                cardnumber: { type: "keyword", doc_values: false },
                object: { type: "keyword", index: false, doc_values: false },
              }
            },
            // customer data NOT indexed - stays in _source
            customer: { type: "object", enabled: false },
          }
        }
      }
    },
    // Receipts: enabled: false (stored but not indexed)
    receipt: { type: "object", enabled: false },
    receipt_merchant: { type: "object", enabled: false },
    // Container: fix date types
    container: {
      properties: {
        id: { type: "keyword", doc_values: false },
        object: { type: "keyword", index: false, doc_values: false },
        type: { type: "keyword" },
        token_status: {
          properties: {
            status: { type: "keyword" },
            created: { type: "date", format: "date_time_no_millis||strict_date_optional_time" },
            last_modified: { type: "date", format: "date_time_no_millis||strict_date_optional_time" },
            version: { type: "long" },
          }
        }
      }
    },
    contract: { properties: { id: { type: "keyword", doc_values: false }, object: { type: "keyword", index: false, doc_values: false } } },
    device_source: { properties: { id: { type: "keyword", doc_values: false }, object: { type: "keyword", index: false, doc_values: false } } },
    device_destination: { properties: { id: { type: "keyword", doc_values: false }, object: { type: "keyword", index: false, doc_values: false } } },
    transactions: {
      properties: {
        id: { type: "keyword", doc_values: false },
        object: { type: "keyword", index: false, doc_values: false },
        trans_id: { type: "integer" },
        transaction_hash: { type: "keyword", doc_values: false },
      }
    },
    // Application context: keyword only, no dual mapping
    application_context: {
      properties: {
        language: { type: "keyword" },
        shop_details: {
          properties: {
            shop_system: { type: "keyword" },
            shop_system_version: { type: "keyword" },
            shop_domain: { type: "keyword" },
            plugin_vendor: { type: "keyword" },
            plugin_version: { type: "keyword" },
            user_agent: { type: "keyword" },
          }
        }
      }
    },
  }
};

// generalstores original (showing text-where-keyword problems)
const STORES_MAPPING_ORIGINAL = {
  properties: {
    id: { type: "keyword" },
    object: { type: "keyword" },
    name: { type: "text" },
    name_raw: { type: "keyword" },
    store_name: { type: "text" },
    category: { type: "text" },           // PROBLEM: should be keyword
    category_main: { type: "text" },      // PROBLEM: should be keyword
    hash: { type: "text" },               // PROBLEM
    key: { type: "text" },                // PROBLEM
    source: { type: "text" },             // PROBLEM
    merchant: { properties: { id: { type: "keyword" }, object: { type: "keyword" } } },
    address_formatted: { type: "text" },
    address_components: { properties: { long_name: { type: "text" }, short_name: { type: "text" }, types: { type: "text" } } },
    geometry: { type: "geo_point" },
    phone_number_formatted: { type: "text" },  // PROBLEM
    url_website: { type: "text" },             // PROBLEM
    photo: { type: "keyword" },
    photo_main: { type: "keyword" },
    facebook_id: { type: "keyword" },
    acceptance_point: { type: "boolean" },
    has_beacon: { type: "boolean" },
    open_now: { type: "boolean" },
    open_time: { type: "text" },               // PROBLEM
    utc_offset: { type: "text" },              // PROBLEM
    open_hours: { properties: { open: { properties: { day: { type: "integer" }, time: { type: "text" } } }, close: { properties: { day: { type: "integer" }, time: { type: "text" } } } } },
    assigned_by: { properties: { id: { type: "keyword" }, object: { type: "keyword" }, owner: { type: "boolean" } } },
    invited_by: { properties: { id: { type: "keyword" }, object: { type: "keyword" }, invited: { type: "keyword" } } },
  }
};

// generalstores optimized
const STORES_MAPPING_OPTIMIZED = {
  dynamic: "strict",
  properties: {
    id: { type: "keyword" },
    object: { type: "keyword", index: false, doc_values: false },
    name: { type: "text" },  // keep text for search
    name_raw: { type: "keyword" },
    store_name: { type: "keyword" },
    category: { type: "keyword" },
    category_main: { type: "keyword" },
    hash: { type: "keyword", doc_values: false },
    key: { type: "keyword", doc_values: false },
    source: { type: "keyword" },
    merchant: { properties: { id: { type: "keyword" }, object: { type: "keyword", index: false, doc_values: false } } },
    address_formatted: { type: "text" },
    address_components: { properties: { long_name: { type: "keyword" }, short_name: { type: "keyword" }, types: { type: "keyword" } } },
    geometry: { type: "geo_point" },
    phone_number_formatted: { type: "keyword" },
    url_website: { type: "keyword", doc_values: false },
    photo: { type: "keyword", index: false, doc_values: false },
    photo_main: { type: "keyword", index: false, doc_values: false },
    facebook_id: { type: "keyword", doc_values: false },
    acceptance_point: { type: "boolean" },
    has_beacon: { type: "boolean" },
    open_now: { type: "boolean" },
    open_time: { type: "keyword" },
    utc_offset: { type: "keyword" },
    open_hours: { properties: { open: { properties: { day: { type: "integer" }, time: { type: "keyword" } } }, close: { properties: { day: { type: "integer" }, time: { type: "keyword" } } } } },
    assigned_by: { properties: { id: { type: "keyword", doc_values: false }, object: { type: "keyword", index: false, doc_values: false }, owner: { type: "boolean" } } },
    invited_by: { properties: { id: { type: "keyword", doc_values: false }, object: { type: "keyword", index: false, doc_values: false }, invited: { type: "keyword" } } },
  }
};

// loyaltytransactions original
const LOYALTY_MAPPING_ORIGINAL = {
  dynamic_templates: [
    { template_1: { path_match: "additional_data.*", match_mapping_type: "string", mapping: { type: "text" } } },
  ],
  date_detection: false,
  properties: {
    id: { type: "keyword" },
    object: { type: "keyword" },
    trans_id: { type: "integer" },
    status: { type: "keyword" },
    created: { type: "date", format: "date_time_no_millis||strict_date_optional_time" },
    last_change: { type: "date", format: "date_time_no_millis||strict_date_optional_time" },
    amount: { type: "integer" },
    balance: { type: "integer" },
    currency: { type: "keyword" },
    purpose: { type: "keyword" },
    description: { type: "keyword" },
    cleared: { type: "boolean" },
    is_cancelling: { type: "integer" },
    merchant: { properties: { id: { type: "keyword" }, object: { type: "keyword" } } },
    origin_merchant: { properties: { id: { type: "keyword" }, object: { type: "keyword" } } },
    store: { properties: { id: { type: "keyword" }, object: { type: "keyword" }, name: { type: "text" }, name_raw: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } } } },
    origin_store: { properties: { id: { type: "keyword" }, object: { type: "keyword" }, name: { type: "text" }, name_raw: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } } } },
    card: { properties: { id: { type: "keyword" }, cardnumber: { type: "keyword" }, object: { type: "keyword" } } },
    cardgroup: { properties: { id: { type: "keyword" }, display_name: { type: "text" }, object: { type: "keyword" }, stock_warn_limit: { type: "integer" } } },
    merchantcard: { properties: { id: { type: "keyword" }, object: { type: "keyword" } } },
    tid: { type: "keyword" },
    transaction: { properties: { id: { type: "keyword" }, object: { type: "keyword" } } },
    children: { properties: { id: { type: "keyword" }, object: { type: "keyword" }, trans_id: { type: "integer" }, ref_type_id: { type: "integer" }, relation_type: { type: "keyword" } } },
    parents: { properties: { id: { type: "keyword" }, object: { type: "keyword" }, trans_id: { type: "integer" }, ref_type_id: { type: "integer" }, relation_type: { type: "keyword" } } },
    receipt: {
      properties: {
        type: { type: "keyword" },
        body: { properties: { type: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } }, value: { properties: { name: { type: "text" }, value: { type: "text" }, text: { type: "keyword" }, decoration: { type: "keyword" }, caption: { type: "keyword" } } } } },
        header: { properties: { type: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } }, value: { properties: { text: { type: "text" }, decoration: { type: "keyword" } } } } },
      }
    },
    clearing_information: { properties: { id: { type: "keyword" }, object: { type: "keyword" }, date: { type: "date", format: "date_time_no_millis||strict_date_optional_time" } } },
  }
};

// loyaltytransactions optimized
const LOYALTY_MAPPING_OPTIMIZED = {
  dynamic: "strict",
  date_detection: false,
  properties: {
    id: { type: "keyword" },
    object: { type: "keyword", index: false, doc_values: false },
    trans_id: { type: "integer" },
    status: { type: "keyword" },
    created: { type: "date", format: "date_time_no_millis||strict_date_optional_time" },
    last_change: { type: "date", format: "date_time_no_millis||strict_date_optional_time" },
    amount: { type: "integer" },
    balance: { type: "integer" },
    currency: { type: "keyword" },
    purpose: { type: "keyword" },
    description: { type: "keyword" },
    cleared: { type: "boolean" },
    is_cancelling: { type: "integer" },
    merchant: { properties: { id: { type: "keyword" }, object: { type: "keyword", index: false, doc_values: false } } },
    origin_merchant: { properties: { id: { type: "keyword" }, object: { type: "keyword", index: false, doc_values: false } } },
    store: { properties: { id: { type: "keyword" }, object: { type: "keyword", index: false, doc_values: false }, name: { type: "keyword" }, name_raw: { type: "keyword" } } },
    origin_store: { properties: { id: { type: "keyword" }, object: { type: "keyword", index: false, doc_values: false }, name: { type: "keyword" }, name_raw: { type: "keyword" } } },
    card: { properties: { id: { type: "keyword", doc_values: false }, cardnumber: { type: "keyword", doc_values: false }, object: { type: "keyword", index: false, doc_values: false } } },
    cardgroup: { properties: { id: { type: "keyword" }, display_name: { type: "keyword" }, object: { type: "keyword", index: false, doc_values: false }, stock_warn_limit: { type: "integer" } } },
    merchantcard: { properties: { id: { type: "keyword", doc_values: false }, object: { type: "keyword", index: false, doc_values: false } } },
    tid: { type: "keyword", doc_values: false },
    transaction: { properties: { id: { type: "keyword", doc_values: false }, object: { type: "keyword", index: false, doc_values: false } } },
    children: { properties: { id: { type: "keyword", doc_values: false }, object: { type: "keyword", index: false, doc_values: false }, trans_id: { type: "integer" }, ref_type_id: { type: "integer" }, relation_type: { type: "keyword" } } },
    parents: { properties: { id: { type: "keyword", doc_values: false }, object: { type: "keyword", index: false, doc_values: false }, trans_id: { type: "integer" }, ref_type_id: { type: "integer" }, relation_type: { type: "keyword" } } },
    // additional_data with correct types
    additional_data: {
      properties: {
        custom_fields: {
          properties: {
            business_type: { type: "keyword" },
            category: { type: "keyword" },
            company_id: { type: "keyword", doc_values: false },
            debitor_number: { type: "keyword", doc_values: false },
            invoice_number: { type: "keyword", doc_values: false },
            invoice_date: { type: "keyword" }, // ideally date, but format varies
            commission_number: { type: "keyword", doc_values: false },
          }
        }
      }
    },
    // Receipt: enabled: false
    receipt: { type: "object", enabled: false },
    clearing_information: { properties: { id: { type: "keyword", doc_values: false }, object: { type: "keyword", index: false, doc_values: false }, date: { type: "date", format: "date_time_no_millis||strict_date_optional_time" } } },
  }
};

// ============================================================
// MAIN
// ============================================================

const INDICES = [
  { name: "demo-smarttransactions", mapping: SMART_MAPPING_ORIGINAL, gen: genSmartTransaction, count: 200 },
  { name: "demo-smarttransactions-optimized", mapping: SMART_MAPPING_OPTIMIZED, gen: genSmartTransaction, count: 200 },
  { name: "demo-generalstores", mapping: STORES_MAPPING_ORIGINAL, gen: genGeneralStore, count: 50 },
  { name: "demo-generalstores-optimized", mapping: STORES_MAPPING_OPTIMIZED, gen: genGeneralStore, count: 50 },
  { name: "demo-loyaltytransactions", mapping: LOYALTY_MAPPING_ORIGINAL, gen: genLoyaltyTransaction, count: 200 },
  { name: "demo-loyaltytransactions-optimized", mapping: LOYALTY_MAPPING_OPTIMIZED, gen: genLoyaltyTransaction, count: 200 },
];

function countMappingFields(obj) {
  let count = 0;
  if (obj.properties) {
    for (const [, v] of Object.entries(obj.properties)) {
      count++;
      count += countMappingFields(v);
      if (v.fields) count += Object.keys(v.fields).length;
    }
  }
  return count;
}

async function setupIndex({ name, mapping, gen, count }) {
  // Delete if exists
  await elasticRequest("DELETE", `/${name}`);

  // Create with mapping
  const createRes = await elasticRequest("PUT", `/${name}`, { mappings: mapping });
  if (createRes.status >= 400) {
    console.error(`  FEHLER beim Erstellen von ${name}:`, JSON.stringify(createRes.body, null, 2));
    return;
  }
  console.log(`  ✓ Index ${name} erstellt (${countMappingFields(mapping)} Felder im Mapping)`);

  // Bulk index data
  const BATCH = 100;
  for (let start = 1; start <= count; start += BATCH) {
    const end = Math.min(start + BATCH - 1, count);
    let bulkBody = "";
    for (let i = start; i <= end; i++) {
      const doc = gen(i);
      const docId = doc.id;
      bulkBody += JSON.stringify({ index: { _index: name, _id: docId } }) + "\n";
      bulkBody += JSON.stringify(doc) + "\n";
    }
    const bulkRes = await elasticRequest("POST", "/_bulk", bulkBody);
    if (bulkRes.body.errors) {
      const firstError = bulkRes.body.items.find(it => it.index.error);
      console.error(`  FEHLER beim Indexieren in ${name}:`, JSON.stringify(firstError.index.error, null, 2));
      return;
    }
    console.log(`  ✓ ${end} / ${count} Dokumente indexiert`);
  }
}

async function main() {
  console.log("=== Workshop Demo Setup ===\n");
  console.log(`Elastic URL: ${ELASTIC_URL}`);

  // Test connection
  const info = await elasticRequest("GET", "/");
  if (info.status >= 400) {
    console.error("Verbindung fehlgeschlagen. Bitte URL und API Key prüfen.");
    console.error(JSON.stringify(info.body, null, 2));
    process.exit(1);
  }
  console.log(`Verbunden mit Elasticsearch ${info.body.version?.number || "(Serverless)"}\n`);

  for (const idx of INDICES) {
    console.log(`\n--- ${idx.name} ---`);
    await setupIndex(idx);
  }

  // Wait for refresh
  await elasticRequest("POST", "/demo-*/_refresh");

  // Print summary
  console.log("\n\n=== Zusammenfassung ===\n");
  const catRes = await elasticRequest("GET", "/_cat/indices/demo-*?format=json&s=index");
  if (Array.isArray(catRes.body)) {
    console.log("Index                                  | Docs  | Größe");
    console.log("---------------------------------------|-------|-------");
    for (const idx of catRes.body) {
      const name = (idx.index || "").padEnd(38);
      const docs = (idx["docs.count"] || "").toString().padStart(5);
      const size = idx["store.size"] || idx["pri.store.size"] || "?";
      console.log(`${name} | ${docs} | ${size}`);
    }
  }

  // Count fields per mapping
  console.log("\nFelder im Mapping:");
  for (const idx of INDICES) {
    const mapRes = await elasticRequest("GET", `/${idx.name}/_mapping`);
    const mappings = mapRes.body[idx.name]?.mappings || {};
    console.log(`  ${idx.name}: ${countMappingFields(mappings)} Felder`);
  }

  console.log("\n✓ Setup abgeschlossen. Öffne Kibana Dev Tools für die Demo.");
  console.log("  Vergiss nicht, unter Stack Management → Data Views einen Data View für demo-* anzulegen.\n");
}

main().catch(err => {
  console.error("Fehler:", err);
  process.exit(1);
});
