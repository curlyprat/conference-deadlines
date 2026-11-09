// Builds the subscribable .ics feeds from the calendar page's data.
// Usage: node scripts/build-ics.js <deadlines.html> <outDir>
// Reads the page's data block (RAW rows, VENUES, SITE, helpers) and writes
// all.ics plus one file per conference or program.
const fs = require("fs"), path = require("path");
const [, , pagePath, outDir] = process.argv;
if (!pagePath || !outDir) { console.error("usage: node scripts/build-ics.js <deadlines.html> <outDir>"); process.exit(1); }
const html = fs.readFileSync(pagePath, "utf8");
const js = html.match(/<script>([\s\S]*)<\/script>/)[1];
const lib = js.slice(js.indexOf("const RAW"), js.indexOf("/* ---------- renderers ---------- */"));
global.window = { matchMedia: () => ({ matches: false }) }; global.matchMedia = global.window.matchMedia;
const { EVENTS, VENUES, SITE, COLOR, calText, ymd, slugOf } =
  new Function(lib + "; return { EVENTS, VENUES, SITE, COLOR, calText, ymd, slugOf };")();

const esc = t => String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function fold(line) {
  const enc = new TextEncoder(), out = []; let cur = "", bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}
// Stable UIDs so subscribed calendars update events in place instead of duplicating them.
const uid = e => `${slugOf(e.venue)}-${e.type}-${slugOf(e.detail).slice(0, 40)}-${e.date.getFullYear()}@conference-deadlines`;

function buildIcs(evs, calName) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Conference Deadline Calendar//EN", "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH", "X-WR-CALNAME:" + esc(calName), "REFRESH-INTERVAL;VALUE=DURATION:P1D", "X-PUBLISHED-TTL:P1D"];
  const seen = new Set();
  for (const e of evs) {
    let id = uid(e); while (seen.has(id)) id = "x" + id; seen.add(id);
    const next = new Date(e.date); next.setDate(next.getDate() + 1);
    const { title, body } = calText(e);
    L.push("BEGIN:VEVENT", "UID:" + id, "DTSTAMP:" + stamp,
      "DTSTART;VALUE=DATE:" + ymd(e.date), "DTEND;VALUE=DATE:" + ymd(next),
      "SUMMARY:" + esc(title), "DESCRIPTION:" + esc(body), "TRANSP:TRANSPARENT");
    if (e.est) L.push("STATUS:TENTATIVE");
    if (VENUES[e.venue] && VENUES[e.venue].loc) L.push("LOCATION:" + esc(VENUES[e.venue].loc));
    if (SITE[e.venue]) L.push("URL:" + SITE[e.venue]);
    if (e.type !== "rev" && !/\bopens\b/i.test(e.detail))
      for (const [trig, label] of [["-P7D", "1 week"], ["-P1D", "1 day"]])
        L.push("BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:" + trig, "DESCRIPTION:" + esc(`${label} to go: ${title}`), "END:VALARM");
    L.push("END:VEVENT");
  }
  L.push("END:VCALENDAR");
  return L.map(fold).join("\r\n") + "\r\n";
}

fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
const write = (name, evs, cal) => fs.writeFileSync(path.join(outDir, name), buildIcs(evs, cal));
write("all.ics", EVENTS, "Conference deadlines");
const series = [...new Set(EVENTS.map(e => e.series))];
for (const s of series) write(`${slugOf(s)}.ics`, EVENTS.filter(e => e.series === s), `${s} dates`);
// One feed per filter combination the page offers (type x field), named <type>-<field>.ics
const TYPES = ["all", "paper", "poster", "vol", "fund", "rev"], FIELDS = ["all", "sec", "hci", "info", "ai"];
let combos = 0;
for (const t of TYPES) for (const f of FIELDS) {
  if (t === "all" && f === "all") continue;
  const evs = EVENTS.filter(e => (t === "all" || COLOR[e.type] === t) && (f === "all" || e.field === f));
  write(`${t}-${f}.ics`, evs, "Conference deadlines (filtered)"); combos++;
}
console.log(`wrote ${1 + series.length + combos} calendars (${EVENTS.length} events) to ${outDir}`);
