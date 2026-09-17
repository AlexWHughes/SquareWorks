"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT) || 8472;
const DATA_DIR = fs.existsSync("/data") ? "/data" : path.join(__dirname, "data");
const LOG_FILE = path.join(DATA_DIR, "traffic.jsonl");
const SITE_HOSTS = new Set([
  "squareworks.pro",
  "www.squareworks.pro",
  "squareworks.up.railway.app",
  "localhost",
  "127.0.0.1",
]);
const PUBLIC_FILES = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/index.html": { file: "index.html", type: "text/html; charset=utf-8" },
  "/app.js": { file: "app.js", type: "text/javascript; charset=utf-8" },
  "/style.css": { file: "style.css", type: "text/css; charset=utf-8" },
};
const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

const geoCache = new Map();

fs.mkdirSync(DATA_DIR, { recursive: true });

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = (typeof forwarded === "string" && forwarded.split(",")[0].trim())
    || (typeof req.headers["x-real-ip"] === "string" && req.headers["x-real-ip"].trim())
    || req.socket.remoteAddress
    || "";
  return raw.replace(/^::ffff:/, "");
}

function isLocalIp(ip) {
  return !ip
    || ip === "127.0.0.1"
    || ip === "::1"
    || ip.startsWith("10.")
    || ip.startsWith("192.168.")
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
}

async function countryFor(ip) {
  if (isLocalIp(ip)) return { code: "LO", name: "Local" };
  const cached = geoCache.get(ip);
  if (cached) return cached;
  try {
    const res = await fetch(
      `https://get.geojs.io/v1/ip/country/${encodeURIComponent(ip)}.json`,
      { signal: AbortSignal.timeout(2000) }
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const info = {
      code: data.country || "??",
      name: data.name || "Unknown",
    };
    geoCache.set(ip, info);
    return info;
  } catch {
    return { code: "??", name: "Unknown" };
  }
}

function sourceFrom(ref, utmSource) {
  if (utmSource) return utmSource;
  if (!ref) return "Direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
    if (SITE_HOSTS.has(host)) return "Direct";
    return host || "Direct";
  } catch {
    return "Direct";
  }
}

function looksLikeBot(ua) {
  if (!ua) return false;
  return /bot|crawler|spider|crawling|preview|monitor|healthcheck|wget|curl/i.test(ua);
}

function appendVisit(visit) {
  fs.appendFileSync(LOG_FILE, JSON.stringify(visit) + "\n");
}

function readVisits() {
  if (!fs.existsSync(LOG_FILE)) return [];
  return fs.readFileSync(LOG_FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function countBy(visits, key) {
  const counts = new Map();
  for (const visit of visits) {
    const value = visit[key] || "Unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRows(rows) {
  if (rows.length === 0) {
    return `<tr><td colspan="2">No visits yet. The mothership is listening.</td></tr>`;
  }
  return rows
    .map(([label, count]) => (
      `<tr><td>${escapeHtml(label)}</td><td>${count}</td></tr>`
    ))
    .join("");
}

function renderTrafficPage(visits) {
  const countries = countBy(visits, "country");
  const sources = countBy(visits, "source");
  const recent = visits.slice(-50).reverse();
  const recentRows = recent.length === 0
    ? `<tr><td colspan="3">Nobody has suffered yet.</td></tr>`
    : recent.map((visit) => `
        <tr>
          <td>${escapeHtml(visit.ts)}</td>
          <td>${escapeHtml(visit.country || "Unknown")}</td>
          <td>${escapeHtml(visit.source || "Direct")}</td>
        </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SquareWorks Traffic</title>
<style>
  body { margin: 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; background: #0d1b2e; color: #e8eef7; }
  main { max-width: 920px; margin: 0 auto; padding: 32px 20px 64px; }
  h1 { margin: 0 0 6px; font-size: 28px; }
  .sub { color: #9db0cc; margin-bottom: 28px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  section { background: #13263f; border: 1px solid #2a3f5d; border-radius: 8px; padding: 16px 18px; }
  h2 { margin: 0 0 12px; font-size: 16px; }
  .total { font-size: 42px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 7px 0; border-bottom: 1px solid #2a3f5d; }
  th { color: #9db0cc; font-weight: 600; }
  .wide { margin-top: 18px; }
  @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
  <h1>SquareWorks telemetry</h1>
  <p class="sub">Where the suffering is coming from. IPs are not stored.</p>
  <div class="grid">
    <section>
      <h2>Total visits</h2>
      <div class="total">${visits.length}</div>
    </section>
    <section>
      <h2>Countries</h2>
      <table>
        <thead><tr><th>Country</th><th>Visits</th></tr></thead>
        <tbody>${renderRows(countries)}</tbody>
      </table>
    </section>
    <section>
      <h2>Traffic source</h2>
      <table>
        <thead><tr><th>Source</th><th>Visits</th></tr></thead>
        <tbody>${renderRows(sources)}</tbody>
      </table>
    </section>
  </div>
  <section class="wide">
    <h2>Recent visits</h2>
    <table>
      <thead><tr><th>When</th><th>Country</th><th>Source</th></tr></thead>
      <tbody>${recentRows}</tbody>
    </table>
  </section>
</main>
</body>
</html>`;
}

async function handleTrack(req, res, url) {
  const ua = req.headers["user-agent"] || "";
  if (looksLikeBot(ua)) {
    res.writeHead(204);
    res.end();
    return;
  }

  const ip = clientIp(req);
  const geo = await countryFor(ip);
  const ref = url.searchParams.get("ref") || "";
  const utmSource = url.searchParams.get("src") || "";
  const visit = {
    ts: new Date().toISOString(),
    country: geo.name,
    countryCode: geo.code,
    source: sourceFrom(ref, utmSource),
    path: url.searchParams.get("path") || "/",
  };
  appendVisit(visit);
  console.log(`visit country=${visit.country} source=${visit.source}`);

  res.writeHead(200, {
    "Content-Type": "image/gif",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Content-Length": String(GIF.length),
  });
  res.end(GIF);
}

function handlePublic(res, urlPath) {
  const asset = PUBLIC_FILES[urlPath];
  if (!asset) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const filePath = path.join(__dirname, asset.file);
  fs.readFile(filePath, (err, body) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("SquareWorks failed to load SquareWorks.");
      return;
    }
    res.writeHead(200, { "Content-Type": asset.type });
    res.end(body);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ok");
    return;
  }

  if (url.pathname === "/t.gif") {
    await handleTrack(req, res, url);
    return;
  }

  if (url.pathname === "/traffic") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(renderTrafficPage(readVisits()));
    return;
  }

  handlePublic(res, url.pathname);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SquareWorks listening on ${PORT}`);
});
