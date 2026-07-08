#!/usr/bin/env node
// Deterministischer Log-Generator für die Tag-2-Übungen (Filebeat/Logstash).
//
// Erzeugt drei Log-Dateien in environment/data/:
//   apache-access.log   ~10.000 Zeilen Combined Log Format (Grok/Geoip-Lab)
//   java-app.log        ~2.000 Zeilen Log4j-Format inkl. Multiline-Stacktraces
//   app-json.log        ~5.000 Zeilen NDJSON (ecs-logging-Stil)
//
// Inhalte sind seeded und damit reproduzierbar; nur die Timestamps hängen
// vom Endzeitpunkt ab (Standard: jetzt, Zeitraum: letzte 48 Stunden).
//
// Nutzung:
//   node generate.js                          # Timestamps bis "jetzt"
//   node generate.js --end 2026-07-02T12:00Z  # fixer Endzeitpunkt (reproduzierbar)
//   node generate.js --out /pfad/zum/ziel

const fs = require("fs");
const path = require("path");

// --- Argumente ---
const args = process.argv.slice(2);
function argValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const END = argValue("--end") ? new Date(argValue("--end")).getTime() : Date.now();
const START = END - 48 * 60 * 60 * 1000;
const OUT_DIR = argValue("--out") || path.resolve(__dirname, "../../environment/data");

if (Number.isNaN(END)) {
  console.error("Ungültiger --end Zeitpunkt.");
  process.exit(1);
}

// --- Seeded RNG (mulberry32) ---
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260702);
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
function randInt(min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
function weighted(entries) {
  // entries: [[wert, gewicht], ...]
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of entries) {
    r -= w;
    if (r <= 0) return v;
  }
  return entries[entries.length - 1][0];
}

// Monoton steigende Timestamps über den Zeitraum verteilen
function timestamps(count) {
  const range = END - START;
  const step = range / count;
  const result = [];
  let t = START;
  for (let i = 0; i < count; i++) {
    t += step * (0.2 + rng() * 1.6); // Jitter, bleibt monoton
    result.push(Math.min(Math.round(t), END));
  }
  return result;
}

// --- Gemeinsame Basisdaten (Mustertech GmbH Online-Elektronikshop) ---

// Öffentliche IP-Bereiche echter ISPs/Anbieter, damit der Geoip-Filter
// Treffer liefert (Doku-Bereiche wie 192.0.2.x haben KEINE Geo-Daten).
// Letztes Oktett wird variiert, Region bleibt stabil.
const IP_POOLS = [
  // [Basis-Präfix, Gewicht] - DE/EU bewusst übergewichtet (deutscher Shop)
  ["91.12.34.", 18],    // DE, Deutsche Telekom
  ["84.163.72.", 12],   // DE, Deutsche Telekom
  ["217.224.10.", 8],   // DE, Deutsche Telekom
  ["77.20.55.", 8],     // DE, Vodafone
  ["90.63.120.", 5],    // FR, Orange
  ["81.46.30.", 4],     // ES, Telefónica
  ["87.11.40.", 4],     // IT, TIM
  ["83.5.201.", 4],     // PL, Orange Polska
  ["62.45.100.", 3],    // NL
  ["212.58.244.", 3],   // GB
  ["8.8.8.", 4],        // US, Google
  ["4.2.2.", 3],        // US, Level3
  ["24.48.100.", 2],    // CA, Vidéotron
  ["200.160.2.", 2],    // BR
  ["210.155.140.", 2],  // JP
  ["1.128.20.", 2],     // AU, Telstra
  ["117.192.60.", 2],   // IN, BSNL
  ["196.25.80.", 1],    // ZA, Telkom
];
function randomIp() {
  const prefix = weighted(IP_POOLS);
  return prefix + randInt(1, 254);
}

const SHOP_PATHS = [
  ["/", 10],
  ["/produkte", 12],
  ["/produkte/smartphones", 8],
  ["/produkte/laptops", 8],
  ["/produkte/tablets", 5],
  ["/produkte/zubehoer", 5],
  ["/produkte/smart-home", 4],
  ["/artikel/MT-10234", 6],
  ["/artikel/MT-20871", 5],
  ["/artikel/MT-33019", 4],
  ["/suche?q=usb-c+kabel", 4],
  ["/suche?q=notebook", 3],
  ["/warenkorb", 6],
  ["/checkout", 4],
  ["/checkout/zahlung", 3],
  ["/konto/bestellungen", 3],
  ["/api/v1/produkte", 5],
  ["/api/v1/warenkorb", 4],
  ["/api/v1/bestellungen", 3],
  ["/static/css/shop.css", 4],
  ["/static/js/app.js", 4],
  ["/favicon.ico", 2],
];

const USER_AGENTS = [
  ['"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"', 30],
  ['"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15"', 12],
  ['"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0"', 10],
  ['"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"', 15],
  ['"Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"', 12],
  ['"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"', 4],
  ['"Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"', 2],
  ['"curl/8.6.0"', 2],
];

const REFERERS = [
  ['"-"', 30],
  ['"https://www.google.com/"', 15],
  ['"https://www.mustertech-shop.de/"', 20],
  ['"https://www.mustertech-shop.de/produkte"', 10],
  ['"https://www.bing.com/"', 3],
  ['"https://www.idealo.de/"', 4],
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function apacheTime(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${MONTHS[d.getUTCMonth()]}/${d.getUTCFullYear()}:${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`;
}
function log4jTime(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())},${String(d.getUTCMilliseconds()).padStart(3, "0")}`;
}

// Fehler-Burst (Lab 07 Bonus / Alerting-Story): ~4 Stunden vor Ende,
// 60 Minuten lang -- kräftig genug, um im Dashboard als Block aufzufallen
const BURST_START = END - 4 * 60 * 60 * 1000;
const BURST_END = BURST_START + 60 * 60 * 1000;
function inBurst(ms) { return ms >= BURST_START && ms <= BURST_END; }

// --- 1. Apache Access Log (Combined Log Format) ---
function generateApache(count) {
  const lines = [];
  for (const ts of timestamps(count)) {
    const pathAndQuery = weighted(SHOP_PATHS);
    const method = pathAndQuery.startsWith("/api/") && rng() < 0.3 ? "POST" : weighted([["GET", 90], ["POST", 7], ["HEAD", 3]]);
    let status;
    if (inBurst(ts) && (pathAndQuery.startsWith("/checkout") || pathAndQuery.startsWith("/api/") || pathAndQuery.startsWith("/warenkorb"))) {
      status = weighted([[500, 70], [503, 25], [200, 5]]);
    } else {
      status = weighted([[200, 82], [301, 3], [304, 5], [404, 6], [403, 1], [500, 2], [503, 1]]);
    }
    let bytes = status === 304 ? 0 : randInt(180, 48000);
    // Jede 300. erfolgreiche Antwort bekommt exakt 404 Bytes -- damit die
    // Lab-05-Übung "message: 404 trifft auch Nicht-Statuscodes" real
    // demonstrierbar ist (bewusst ohne RNG, hält die Sequenz stabil).
    if (status === 200 && lines.length % 300 === 0) bytes = 404;
    lines.push(
      `${randomIp()} - - [${apacheTime(ts)}] "${method} ${pathAndQuery} HTTP/1.1" ${status} ${bytes} ${weighted(REFERERS)} ${weighted(USER_AGENTS)}`
    );
  }
  return lines.join("\n") + "\n";
}

// --- 2. Java-Anwendungslog (Log4j-Pattern, Multiline-Stacktraces) ---
const JAVA_LOGGERS = [
  "com.mustertech.shop.order.OrderService",
  "com.mustertech.shop.order.OrderController",
  "com.mustertech.shop.catalog.ProductService",
  "com.mustertech.shop.cart.CartService",
  "com.mustertech.shop.payment.PaymentClient",
  "com.mustertech.shop.inventory.StockChecker",
  "com.mustertech.shop.config.CacheWarmup",
];
const JAVA_THREADS = ["http-nio-8080-exec-1", "http-nio-8080-exec-4", "http-nio-8080-exec-7", "scheduler-2", "kafka-listener-0", "main"];
const JAVA_INFO = [
  "Bestellung {ORDER} erfolgreich angelegt (3 Positionen, Summe 249,90 EUR)",
  "Bestellung {ORDER} an Versanddienstleister übergeben",
  "Produktkatalog-Cache aktualisiert: 12841 Artikel in 3421 ms",
  "Zahlung für Bestellung {ORDER} autorisiert (PSP-Referenz {REF})",
  "Lagerbestand für Artikel MT-{SKU} aktualisiert: 42 -> 41",
  "Kundenkonto k-{USER} angemeldet",
  "Warenkorb w-{USER} zusammengeführt nach Login",
  "Empfehlungsmodell neu geladen (Version 2026-06-30)",
];
const JAVA_WARN = [
  "Langsame Datenbankabfrage: findOrdersByCustomer dauerte 2841 ms (Schwellwert 1000 ms)",
  "Retry 2/3 für PSP-Aufruf, vorheriger Versuch mit Timeout nach 5000 ms",
  "Artikel MT-{SKU} hat negativen Sicherheitsbestand, prüfe Nachbestellung",
  "Cache-Miss-Rate über 40% in den letzten 5 Minuten",
  "Deprecation: Endpoint /api/v0/produkte wird am 30.09. abgeschaltet, Aufrufer 10.20.30.{OCT}",
];

const STACKTRACES = [
  {
    head: 'Unerwarteter Fehler bei Bestellung {ORDER}',
    ex: [
      "java.lang.NullPointerException: Cannot invoke \"com.mustertech.shop.customer.Address.getZipCode()\" because the return value of \"com.mustertech.shop.customer.Customer.getShippingAddress()\" is null",
      "\tat com.mustertech.shop.order.OrderService.calculateShipping(OrderService.java:187)",
      "\tat com.mustertech.shop.order.OrderService.placeOrder(OrderService.java:102)",
      "\tat com.mustertech.shop.order.OrderController.create(OrderController.java:58)",
      "\tat jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103)",
      "\tat org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:255)",
      "\tat org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166)",
      "\tat java.base/java.lang.Thread.run(Thread.java:1583)",
    ],
    logger: "com.mustertech.shop.order.OrderService",
  },
  {
    head: "Datenbankverbindung fehlgeschlagen, Transaktion wird zurückgerollt",
    ex: [
      "org.springframework.dao.DataAccessResourceFailureException: Unable to acquire JDBC Connection",
      "\tat org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:275)",
      "\tat com.mustertech.shop.order.OrderRepository.save(OrderRepository.java:44)",
      "\tat com.mustertech.shop.order.OrderService.placeOrder(OrderService.java:110)",
      "Caused by: java.sql.SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30000ms",
      "\tat com.zaxxer.hikari.pool.HikariPool.createTimeoutException(HikariPool.java:696)",
      "\tat com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:181)",
      "\t... 12 more",
      "Caused by: java.net.ConnectException: Connection refused",
      "\tat java.base/sun.nio.ch.Net.pollConnect(Native Method)",
      "\tat java.base/java.net.Socket.connect(Socket.java:751)",
      "\t... 18 more",
    ],
    logger: "com.mustertech.shop.order.OrderService",
  },
  {
    head: "PSP-Aufruf für Bestellung {ORDER} endgültig fehlgeschlagen (3/3 Versuche)",
    ex: [
      "com.mustertech.shop.payment.PaymentException: Zahlungsanbieter nicht erreichbar",
      "\tat com.mustertech.shop.payment.PaymentClient.authorize(PaymentClient.java:93)",
      "\tat com.mustertech.shop.checkout.CheckoutService.completeOrder(CheckoutService.java:71)",
      "Caused by: java.net.http.HttpTimeoutException: request timed out",
      "\tat java.net.http/jdk.internal.net.http.HttpClientImpl.send(HttpClientImpl.java:966)",
      "\tat com.mustertech.shop.payment.PaymentClient.doRequest(PaymentClient.java:141)",
      "\t... 9 more",
    ],
    logger: "com.mustertech.shop.payment.PaymentClient",
  },
  {
    head: "Ungültige Anfrage abgewiesen",
    ex: [
      "java.lang.IllegalArgumentException: Menge muss größer 0 sein, war: -2 (Artikel MT-{SKU})",
      "\tat com.mustertech.shop.cart.CartService.addItem(CartService.java:66)",
      "\tat com.mustertech.shop.cart.CartController.add(CartController.java:39)",
      "\tat java.base/java.lang.Thread.run(Thread.java:1583)",
    ],
    logger: "com.mustertech.shop.cart.CartService",
  },
];

function fill(template) {
  return template
    .replace("{ORDER}", `B-2026-${randInt(100000, 999999)}`)
    .replace("{REF}", `psp_${randInt(10000000, 99999999)}`)
    .replace(/\{SKU\}/g, String(randInt(10000, 39999)))
    .replace("{USER}", String(randInt(1000, 99999)))
    .replace("{OCT}", String(randInt(1, 254)));
}

function generateJava(count, stacktraceCount) {
  // Positionen der Stacktraces gleichmäßig über die Datei streuen
  const stackAt = new Set();
  while (stackAt.size < stacktraceCount) stackAt.add(randInt(0, count - 1));

  const lines = [];
  const tss = timestamps(count);
  for (let i = 0; i < count; i++) {
    const ts = tss[i];
    if (stackAt.has(i)) {
      const st = pick(STACKTRACES);
      lines.push(`${log4jTime(ts)} ERROR [${pick(JAVA_THREADS)}] ${st.logger} - ${fill(st.head)}`);
      for (const l of st.ex) lines.push(fill(l));
      continue;
    }
    const inB = inBurst(ts);
    const level = weighted(inB ? [["INFO", 40], ["WARN", 35], ["ERROR", 25]] : [["INFO", 78], ["WARN", 14], ["DEBUG", 6], ["ERROR", 2]]);
    let msg;
    if (level === "WARN") msg = fill(pick(JAVA_WARN));
    else if (level === "ERROR") msg = fill("Bestellung {ORDER} konnte nicht abgeschlossen werden: Zahlungsanbieter meldet Fehler 502");
    else if (level === "DEBUG") msg = fill("Preisberechnung für Warenkorb w-{USER}: 4 Positionen, 2 Rabattregeln angewendet");
    else msg = fill(pick(JAVA_INFO));
    lines.push(`${log4jTime(ts)} ${level} [${pick(JAVA_THREADS)}] ${pick(JAVA_LOGGERS)} - ${msg}`);
  }
  return lines.join("\n") + "\n";
}

// --- 3. Strukturierte JSON-Logs (ecs-logging-Stil, NDJSON) ---
const SERVICES = [
  ["product-service", 40],
  ["checkout-service", 30],
  ["cart-service", 20],
  ["payment-service", 10],
];
const JSON_MESSAGES = {
  "product-service": ["Produkt geladen", "Produktliste abgefragt", "Suchanfrage verarbeitet", "Preis berechnet"],
  "checkout-service": ["Checkout gestartet", "Bestellung angelegt", "Versandoptionen ermittelt", "Bestellbestätigung versendet"],
  "cart-service": ["Artikel zum Warenkorb hinzugefügt", "Warenkorb geladen", "Artikel entfernt", "Warenkorb geleert"],
  "payment-service": ["Zahlung autorisiert", "Zahlungsmethode validiert", "PSP-Antwort verarbeitet", "Zahlung erfasst"],
};
function traceId() {
  let s = "";
  for (let i = 0; i < 32; i++) s += "0123456789abcdef"[randInt(0, 15)];
  return s;
}

function generateJson(count) {
  const lines = [];
  for (const ts of timestamps(count)) {
    const service = weighted(SERVICES);
    const inB = inBurst(ts);
    const isError = inB && service !== "product-service" ? rng() < 0.35 : rng() < 0.03;
    const isWarn = !isError && rng() < 0.08;
    const status = isError ? weighted([[500, 70], [502, 20], [504, 10]]) : weighted([[200, 85], [201, 8], [404, 5], [400, 2]]);
    const entry = {
      "@timestamp": new Date(ts).toISOString(),
      "log.level": isError ? "error" : isWarn ? "warn" : "info",
      message: isError
        ? `Anfrage fehlgeschlagen mit Status ${status}`
        : pick(JSON_MESSAGES[service]),
      "ecs.version": "8.11.0",
      "service.name": service,
      "service.version": "2.14.3",
      "service.environment": "production",
      "event.dataset": `${service}.app`,
      "trace.id": traceId(),
      "http.request.method": weighted([["GET", 70], ["POST", 25], ["DELETE", 5]]),
      "url.path": `/api/v1/${service.replace("-service", "")}/${randInt(1, 9999)}`,
      "http.response.status_code": status,
      "event.duration": randInt(2, isError ? 30000 : 800) * 1000000,
      "host.name": `mt-app-${randInt(1, 4)}`,
    };
    if (isError) entry["error.type"] = pick(["UpstreamTimeout", "DatabaseUnavailable", "PaymentDeclined"]);
    lines.push(JSON.stringify(entry));
  }
  return lines.join("\n") + "\n";
}

// --- Schreiben ---
fs.mkdirSync(OUT_DIR, { recursive: true });
const files = [
  ["apache-access.log", generateApache(10000)],
  ["java-app.log", generateJava(2000, 50)],
  ["app-json.log", generateJson(5000)],
];
for (const [name, content] of files) {
  const target = path.join(OUT_DIR, name);
  fs.writeFileSync(target, content);
  const lineCount = content.split("\n").length - 1;
  console.log(`✔ ${target} (${lineCount} Zeilen, ${(content.length / 1024).toFixed(0)} KB)`);
}
console.log(`\nZeitraum: ${new Date(START).toISOString()} – ${new Date(END).toISOString()}`);
console.log(`Fehler-Burst (für Alerting-Lab): ${new Date(BURST_START).toISOString()} – ${new Date(BURST_END).toISOString()}`);
