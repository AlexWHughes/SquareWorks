/* ================================================================
   SquareWorks Designer 2026 — "It's not a bug, it's a roadmap."
   ================================================================ */

"use strict";

// ---------------------------------------------------------------
// State
// ---------------------------------------------------------------
const state = {
  launchAttempt: 0,        // how many times we've tried to boot
  servicePack: 2,          // current installed SP; promises start at SP3
  upsellShown: false,
  squaresDrawn: 0,
  crashAfterSquares: 0,    // in-app crash trigger
  appOpen: false,
};

// ---------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const splash = $("splash");
const app = $("app");
const dialogLayer = $("dialog-layer");
const dialogBox = $("dialog-box");
const beachball = $("beachball");

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

function showDialog(html) {
  dialogBox.innerHTML = html;
  show(dialogLayer);
}
function closeDialog() {
  hide(dialogLayer);
  dialogBox.innerHTML = "";
}

let toastTimer = null;
function toast(msg, ms = 3500) {
  const t = $("toast");
  t.textContent = msg;
  show(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => hide(t), ms);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => min + Math.random() * (max - min);

// ---------------------------------------------------------------
// Boot sequence
// ---------------------------------------------------------------
const LOADING_MESSAGES = [
  "Initializing Square Engine…",
  "Verifying all four corners…",
  "Checking license with the mothership…",
  "Loading 14,000 tool icons you can't use…",
  "Reticulating right angles…",
  "Deprecating features you paid for…",
  "Contacting Squaremetschek HQ (Berlin, on holiday)…",
  "Loading Squareware…",
];

async function bootSequence() {
  state.launchAttempt++;
  state.appOpen = false;
  hide(app);
  show(splash);
  closeDialog();
  stopBeachball();

  const status = $("splash-status");
  for (const msg of LOADING_MESSAGES) {
    status.textContent = msg;
    await sleep(rand(350, 800));
  }

  // Always freezes on "Loading Squareware…" for dramatic effect
  status.textContent = "Loading Squareware…";
  await sleep(900);

  if (shouldOpenSuccessfully()) {
    status.textContent = "Loading Squareware… done?! (nobody is more surprised than us)";
    await sleep(1400);
    openApp();
  } else {
    // freeze, beachball, then crash
    startBeachball();
    splash.classList.add("frozen");
    await sleep(rand(2000, 3200));
    splash.classList.remove("frozen");
    stopBeachball();
    crash();
  }
}

function shouldOpenSuccessfully() {
  // Never on first launch. After the upsell has been shown, 50/50.
  // Otherwise a slim 20% chance, as a treat.
  if (state.launchAttempt === 1) return false;
  if (state.upsellShown) return Math.random() < 0.5;
  return Math.random() < 0.2;
}

// ---------------------------------------------------------------
// Beachball
// ---------------------------------------------------------------
let beachballMove = null;
function startBeachball() {
  show(beachball);
  document.body.style.cursor = "none";
  beachballMove = (e) => {
    beachball.style.left = e.clientX - 16 + "px";
    beachball.style.top = e.clientY - 16 + "px";
  };
  window.addEventListener("mousemove", beachballMove);
}
function stopBeachball() {
  hide(beachball);
  document.body.style.cursor = "";
  if (beachballMove) window.removeEventListener("mousemove", beachballMove);
  beachballMove = null;
}

// ---------------------------------------------------------------
// Crash dialogs (rotating flavours)
// ---------------------------------------------------------------
const CRASH_FLAVOURS = ["supportLibrary", "quitUnexpectedly", "serverBusy", "notResponding"];
let crashIndex = 0;

function crash() {
  const flavour = CRASH_FLAVOURS[crashIndex % CRASH_FLAVOURS.length];
  crashIndex++;
  switch (flavour) {
    case "supportLibrary":
      showCrashSupportLibrary();
      break;
    case "quitUnexpectedly":
      showCrashQuitUnexpectedly();
      break;
    case "serverBusy":
      showCrashServerBusy();
      break;
    case "notResponding":
      showCrashNotResponding();
      break;
    default: {
      const _exhaustive = flavour;
      throw new Error(`Unhandled crash flavour: ${_exhaustive}`);
    }
  }
}

function showCrashSupportLibrary() {
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon">□</div>
        <div class="dlg-text">
          <h3>Failure loading Support library.</h3>
          <p>This error can occur when the SquareWorks application is removed from the
             SquareWorks folder, when a duplicate SquareWorks application is placed outside
             the SquareWorks folder, or on days ending in "y".</p>
          <p>If none of these situations exist, please re-install SquareWorks, your
             operating system, and possibly your career.</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn primary" id="crash-ok">OK</button>
      </div>
    </div>`);
  $("crash-ok").onclick = servicePackPromise;
}

function showCrashQuitUnexpectedly() {
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon warn">⚠︎</div>
        <div class="dlg-text">
          <h3>SquareWorks quit unexpectedly.</h3>
          <p>Actually, at this point, "unexpectedly" is a strong word.</p>
          <p>Click Reopen to open the application again. Click Report to send a crash
             report we will print out and use as packing material.</p>
          <p class="fine">Exception Type: EXC_BAD_GEOMETRY (SIGSQUARE) &nbsp;|&nbsp; Thread 0 crashed: com.squareworks.cineware.loader</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="crash-report">Report…</button>
        <button class="btn" id="crash-ignore">Ignore</button>
        <button class="btn primary" id="crash-reopen">Reopen</button>
      </div>
    </div>`);
  $("crash-reopen").onclick = servicePackPromise;
  $("crash-ignore").onclick = servicePackPromise;
  $("crash-report").onclick = () => {
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon">✓</div>
          <div class="dlg-text">
            <h3>Crash report received. Thank you!</h3>
            <p>Your report has been added to the pile. Current pile height: <b>3.2 metres</b>.</p>
            <p>Estimated time until an engineer reads it: <b>SquareWorks 2031 Update 4</b>.</p>
          </div>
        </div>
        <div class="dlg-buttons"><button class="btn primary" id="report-ok">You're welcome</button></div>
      </div>`);
    $("report-ok").onclick = servicePackPromise;
  };
}

function showCrashServerBusy() {
  showDialog(`
    <div class="dlg-win">
      <div class="win-titlebar"><span>Server Busy</span><span class="win-close" id="win-x">✕</span></div>
      <div class="win-body">
        <span class="win-icon">⚠️</span>
        <div>
          <p>This action cannot be completed because the other program is busy.
             Choose 'Switch To' to activate the busy program and correct the problem.</p>
          <p style="margin-top:8px; color:#666; font-size:11px;">
            (Yes, this is a Windows dialog. On your Mac. We don't know how it got here either.
            It will be fixed in a service pack.)</p>
        </div>
      </div>
      <div class="win-buttons">
        <button class="btn primary" id="win-switch">Switch To…</button>
        <button class="btn" id="win-retry">Retry</button>
        <button class="btn" id="win-cancel" disabled style="color:#aaa">Cancel</button>
      </div>
    </div>`);
  $("win-switch").onclick = () => {
    toastlessNote("There is no other program. There never was.");
  };
  $("win-retry").onclick = servicePackPromise;
  $("win-x").onclick = servicePackPromise;

  function toastlessNote(msg) {
    const body = dialogBox.querySelector(".win-body div");
    const note = document.createElement("p");
    note.style.cssText = "margin-top:8px; color:#b00; font-size:11px; font-weight:600;";
    note.textContent = msg;
    body.appendChild(note);
  }
}

async function showCrashNotResponding() {
  startBeachball();
  await sleep(2200);
  stopBeachball();
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon warn">⚠︎</div>
        <div class="dlg-text">
          <h3>SquareWorks is not responding.</h3>
          <p>It hasn't responded for 14 minutes. In fairness, neither has our support team.</p>
          <p>Do you want to force quit, or would you like to watch the beautiful spinning
             beachball a little longer? It's the best rendering the app has ever produced.</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="crash-wait">Keep Waiting</button>
        <button class="btn primary" id="crash-fq">Force Quit</button>
      </div>
    </div>`);
  $("crash-fq").onclick = servicePackPromise;
  $("crash-wait").onclick = async () => {
    closeDialog();
    startBeachball();
    await sleep(3000);
    stopBeachball();
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon warn">⚠︎</div>
          <div class="dlg-text">
            <h3>Still not responding.</h3>
            <p>Loyalty like yours is exactly what our subscription model depends on.</p>
          </div>
        </div>
        <div class="dlg-buttons"><button class="btn primary" id="crash-fq2">Force Quit</button></div>
      </div>`);
    $("crash-fq2").onclick = servicePackPromise;
  };
}

// ---------------------------------------------------------------
// Service pack promises (escalating desperation)
// ---------------------------------------------------------------
const SP_PROMISES = [
  {
    title: "Good news! This is a known issue.",
    body: `Issue <b>SQW-2026-88231</b> ("app transforms into abstract art on launch") is a
           known issue affecting a small number of users (all of them).
           <b>Service Pack 3</b> resolves this completely. Probably.`,
    button: "Install Service Pack 3",
  },
  {
    title: "Ah. That was a different crash.",
    body: `Our engineers have reviewed your crash and confirmed it is <i>exciting and new</i>.
           <b>Service Pack 4</b> addresses this exact crash, plus three crashes we haven't
           shipped yet. We are 90% confident. The other 10% is also confident, just about
           different things.`,
    button: "Install Service Pack 4",
  },
  {
    title: "Okay. Service Pack 5. This is the one.",
    body: `The entire engineering team has personally apologized to your document.
           <b>Service Pack 5</b> was compiled under a full moon, code-reviewed twice, and
           blessed. If this doesn't fix it, nothing in the 2026 codebase will.
           <span style="color:#888">(Foreshadowing.)</span>`,
    button: "Install Service Pack 5",
  },
];

function servicePackPromise() {
  const promiseIndex = state.servicePack - 2; // SP2 installed → promise index 0 (SP3)
  if (promiseIndex >= SP_PROMISES.length) {
    // Out of service packs to promise. Time to sell 2027.
    showUpsell();
    return;
  }
  const promise = SP_PROMISES[promiseIndex];
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon">↓</div>
        <div class="dlg-text">
          <h3>${promise.title}</h3>
          <p>${promise.body}</p>
          <p class="fine">SquareWorks Quality Promise™: every crash is a future fix, and every fix is a future crash.</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="sp-later">Remind Me After Deadline</button>
        <button class="btn primary" id="sp-install">${promise.button}</button>
      </div>
    </div>`);
  $("sp-install").onclick = () => installServicePack(state.servicePack + 1);
  $("sp-later").onclick = () => {
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon warn">⚠︎</div>
          <div class="dlg-text">
            <h3>That's not really an option.</h3>
            <p>The "Remind Me After Deadline" button is decorative, like most of our toolbar.</p>
          </div>
        </div>
        <div class="dlg-buttons"><button class="btn primary" id="sp-fine">Fine, Install It</button></div>
      </div>`);
    $("sp-fine").onclick = () => installServicePack(state.servicePack + 1);
  };
}

async function installServicePack(spNumber) {
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon">↓</div>
        <div class="dlg-text" style="flex:1">
          <h3>Installing Service Pack ${spNumber}…</h3>
          <div class="dlg-progress">
            <div class="progress-track"><div class="progress-fill" id="sp-fill"></div></div>
            <div class="progress-label" id="sp-label">Downloading 4.7 GB of fixes for a 12 KB bug…</div>
          </div>
        </div>
      </div>
    </div>`);

  const fill = $("sp-fill");
  const label = $("sp-label");
  const stages = [
    [12, "Downloading 4.7 GB of fixes for a 12 KB bug…"],
    [31, "Removing Service Pack " + (spNumber - 1) + " (it knew too much)…"],
    [55, "Re-breaking features fixed in Service Pack " + (spNumber - 2) + "…"],
    [78, "Updating EULA (you owe us more now)…"],
    [99, "Finalizing…"],
  ];
  for (const [pct, msg] of stages) {
    fill.style.width = pct + "%";
    label.textContent = msg;
    await sleep(rand(600, 1100));
  }
  // The traditional stall at 99%
  label.textContent = "Finalizing… (99% — this may take between 4 seconds and 4 days)";
  await sleep(2400);
  fill.style.width = "100%";
  label.textContent = "Done! Service Pack " + spNumber + " installed successfully.";
  await sleep(900);

  state.servicePack = spNumber;
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon">✓</div>
        <div class="dlg-text">
          <h3>Service Pack ${spNumber} installed!</h3>
          <p>Release notes: <i>"Improved stability."</i> That's it. That's the release notes.</p>
        </div>
      </div>
      <div class="dlg-buttons"><button class="btn primary" id="sp-relaunch">Relaunch SquareWorks</button></div>
    </div>`);
  $("sp-relaunch").onclick = bootSequence;
}

// ---------------------------------------------------------------
// The 2027 upsell
// ---------------------------------------------------------------
function showUpsell() {
  state.upsellShown = true;
  showDialog(`
    <div class="dlg-upsell">
      <div class="upsell-hero">
        <div class="upsell-kicker">A MESSAGE FROM SQUAREWORKS, INC.</div>
        <h2>We've stopped fixing 2026.<br><span class="gradient">Introducing SquareWorks 2027.</span></h2>
        <p class="upsell-sub">After extensive investigation, our engineers have concluded that the best fix
        for SquareWorks 2026 is for you to purchase SquareWorks 2027. This was also their conclusion for 2025,
        2024, and every year since 1985.</p>
      </div>
      <div class="upsell-features">
        <div class="upsell-feature"><span class="tick">✓</span> Up to 37% fewer crashes*</div>
        <div class="upsell-feature"><span class="tick">✓</span> Rectangles™ (Pro tier and above)</div>
        <div class="upsell-feature"><span class="tick">✓</span> AI-powered Square Suggestions</div>
        <div class="upsell-feature"><span class="tick">✓</span> The Undo button now undoes things</div>
        <div class="upsell-feature"><span class="tick">✓</span> Opens files from 2026 (one-way trip)</div>
        <div class="upsell-feature"><span class="tick">✓</span> New splash screen to crash on</div>
      </div>
      <div class="upsell-price">
        From <span class="amount">$3,499</span><span class="was">$3,498</span> / year
        &nbsp;·&nbsp; billed annually, forever, even after death
      </div>
      <div class="upsell-buttons">
        <button class="btn cta" id="upsell-buy">Pre-order SquareWorks 2027</button>
        <button class="btn ghost" id="upsell-no">No thanks, I'll keep crashing</button>
      </div>
      <div class="upsell-fine">*Compared to SquareWorks 2019. Crash reduction achieved primarily by removing features.
      Rectangles™ require Rectangle Add-on Pack ($499/yr). AI Square Suggestions suggests squares. All sales final.
      SquareWorks 2027 system requirements: a computer purchased in 2028.</div>
    </div>`);

  $("upsell-buy").onclick = showCheckoutFailure;
  $("upsell-no").onclick = () => {
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon sales">♥</div>
          <div class="dlg-text">
            <h3>We respect your decision.</h3>
            <p>We've signed you up for 14 marketing emails per week about SquareWorks 2027.
               As a gesture of goodwill, we'll let 2026 actually open this time. Maybe.</p>
          </div>
        </div>
        <div class="dlg-buttons"><button class="btn primary" id="upsell-relaunch">Relaunch SquareWorks 2026</button></div>
      </div>`);
    $("upsell-relaunch").onclick = bootSequence;
  };
}

function showCheckoutFailure() {
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon warn">⚠︎</div>
        <div class="dlg-text">
          <h3>Payment could not be processed.</h3>
          <p>Our online store crashed while charging your card. The good news: you were not charged.
             The bad news: it will try again at 3 AM without asking.</p>
          <p>This checkout issue is a known issue and will be fixed in <b>Store Service Pack 3</b>.</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn primary" id="checkout-ok">Of course it crashed</button>
      </div>
    </div>`);
  $("checkout-ok").onclick = () => {
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon sales">♥</div>
          <div class="dlg-text">
            <h3>Thank you for your almost-purchase!</h3>
            <p>Your enthusiasm has been noted in your customer file. As a reward, SquareWorks 2026
               will now attempt to launch with slightly higher morale.</p>
          </div>
        </div>
        <div class="dlg-buttons"><button class="btn primary" id="checkout-relaunch">Relaunch SquareWorks</button></div>
      </div>`);
    $("checkout-relaunch").onclick = bootSequence;
  };
}

// ---------------------------------------------------------------
// The actual "app" — square tool only
// ---------------------------------------------------------------
const BASIC_TOOLS = [
  { icon: "➤", name: "Selection Tool" },
  { icon: "▭", name: "Rectangle Tool", enabled: true }, // the chosen one
  { icon: "◯", name: "Circle Tool" },
  { icon: "╱", name: "Line Tool" },
  { icon: "△", name: "Polygon Tool" },
  { icon: "〜", name: "Freehand Tool" },
  { icon: "T", name: "Text Tool" },
  { icon: "⌖", name: "Dimension Tool" },
  { icon: "✎", name: "Polyline Tool" },
  { icon: "⬚", name: "Marquee Tool" },
  { icon: "◱", name: "Clip Tool" },
  { icon: "⟲", name: "Rotate Tool" },
];

const TOOL_SETS = [
  ["🧱", "Wall"], ["◠", "Round Wall"], ["⊞", "Wall Join"], ["▤", "Component Join"],
  ["▣", "Slab"], ["𝍖", "Structural Member"], ["🚪", "Door"], ["⊟", "Window"],
  ["#", "Mullion"], ["⌂", "Space"], ["◫", "Column"], ["≣", "Stair"],
  ["⟋", "Ramp"], ["⬒", "Elevator"], ["☰", "Roof"],
];

const SNAP_TOOLS = ["⌗", "◇", "∠", "⊥", "◎", "⌖"];

const GREYED_EXCUSES = [
  (n) => `The ${n} is available in SquareWorks 2027 (from $3,499/yr).`,
  (n) => `The ${n} was temporarily disabled in Service Pack 2. Permanently.`,
  (n) => `The ${n} requires the ${n} Add-on Pack ($499/yr), which requires SquareWorks 2027.`,
  (n) => `The ${n} crashed so often we removed it for your safety.`,
  (n) => `The ${n} is exclusive to users who never actually open the app.`,
  (n) => `Our lawyers have advised us not to let you use the ${n}.`,
];

function buildPalettes() {
  const grid = $("basic-tools");
  grid.innerHTML = "";
  for (const tool of BASIC_TOOLS) {
    const btn = document.createElement("div");
    btn.className = "tool-btn" + (tool.enabled ? " enabled active" : "");
    btn.textContent = tool.icon;
    btn.title = tool.enabled ? tool.name + " (the only one you get)" : tool.name + " — unavailable";
    btn.onclick = () => {
      if (tool.enabled) {
        toast("Rectangle Tool selected. It draws squares. We renamed nothing.");
      } else {
        toast(pick(GREYED_EXCUSES)(tool.name));
      }
    };
    grid.appendChild(btn);
  }

  const list = $("toolset-list");
  list.innerHTML = "";
  for (const [icon, name] of TOOL_SETS) {
    const row = document.createElement("div");
    row.className = "toolset-row";
    row.innerHTML = `<span class="ts-icon">${icon}</span><span>${name}</span>`;
    row.onclick = () => toast(pick(GREYED_EXCUSES)(name + " tool"));
    list.appendChild(row);
  }

  const snaps = $("snap-tools");
  snaps.innerHTML = "";
  for (const icon of SNAP_TOOLS) {
    const btn = document.createElement("div");
    btn.className = "tool-btn";
    btn.textContent = icon;
    btn.title = "Snapping — unavailable";
    btn.onclick = () => toast("Snapping is disabled. Your squares are on their own.");
    snaps.appendChild(btn);
  }
}

// ---------------------------------------------------------------
// Menus
// ---------------------------------------------------------------
const MENUS = {
  squareworks: [
    { label: "About SquareWorks", enabled: true, action: () => toast("SquareWorks 2026 Update 2 + SP" + state.servicePack + ". Still crashing, but with version numbers.") },
    { sep: true },
    { label: "Preferences…", shortcut: "⌘,", enabled: false },
    { label: "Check for Updates…", enabled: true, action: servicePackPromise },
    { sep: true },
    { label: "Quit SquareWorks", shortcut: "⌘Q", enabled: true, action: quitCrash },
  ],
  file: [
    { label: "New…", shortcut: "⌘N", enabled: false },
    { label: "Open…", shortcut: "⌘O", enabled: false },
    { label: "Open Recent", enabled: false },
    { sep: true },
    { label: "Save", shortcut: "⌘S", enabled: true, action: saveCrash },
    { label: "Save As…", shortcut: "⇧⌘S", enabled: false },
    { label: "Export as 2027 (buy 2027 first)", enabled: false },
    { sep: true },
    { label: "Print…", shortcut: "⌘P", enabled: false },
  ],
  edit: [
    { label: "Undo Square", shortcut: "⌘Z", enabled: true, action: undoSquare },
    { label: "Redo", shortcut: "⇧⌘Z", enabled: false },
    { sep: true },
    { label: "Cut", shortcut: "⌘X", enabled: false },
    { label: "Copy", shortcut: "⌘C", enabled: false },
    { label: "Paste", shortcut: "⌘V", enabled: false },
    { label: "Paste as Square", enabled: false },
    { sep: true },
    { label: "Select All Squares", shortcut: "⌘A", enabled: false },
  ],
  view: [
    { label: "Zoom In", shortcut: "⌘+", enabled: false },
    { label: "Zoom Out", shortcut: "⌘-", enabled: false },
    { label: "Fit to Squares", enabled: false },
    { sep: true },
    { label: "3D View (2027 only)", enabled: false },
    { label: "Perspective (2027 Pro only)", enabled: false },
  ],
  modify: [
    { label: "Rotate (would make square a diamond — forbidden)", enabled: false },
    { label: "Scale (squares are already perfect)", enabled: false },
    { label: "Convert to Rectangle™", enabled: true, action: () => showUpsell() },
  ],
  model: [
    { label: "Extrude (2027 only)", enabled: false },
    { label: "Subtract Solids (2027 Pro only)", enabled: false },
    { label: "Add Solids (2027 Enterprise only)", enabled: false },
  ],
  aec: [
    { label: "Wall (see: Square)", enabled: false },
    { label: "Roof (see: Square, tilted — 2027 only)", enabled: false },
    { label: "Door (a square with hinges — 2027 only)", enabled: false },
  ],
  tools: [
    { label: "All 312 tools", enabled: false },
    { sep: true },
    { label: "Report a Bug", enabled: true, action: () => toast("Bug reported. It has been assigned to Service Pack " + (state.servicePack + 1) + ".") },
  ],
  text: [
    { label: "Font (Square Sans only)", enabled: false },
    { label: "Bold", shortcut: "⌘B", enabled: false },
  ],
  window: [
    { label: "Minimize", shortcut: "⌘M", enabled: false },
    { label: "Bring All to Front (there is only one window)", enabled: false },
  ],
  cloud: [
    { label: "Publish to SquareCloud", enabled: true, action: () => toast("SquareCloud is down for scheduled maintenance (2019–present).") },
  ],
  help: [
    { label: "SquareWorks Help", enabled: true, action: () => toast("Help documentation last updated for SquareWorks 12.5 (2007). Most of it still applies, sadly.") },
    { label: "What's New in 2026", enabled: true, action: () => toast("What's new: the crashes are 8% faster.") },
    { sep: true },
    { label: "Upgrade to SquareWorks 2027…", enabled: true, action: () => showUpsell() },
  ],
};

let openMenu = null;

function setupMenus() {
  const dropdown = $("menu-dropdown");

  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = item.dataset.menu;
      if (openMenu === key) { closeMenus(); return; }
      openMenu = key;
      document.querySelectorAll(".menu-item").forEach((m) => m.classList.remove("open"));
      item.classList.add("open");

      dropdown.innerHTML = "";
      for (const entry of MENUS[key]) {
        if (entry.sep) {
          const sep = document.createElement("div");
          sep.className = "sep";
          dropdown.appendChild(sep);
          continue;
        }
        const mi = document.createElement("div");
        mi.className = "mi " + (entry.enabled ? "enabled" : "disabled");
        mi.innerHTML = `<span>${entry.label}</span>` + (entry.shortcut ? `<span class="shortcut">${entry.shortcut}</span>` : "");
        if (entry.enabled) {
          mi.onclick = () => { closeMenus(); entry.action(); };
        } else {
          mi.onclick = () => { closeMenus(); toast(pick(GREYED_EXCUSES)(`"${entry.label}" command`)); };
        }
        dropdown.appendChild(mi);
      }
      const rect = item.getBoundingClientRect();
      dropdown.style.left = rect.left + "px";
      dropdown.style.top = rect.bottom + 2 + "px";
      show(dropdown);
    });
  });

  document.addEventListener("click", closeMenus);

  function closeMenus() {
    openMenu = null;
    hide(dropdown);
    document.querySelectorAll(".menu-item").forEach((m) => m.classList.remove("open"));
  }
}

function quitCrash() {
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon warn">⚠︎</div>
        <div class="dlg-text">
          <h3>SquareWorks crashed while quitting.</h3>
          <p>Quitting is a feature, and like all our features, it has bugs.
             The app will now crash properly, with dignity.</p>
        </div>
      </div>
      <div class="dlg-buttons"><button class="btn primary" id="quit-ok">Understandable</button></div>
    </div>`);
  $("quit-ok").onclick = servicePackPromise;
}

function saveCrash() {
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon warn">⚠︎</div>
        <div class="dlg-text">
          <h3>SquareWorks crashed while saving.</h3>
          <p>Your ${state.squaresDrawn} square${state.squaresDrawn === 1 ? "" : "s"} ${state.squaresDrawn === 1 ? "has" : "have"} been lost.
             A backup was created, but it is also a crash.</p>
          <p class="fine">Autosave was enabled. Autosave is what crashed.</p>
        </div>
      </div>
      <div class="dlg-buttons"><button class="btn primary" id="save-ok">Naturally</button></div>
    </div>`);
  $("save-ok").onclick = servicePackPromise;
}

// ---------------------------------------------------------------
// Canvas: draw squares (and ONLY squares)
// ---------------------------------------------------------------
const canvas = $("canvas");
const ctx = canvas.getContext("2d");
let squares = [];
let selectedSquare = null;
let drag = null;
let warnedAboutRectangles = false;

function resizeCanvas() {
  const wrap = $("canvas-wrap");
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  redraw();
}
window.addEventListener("resize", resizeCanvas);

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // "page" area
  const margin = 40;
  ctx.fillStyle = "#fff";
  ctx.fillRect(margin, margin, canvas.width - margin * 2, canvas.height - margin * 2);
  ctx.strokeStyle = "#666";
  ctx.strokeRect(margin, margin, canvas.width - margin * 2, canvas.height - margin * 2);

  // title block, bottom right, like a real sheet
  ctx.strokeStyle = "#999";
  ctx.strokeRect(canvas.width - margin - 150, canvas.height - margin - 46, 150, 46);
  ctx.fillStyle = "#888";
  ctx.font = "10px sans-serif";
  ctx.fillText("SHEET SQ-1: SQUARES", canvas.width - margin - 142, canvas.height - margin - 28);
  ctx.fillText("Drawn in SquareWorks 2026", canvas.width - margin - 142, canvas.height - margin - 14);

  for (const sq of squares) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(sq.x, sq.y, sq.size, sq.size);
    ctx.strokeStyle = sq === selectedSquare ? "#2456a4" : "#111";
    ctx.lineWidth = sq === selectedSquare ? 2 : 1.5;
    ctx.strokeRect(sq.x, sq.y, sq.size, sq.size);
    ctx.lineWidth = 1;
  }

  if (drag) {
    const { x, y, size } = normalizeDrag(drag);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "#2456a4";
    ctx.strokeRect(x, y, size, size);
    ctx.setLineDash([]);
    ctx.fillStyle = "#2456a4";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${Math.round(size)} × ${Math.round(size)} (perfect square)`, x + 4, y - 6);
  }
}

function normalizeDrag(d) {
  const size = Math.max(Math.abs(d.cx - d.sx), Math.abs(d.cy - d.sy));
  return {
    x: d.cx < d.sx ? d.sx - size : d.sx,
    y: d.cy < d.sy ? d.sy - size : d.sy,
    size,
  };
}

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  drag = { sx: e.clientX - rect.left, sy: e.clientY - rect.top, cx: e.clientX - rect.left, cy: e.clientY - rect.top, wasRect: false };
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  $("status-coords").textContent = `X: ${Math.round(x)}  Y: ${Math.round(y)}`;
  if (!drag) return;
  drag.cx = x;
  drag.cy = y;
  const dx = Math.abs(drag.cx - drag.sx);
  const dy = Math.abs(drag.cy - drag.sy);
  if (dx > 8 && dy > 8 && Math.abs(dx - dy) > Math.max(dx, dy) * 0.25) drag.wasRect = true;
  redraw();
});

canvas.addEventListener("mouseup", () => {
  if (!drag) return;
  const sq = normalizeDrag(drag);
  const wasRect = drag.wasRect;
  drag = null;

  if (sq.size < 6) {
    // treat as a click: select topmost square under cursor
    selectedSquare = [...squares].reverse().find((s) =>
      sq.x >= s.x && sq.x <= s.x + s.size && sq.y >= s.y && sq.y <= s.y + s.size
    ) || null;
    updateObjectInfo();
    redraw();
    return;
  }

  squares.push(sq);
  selectedSquare = sq;
  state.squaresDrawn++;
  $("status-squares").textContent = `Squares drawn: ${state.squaresDrawn}`;
  updateObjectInfo();
  redraw();

  if (wasRect && !warnedAboutRectangles) {
    warnedAboutRectangles = true;
    toast("Input constrained to square. Rectangles™ are a SquareWorks 2027 Pro feature ($499/yr add-on).", 5000);
  } else if (state.squaresDrawn === 3) {
    toast("You're on fire! Three squares. That's a productive day in SquareWorks.");
  }

  // The inevitable
  if (state.squaresDrawn >= state.crashAfterSquares) {
    setTimeout(inAppCrash, rand(700, 1600));
  }
});

function undoSquare() {
  if (squares.length === 0) {
    toast("Nothing to undo. For once, the app and your document agree.");
    return;
  }
  squares.pop();
  selectedSquare = null;
  updateObjectInfo();
  redraw();
  toast("Square undone. It will be remembered.");
}

function updateObjectInfo() {
  const body = $("oi-body");
  if (!selectedSquare) {
    body.innerHTML = `<div class="oi-none">No Selection</div>`;
    return;
  }
  const s = selectedSquare;
  body.innerHTML = `
    <div class="oi-row"><span class="oi-label">Class:</span><span class="oi-val">Square-1</span></div>
    <div class="oi-row"><span class="oi-label">Shape:</span><span class="oi-val">Square</span></div>
    <div class="oi-row"><span class="oi-label">Width:</span><span class="oi-val">${Math.round(s.size)} px</span></div>
    <div class="oi-row"><span class="oi-label">Height:</span><span class="oi-val">${Math.round(s.size)} px 🔒</span></div>
    <div class="oi-row"><span class="oi-label">Area:</span><span class="oi-val">${Math.round(s.size * s.size).toLocaleString()} px²</span></div>
    <div class="oi-row"><span class="oi-label">Corners:</span><span class="oi-val">4 (max)</span></div>
    <div class="oi-note">Height is locked to Width. Unlocking requires SquareWorks 2027 Pro
    with the Rectangle Add-on Pack. Ask your reseller. They miss you.</div>`;
}

function inAppCrash() {
  state.appOpen = false;
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon warn">⚠︎</div>
        <div class="dlg-text">
          <h3>SquareWorks quit unexpectedly while autosaving.</h3>
          <p>Your ${state.squaresDrawn} beautiful square${state.squaresDrawn === 1 ? "" : "s"} ${state.squaresDrawn === 1 ? "has" : "have"} been lost forever.</p>
          <p>Honestly, it lasted longer than we expected. You drew actual geometry.
             The engineers are framing a screenshot.</p>
        </div>
      </div>
      <div class="dlg-buttons"><button class="btn primary" id="inapp-ok">Back to the splash screen</button></div>
    </div>`);
  $("inapp-ok").onclick = servicePackPromise;
}

// ---------------------------------------------------------------
// Open the app
// ---------------------------------------------------------------
function openApp() {
  state.appOpen = true;
  state.squaresDrawn = 0;
  state.crashAfterSquares = Math.floor(rand(6, 11));
  squares = [];
  selectedSquare = null;
  warnedAboutRectangles = false;

  hide(splash);
  show(app);
  buildPalettes();
  updateObjectInfo();
  $("status-squares").textContent = "Squares drawn: 0";
  resizeCanvas();

  setTimeout(() => {
    toast("Welcome to SquareWorks 2026! All tools are ready, except the ones that are greyed out, which is the other ones.", 6000);
  }, 600);
}

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
setupMenus();
bootSequence();
