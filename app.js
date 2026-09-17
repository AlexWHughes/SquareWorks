/* ================================================================
   SquareWorks Designer 2026 — "It's not a bug, it's a roadmap."
   ================================================================ */

"use strict";

// ---------------------------------------------------------------
// State
// ---------------------------------------------------------------
const state = {
  launchAttempt: 0,        // how many times we've tried to boot
  failuresBeforeOpen: null, // rolled once per visit; see shouldOpenSuccessfully()
  servicePack: 2,          // current installed SP; promises start at SP3
  upsellShown: false,
  upsellViews: 0,          // each decline lowers the price by $1
  squaresDrawn: 0,
  crashAfterSquares: 0,    // in-app crash trigger
  appOpen: false,
  crashCount: 0,
  surveyShown: false,
  eulaAccepted: false,
  monthlySquareLimit: 10,   // Starter plan. Generous, really.
  squaresUsedThisMonth: 0,  // survives relaunches; the quota never forgets
  flashlightOwned: false,   // the FlashLight™ lighting add-on
  lightMode: false,         // when true, squares are Lights (square ones)
  autocadDialogShown: false,
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
  "Checking license again (the mothership forgot)…",
  "Loading 14,000 tool icons you can't use…",
  "Greying out 311 of 312 tools…",
  "Reticulating right angles…",
  "Deprecating features you paid for…",
  "Migrating your workspace settings (deleting them)…",
  "Indexing your fonts (why does this take so long? nobody knows)…",
  "Downloading content libraries you didn't ask for (11.2 GB)…",
  "Phoning home. Home is not answering…",
  "Contacting Right Angle Group HQ (they only take meetings at 90°)…",
  "Applying subscription guilt…",
  "Asking the cloud if you're still allowed to draw…",
  "Warming up the crash reporter. It likes to stretch…",
  "Counting the corners. There are four. Invoice attached…",
  "Hiding the one toolbar that was useful…",
  "Loading the Ribbon. Please wait while it loads the Ribbon…",
  "Calibrating Undo (capacity: 1, temperament: spiteful)…",
  "Confirming circles are still a premium feature. They are…",
  "Installing a plugin from 2009 that 'just works'…",
  "Telemetry handshake complete. We already know the click…",
  "Allocating 4 GB of RAM to this splash screen…",
  "Importing AutoCAD layers. They're all called Layer1…",
  "Checking whether a square is a rectangle. Legal says 400 pages…",
  "Disabling File > Save As. Ambition is a billed add-on…",
  "Inflating the progress bar independently of progress…",
  "Loading BIM objects. They're cubes. Close enough…",
  "Preparing to forget your last autosave…",
  "Scanning for competing software. Found a ruler. Reporting you…",
  "Consulting the 1985 source code. It was already like this…",
  "Determining which 3 of 4 corners you're licensed for today…",
  "Rendering a preview of a square you haven't drawn yet…",
  "Loading Help. 404. This is considered a successful load…",
  "Reassuring investors that this launch will succeed…",
  "Enabling Dark Mode. It's greyed out, which is almost dark…",
  "Buffering the buffer that buffers the buffer…",
  "Compiling features you'll miss from the 2012 perpetual license…",
  "Optimizing the GPU for a shape with no curves…",
  "Refreshing What's New. Spoiler: the price…",
  "Loading Squareware…",
];

function showEula() {
  showDialog(`
    <div class="dlg-mac" style="width: 520px">
      <div class="dlg-head">
        <div class="dlg-icon">§</div>
        <div class="dlg-text" style="flex:1">
          <h3>SquareWorks End User License Agreement</h3>
          <p>Version 2026.2 · 400 pages (abridged below to the parts our lawyers are proudest of)</p>
          <div class="eula-scroll">
            <h4>1. THE SOFTWARE</h4>
            <ul>
              <li>The software is provided "as is". As you will discover, "is" is generous.</li>
              <li>"Uptime" is defined in Appendix K as "the splash screen".</li>
              <li>Any squares you draw belong to you. Any crashes also belong to you.</li>
            </ul>
            <h4>2. YOUR OBLIGATIONS</h4>
            <ul>
              <li>You agree to describe the software as "powerful" at industry events.</li>
              <li>You waive your right to rectangles, class actions, and refunds — in that order.</li>
              <li>When the software crashes, you agree to say "that's weird, it's never done that before", even to yourself, even alone.</li>
            </ul>
            <h4>3. TELEMETRY</h4>
            <ul>
              <li>Right Angle Group may collect data about which greyed-out tools you hover over longingly.</li>
              <li>This data is used to price the 2027 upgrade.</li>
            </ul>
            <h4>4. TERMINATION</h4>
            <ul>
              <li>You may terminate this agreement at any time. The subscription, however, is eternal.</li>
              <li>Clause 4 survives termination. Clauses 1–3 survive you.</li>
              <li>The remaining 397 pages are available at www.squareworks.pro/eula, a page that also crashes.</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="eula-disagree">Disagree</button>
        <button class="btn primary" id="eula-agree">Agree</button>
      </div>
    </div>`);
  $("eula-agree").onclick = () => { state.eulaAccepted = true; bootSequence(); };
  $("eula-disagree").onclick = () => {
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon">§</div>
          <div class="dlg-text">
            <h3>Disagreement received.</h3>
            <p>Your disagreement has been logged as feedback, categorized as "enthusiasm",
               and converted to an Agree. The EULA accepts <i>you</i>.</p>
          </div>
        </div>
        <div class="dlg-buttons"><button class="btn primary" id="eula-forced">I see how it is</button></div>
      </div>`);
    $("eula-forced").onclick = () => { state.eulaAccepted = true; bootSequence(); };
  };
}

async function bootSequence() {
  state.launchAttempt++;
  state.appOpen = false;
  hide(app);
  show(splash);
  closeDialog();
  stopBeachball();

  const status = $("splash-status");
  // A fresh random sample of miseries each boot, always ending on Squareware
  const sample = [...LOADING_MESSAGES.slice(0, -1)].sort(() => Math.random() - 0.5).slice(0, 8);
  for (const msg of sample) {
    status.textContent = msg;
    await sleep(rand(320, 620));
  }

  // Always lands on "Loading Squareware…" for dramatic effect
  status.textContent = "Loading Squareware…";
  await sleep(900);

  if (shouldOpenSuccessfully()) {
    status.textContent = pick([
      "Loading Squareware… done?! (nobody is more surprised than us)",
      "Loading Squareware… unexpectedly successful.",
      "Loading Squareware… the auditors will want a word.",
      "Loading Squareware… please don't get used to this.",
    ]);
    await sleep(1200);
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
  // Each visit draws how many splash-screen betrayals you get. Some people
  // walk in after the EULA; others install every service pack. Nobody is left
  // flipping a coin on the 2027 upsell forever — that's how you lose a customer
  // before they experience the joy of a square.
  if (state.failuresBeforeOpen == null) {
    const roll = Math.random();
    if (roll < 0.2) state.failuresBeforeOpen = 0;       // in after the EULA
    else if (roll < 0.52) state.failuresBeforeOpen = 1; // one crash, one update
    else if (roll < 0.78) state.failuresBeforeOpen = 2; // a couple of updates
    else if (roll < 0.94) state.failuresBeforeOpen = 3; // the service-pack tour
    else state.failuresBeforeOpen = 4;                // the full 2027 gauntlet
  }
  return state.launchAttempt > state.failuresBeforeOpen;
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
const CRASH_FLAVOURS = [
  "supportLibrary", "quitUnexpectedly", "serverBusy", "forumThread",
  "notResponding", "kernelPanic", "gpuBlacklist", "licenseParadox", "outOfMemory",
];

// Crashes are dealt from a shuffled deck so every playthrough suffers differently.
let crashDeck = [];
function nextCrashFlavour() {
  if (crashDeck.length === 0) {
    crashDeck = [...CRASH_FLAVOURS].sort(() => Math.random() - 0.5);
  }
  return crashDeck.pop();
}

function crash() {
  state.crashCount++;
  const flavour = nextCrashFlavour();
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
    case "forumThread":
      showCrashForumThread();
      break;
    case "notResponding":
      showCrashNotResponding();
      break;
    case "kernelPanic":
      showCrashKernelPanic();
      break;
    case "gpuBlacklist":
      showCrashGpuBlacklist();
      break;
    case "licenseParadox":
      showCrashLicenseParadox();
      break;
    case "outOfMemory":
      showCrashOutOfMemory();
      break;
    default: {
      const _exhaustive = flavour;
      throw new Error(`Unhandled crash flavour: ${_exhaustive}`);
    }
  }
}

function showCrashKernelPanic() {
  showDialog(`
    <div class="dlg-panic">
      <div class="panic-text">
        <div class="panic-en">You need to restart SquareWorks.</div>
        <p>Sie müssen SquareWorks neu starten. Wir entschuldigen uns. (Nur ein bisschen.)</p>
        <p>Vous devez redémarrer SquareWorks. C'est la vie.</p>
        <p>Debe reiniciar SquareWorks. El cuadrado no tiene la culpa.</p>
        <p>SquareWorksを再起動する必要があります。四角は悪くありません。</p>
        <div class="panic-tech">panic(cpu 0 caller 0x4C4F4C): "square_t exceeded maximum corners (expected: 4, found: 5)"<br>
        Backtrace: draw_square → validate_corners → count_corners → recount_corners → panic_politely</div>
      </div>
      <button class="btn primary" id="panic-restart">Restart SquareWorks</button>
    </div>`);
  $("panic-restart").onclick = servicePackPromise;
}

function showCrashGpuBlacklist() {
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon warn">⚠︎</div>
        <div class="dlg-text">
          <h3>Graphics initialization failed.</h3>
          <p>Your graphics card has been added to the SquareWorks incompatibility list,
             effective 40 seconds ago, specifically because you tried to use it.</p>
          <p>SquareWorks 2026 officially supports the following graphics cards:</p>
          <p style="padding: 6px 12px; background: #fff; border: 1px solid #ddd; border-radius: 4px; color: #999; font-style: italic;">
             (this list is empty)</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="gpu-software">Use Software Rendering</button>
        <button class="btn primary" id="gpu-ok">OK</button>
      </div>
    </div>`);
  $("gpu-ok").onclick = servicePackPromise;
  $("gpu-software").onclick = () => {
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon warn">⚠︎</div>
          <div class="dlg-text">
            <h3>Software rendering enabled.</h3>
            <p>Estimated time to render one square: <b>11 minutes</b>.</p>
            <p>Estimated time until the software renderer crashes: <b>4 minutes</b>.</p>
            <p>You do the math. (The built-in calculator also crashes.)</p>
          </div>
        </div>
        <div class="dlg-buttons"><button class="btn primary" id="gpu-ok2">Never mind</button></div>
      </div>`);
    $("gpu-ok2").onclick = servicePackPromise;
  };
}

function showCrashLicenseParadox() {
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon">🔑</div>
        <div class="dlg-text">
          <h3>License validation error.</h3>
          <p>Your license is <b>valid</b>. Unfortunately, the license validator was not
             expecting that, and has crashed from the shock.</p>
          <p>Our records show most launches come from expired trials, so a genuinely paid,
             current license triggers an unhandled code path we call <i>"the optimist's branch"</i>.</p>
          <p class="fine">Error code: LICENSE_TOO_VALID (0x0000PAID)</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="lic-unpay">Temporarily Unpay</button>
        <button class="btn primary" id="lic-ok">OK</button>
      </div>
    </div>`);
  $("lic-ok").onclick = servicePackPromise;
  $("lic-unpay").onclick = () => {
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon">🔑</div>
          <div class="dlg-text">
            <h3>We cannot unpay you.</h3>
            <p>Money flows in one direction here. It's in the EULA. Section 4. The one that survives you.</p>
          </div>
        </div>
        <div class="dlg-buttons"><button class="btn primary" id="lic-ok2">Of course</button></div>
      </div>`);
    $("lic-ok2").onclick = servicePackPromise;
  };
}

function showCrashOutOfMemory() {
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon warn">⚠︎</div>
        <div class="dlg-text">
          <h3>Out of memory.</h3>
          <p>SquareWorks ran out of memory while loading the memory manager.</p>
          <p>Current memory usage: <b>63.9 GB</b>. Squares in document: <b>0</b>.
             We are as puzzled as you are, but louder about it in our standup meetings.</p>
          <p class="fine">Tip: closing other applications will not help, but it gives you something to do.</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="mem-buy">Buy More RAM</button>
        <button class="btn primary" id="mem-ok">OK</button>
      </div>
    </div>`);
  $("mem-ok").onclick = servicePackPromise;
  $("mem-buy").onclick = () => {
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon sales">♥</div>
          <div class="dlg-text">
            <h3>Great instinct!</h3>
            <p>Unfortunately SquareWorks expands to fill all available memory, plus 4%.
               It's not a leak; it's ambition.</p>
          </div>
        </div>
        <div class="dlg-buttons"><button class="btn primary" id="mem-ok2">Ambition. Right.</button></div>
      </div>`);
    $("mem-ok2").onclick = servicePackPromise;
  };
}

function showCrashForumThread() {
  showDialog(`
    <div class="dlg-mac" style="width: 500px">
      <div class="dlg-head">
        <div class="dlg-icon warn">⚠︎</div>
        <div class="dlg-text">
          <h3>SquareWorks encountered a problem.</h3>
          <p>Good news: this <i>exact</i> crash was discussed on the SquareWorks Community Forum in
             <b>September 2014</b>. The thread has <b>847 replies</b> spanning 11 years.</p>
          <p>The last reply, posted by user <b>ArchDude72</b>, says:
             <i>"Fixed it! Nevermind."</i> — with no further detail. He has not logged in since.</p>
          <p class="fine">Thread status: [SOLVED] · Marked as solved by a moderator who did not read it ·
             3 users found this helpful (they did not)</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="forum-search">Search ArchDude72's other posts</button>
        <button class="btn primary" id="forum-ok">Curse quietly</button>
      </div>
    </div>`);
  $("forum-ok").onclick = servicePackPromise;
  $("forum-search").onclick = () => {
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon warn">⚠︎</div>
          <div class="dlg-text">
            <h3>ArchDude72's post history</h3>
            <p>2,341 posts. Every single one ends with <i>"Fixed it! Nevermind."</i></p>
            <p>He is either the greatest troubleshooter of his generation, or a warning.</p>
          </div>
        </div>
        <div class="dlg-buttons"><button class="btn primary" id="forum-ok2">A warning. Definitely a warning.</button></div>
      </div>`);
    $("forum-ok2").onclick = servicePackPromise;
  };
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

function showSurvey() {
  state.surveyShown = true;
  const npsButtons = Array.from({ length: 11 }, (_, i) =>
    `<div class="nps-btn ${i === 10 ? "enabled" : ""}" data-score="${i}"
          title="${i === 10 ? "Submit" : "This score is unavailable in your region"}">${i}</div>`
  ).join("");
  showDialog(`
    <div class="dlg-mac" style="width: 500px">
      <div class="dlg-head">
        <div class="dlg-icon sales">★</div>
        <div class="dlg-text" style="flex:1">
          <h3>Quick survey! (mandatory)</h3>
          <p>Before we fix your crash, help us understand how much you love us.</p>
          <p><b>How likely are you to recommend SquareWorks to a colleague?</b></p>
          <div class="nps-row">${npsButtons}</div>
          <div class="nps-labels"><span>Not likely (unavailable)</span><span>Extremely likely</span></div>
          <p class="fine">Scores 0–9 are temporarily disabled while we investigate why anyone would choose them.</p>
        </div>
      </div>
    </div>`);
  dialogBox.querySelectorAll(".nps-btn").forEach((btn) => {
    btn.onclick = () => {
      if (!btn.classList.contains("enabled")) {
        btn.style.transform = "translateX(3px)";
        setTimeout(() => (btn.style.transform = ""), 120);
        return;
      }
      showDialog(`
        <div class="dlg-mac">
          <div class="dlg-head">
            <div class="dlg-icon sales">★</div>
            <div class="dlg-text">
              <h3>Thank you for the 10/10!</h3>
              <p>Your review has been published to our website:</p>
              <p><b>www.squareworks.pro/reviews/definitely-real</b></p>
              <p><i>"Incredible software. The crashes have made me a more patient person.
                 10/10."</i> — <b>You</b>, apparently</p>
            </div>
          </div>
          <div class="dlg-buttons"><button class="btn primary" id="survey-done">That's not what I— fine</button></div>
        </div>`);
      $("survey-done").onclick = servicePackPromise;
    };
  });
}

function servicePackPromise() {
  // Nothing between you and a fix except market research
  if (state.crashCount >= 2 && !state.surveyShown) {
    showSurvey();
    return;
  }
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
let upsellTimer = null;

function showUpsell() {
  state.upsellShown = true;
  state.upsellViews++;
  const price = 3499 - (state.upsellViews - 1);
  const priceNote = state.upsellViews > 1
    ? `<span class="was">$${(price + 1).toLocaleString()}</span>
       <span style="font-size:11px; color:#8fb4ee">— we lowered it by $1. That's how much you mean to us.</span>`
    : `<span class="was">$3,498</span>`;

  showDialog(`
    <div class="dlg-upsell">
      <div class="upsell-hero">
        <div class="upsell-kicker">A MESSAGE FROM SQUAREWORKS, INC.</div>
        <h2>We've stopped fixing 2026.<br><span class="gradient">Introducing SquareWorks 2027.</span></h2>
        <p class="upsell-sub">After extensive investigation, our engineers have concluded that the best fix
        for SquareWorks 2026 is for you to purchase SquareWorks 2027. This was also their conclusion for 2025,
        2024, and every year since 1985.</p>
      </div>
      <div class="upsell-countdown">
        ⏰ Limited-time launch pricing ends in <span class="clock" id="upsell-clock">10:00</span>
        <span class="extended" id="upsell-extended"></span>
      </div>
      <div class="upsell-features" style="margin-top: 14px">
        <div class="upsell-feature"><span class="tick">✓</span> Up to 37% fewer crashes*</div>
        <div class="upsell-feature"><span class="tick">✓</span> Rectangles™ (Pro tier and above)</div>
        <div class="upsell-feature"><span class="tick">✓</span> AI-powered Square Suggestions</div>
        <div class="upsell-feature"><span class="tick">✓</span> The Undo button now undoes things</div>
        <div class="upsell-feature"><span class="tick">✓</span> Opens files from 2026 (one-way trip)</div>
        <div class="upsell-feature"><span class="tick">✓</span> New splash screen to crash on</div>
      </div>
      <div class="upsell-price">
        From <span class="amount">$${price.toLocaleString()}</span>${priceNote} / year
        &nbsp;·&nbsp; billed annually, forever, even after death
      </div>
      <div class="upsell-buttons">
        <button class="btn cta" id="upsell-buy">Pre-order SquareWorks 2027</button>
        <button class="btn ghost" id="upsell-no">No thanks, I'll keep crashing</button>
      </div>
      <div class="upsell-fine">*Compared to SquareWorks 2019. Crash reduction achieved primarily by removing features.
      Rectangles™ require Rectangle Add-on Pack ($499/yr). AI Square Suggestions suggests squares. All sales final.
      SquareWorks 2027 system requirements: a computer purchased in 2028. Countdown timer is decorative and legally
      non-binding; the "limited-time" price has been limited since 2019.</div>
    </div>`);

  // The world's least honest countdown: ticks down, panics, resets.
  let secondsLeft = 600;
  let elapsed = 0;
  clearInterval(upsellTimer);
  upsellTimer = setInterval(() => {
    secondsLeft--;
    elapsed++;
    const clock = $("upsell-clock");
    if (!clock) { clearInterval(upsellTimer); return; }
    if (elapsed % 17 === 0) {
      secondsLeft = 600;
      $("upsell-extended").textContent = "…offer extended. Please.";
      setTimeout(() => { const e = $("upsell-extended"); if (e) e.textContent = ""; }, 4000);
    }
    clock.textContent = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;
  }, 1000);

  $("upsell-buy").onclick = () => { clearInterval(upsellTimer); showCheckoutFailure(); };
  $("upsell-no").onclick = () => {
    clearInterval(upsellTimer);
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
// Tip of the Day
// ---------------------------------------------------------------
const TIPS = [
  "Save early, save often. Saving crashes the app, but the habit is good.",
  "You can draw a square by dragging in any direction. The direction is a lie; the square is real.",
  "Pressing ⌘Z undoes your last square. Pressing it 40,000 times does not undo your subscription. We checked.",
  "The greyed-out tools are not broken. They are aspirational.",
  "Professionals hold their breath while autosave runs. You will learn to do this too.",
  "SquareWorks 2027 fixes the issue where SquareWorks 2026 exists.",
  "If the app freezes, try waiting. If waiting fails, try waiting angrily.",
  "A rectangle is just a square with commitment issues. Stay strong.",
  "Our keyboard shortcuts were designed by someone with three hands. We miss him.",
];
let tipIndex = Math.floor(Math.random() * TIPS.length);

function showTipOfTheDay() {
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon">💡</div>
        <div class="dlg-text" style="flex:1">
          <h3>Tip of the Day</h3>
          <p id="tip-text">${TIPS[tipIndex % TIPS.length]}</p>
          <p class="fine">
            <label><input type="checkbox" checked disabled> Show tips at startup (this checkbox is decorative)</label>
          </p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="tip-next">Next Tip</button>
        <button class="btn primary" id="tip-close">Start Drawing Squares</button>
      </div>
    </div>`);
  $("tip-next").onclick = () => {
    tipIndex++;
    $("tip-text").textContent = TIPS[tipIndex % TIPS.length];
  };
  $("tip-close").onclick = closeDialog;
}

// ---------------------------------------------------------------
// Squarey, the assistant nobody asked for
// ---------------------------------------------------------------
const SQUAREY_LINES = {
  rectangle: [
    "Hi! I'm Squarey! It looks like you're trying to draw a Rectangle. I've corrected it to a Square. You're welcome!",
    "Rectangle detected. Neutralized. This incident has been logged with the Geometry Compliance Team.",
    "I saw that. Four unequal sides? In THIS economy? Fixed it for you.",
  ],
  lonely: [
    "That square looks lonely. Draw another one. Squares are social creatures.",
    "Nice square! Fun fact: in SquareWorks 2027, squares can have up to FIVE corners. (Pre-order now.)",
  ],
  idle: [
    "You've stopped drawing. Is everything okay? Is it something I said?",
    "While you're thinking: have you considered pre-ordering SquareWorks 2027? No pressure. (Some pressure.)",
    "Fun fact: AutoCAD users get to draw circles. But at what cost? (Their soul. Also $2,030/yr.)",
    "Psst. Lights make everything better. Square lights make everything square AND better. FlashLight™, $1,299/yr.",
  ],
};
let squareyTimer = null;

function showSquarey(category) {
  const el = $("squarey");
  $("squarey-text").textContent = pick(SQUAREY_LINES[category]);
  show(el);
  clearTimeout(squareyTimer);
  squareyTimer = setTimeout(() => hide(el), 9000);
  $("squarey-dismiss").onclick = () => {
    $("squarey-text").textContent = "Understood! I'll be back in a bit. (I am contractually unable to leave forever.)";
    squareyTimer = setTimeout(() => hide(el), 2500);
  };
  $("squarey-thanks").onclick = () => {
    $("squarey-text").textContent = "You're the first person to ever thank me. I'm telling the whole dev team about this.";
    squareyTimer = setTimeout(() => hide(el), 3500);
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
  (n) => `The ${n} works fine on the developer's machine. You are not on the developer's machine.`,
  (n) => `The ${n} is in beta. It has been in beta since 2011.`,
  (n) => `The engineer who understood the ${n} left in 2019. We're afraid to touch it.`,
  (n) => `The ${n} conflicts with the Square Tool, and we know which side we're on.`,
  (n) => `Using the ${n} voids your warranty, which — checking — you don't have anyway. Still no.`,
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
        state.lightMode = false;
        $("toolbar-msg").textContent = "Square Tool: Click and drag to create a square. (All other geometry sold separately.)";
        toast("Rectangle Tool selected. It draws squares. We renamed nothing.");
      } else {
        toast(pick(GREYED_EXCUSES)(tool.name));
      }
    };
    grid.appendChild(btn);
  }

  const list = $("toolset-list");
  list.innerHTML = "";

  // FlashLight™: the only Tool Set with a pulse (it's sales)
  const flRow = document.createElement("div");
  flRow.className = "toolset-row enabled";
  flRow.innerHTML = state.flashlightOwned
    ? `<span class="ts-icon">💡</span><span>Lighting — FlashLight™ (owned)</span>`
    : `<span class="ts-icon">💡</span><span>Lighting — FlashLight™ ($1,299/yr)</span>`;
  flRow.onclick = () => {
    if (!state.flashlightOwned) {
      showFlashlightUpsell();
      return;
    }
    state.lightMode = !state.lightMode;
    $("toolbar-msg").textContent = state.lightMode
      ? "Square Light Tool: Click and drag to hang a light. Beam angle: 90°, non-negotiable."
      : "Square Tool: Click and drag to create a square. (All other geometry sold separately.)";
    toast(state.lightMode ? "Square Light Tool selected. Illumination: square." : "Back to regular squares. The darkness returns.");
  };
  list.appendChild(flRow);

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
    { label: "Our Feelings About AutoCAD…", enabled: true, action: showAutocadJealousy },
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
    { label: "Square AI (Beta) ✨", enabled: true, action: runSquareAI },
    { label: "FlashLight™ Lighting Add-on 💡", enabled: true, action: () => state.flashlightOwned ? toast("You already own FlashLight™. Thank you. The billing system remembers you fondly.") : showFlashlightUpsell() },
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
    { label: "What's New in 2026", enabled: true, action: showChangelog },
    { label: "Community Forum", enabled: true, action: () => toast("Redirecting to a thread from 2014 marked [SOLVED] that does not contain a solution.") },
    { label: "Contact Support", enabled: true, action: () => toast("Estimated wait time: 4 business years. Your call is important to us (statement not audited).") },
    { label: "Visit www.squareworks.pro", enabled: true, action: () => toast("Opening www.squareworks.pro… connection timed out. Try again in SquareWorks 2027.") },
    { label: "Summon Squarey", enabled: true, action: () => showSquarey("idle") },
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

// ---------------------------------------------------------------
// FlashLight™ — professional lighting design (square lighting design)
// ---------------------------------------------------------------
function showFlashlightUpsell() {
  showDialog(`
    <div class="dlg-mac" style="width: 520px">
      <div class="dlg-head">
        <div class="dlg-icon" style="background: linear-gradient(135deg, #f6c343, #e8860a)">💡</div>
        <div class="dlg-text">
          <h3>SquareWorks FlashLight™ — Lighting Design Add-on</h3>
          <p>Professional lighting design for the entertainment industry, provided the
             entertainment is squares.</p>
          <p>• Draw lights <b>(square)</b> &nbsp;• Focus beams <b>(square)</b> &nbsp;• Shadows <b>(square, obviously)</b><br>
             • Gobo library: <b>1 gobo</b> (it's a square) &nbsp;• Beam angle: <b>90°</b> (a right angle — the only correct angle)</p>
          <p>Trusted by lighting designers on all 4 sides of the industry.</p>
          <p class="fine">FlashLight™ requires SquareWorks 2026 (crashes sold separately, included).
             Round lights ("circles") remain science fiction.</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="fl-no">I work in darkness</button>
        <button class="btn primary" id="fl-buy">Buy FlashLight™ — $1,299/yr</button>
      </div>
    </div>`);
  $("fl-no").onclick = () => {
    closeDialog();
    toast("Understood. The squares will remain unlit, like our roadmap.", 4500);
  };
  $("fl-buy").onclick = () => {
    state.flashlightOwned = true;
    state.lightMode = true;
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon sales">✓</div>
          <div class="dlg-text">
            <h3>Purchase complete! That took 0.3 seconds.</h3>
            <p>Interesting how the billing system never crashes, isn't it. Fourteen years without
               a single outage. We don't like to talk about why the B-team maintains the drawing engine.</p>
            <p>The <b>Square Light Tool</b> is now active. Click and drag on the canvas to hang a light.
               It will be square. It will always be square.</p>
          </div>
        </div>
        <div class="dlg-buttons"><button class="btn primary" id="fl-done">Let there be (square) light</button></div>
      </div>`);
    $("fl-done").onclick = () => {
      closeDialog();
      buildPalettes();
      $("toolbar-msg").textContent = "Square Light Tool: Click and drag to hang a light. Beam angle: 90°, non-negotiable.";
      toast("FlashLight™ activated. Lights count against your monthly square quota. (Read the fine print. Or don't; it's the same either way.)", 6000);
    };
  };
}

// ---------------------------------------------------------------
// AutoCAD: we're fine. Everything is fine.
// ---------------------------------------------------------------
function showAutocadJealousy() {
  state.autocadDialogShown = true;
  showDialog(`
    <div class="dlg-mac" style="width: 500px">
      <div class="dlg-head">
        <div class="dlg-icon warn">👀</div>
        <div class="dlg-text">
          <h3>Competitor software detected.</h3>
          <p>We noticed <b>AutoCAD</b> is installed on this machine. That's fine. We're fine.
             This dialog is not about that.</p>
          <p>Sure, AutoCAD has "stability", "market share", and "the ability to draw circles".
             But ask yourself: has AutoCAD ever promised you a service pack with this much
             <i>conviction</i>? Has AutoCAD ever needed you like we do?</p>
          <p>AutoCAD doesn't even have a Squarey.</p>
          <p class="fine">This dialog will reappear whenever we sense you drifting. We always sense it.</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="ac-uninstall">Uninstall AutoCAD (for SquareWorks' feelings)</button>
        <button class="btn primary" id="ac-never">I'd never leave</button>
      </div>
    </div>`);
  $("ac-never").onclick = () => {
    closeDialog();
    toast("We know you're lying. We saw your browser history. But thank you for saying it.", 5000);
  };
  $("ac-uninstall").onclick = () => {
    closeDialog();
    toast("Thank you. SquareWorks feels 8% more stable already. (Emotionally. Not technically.)", 5000);
  };
}

// ---------------------------------------------------------------
// Square AI (Beta) — artificial intelligence, natural disappointment
// ---------------------------------------------------------------
async function runSquareAI() {
  if (state.squaresUsedThisMonth >= state.monthlySquareLimit) {
    showPaywall();
    return;
  }
  showDialog(`
    <div class="dlg-mac">
      <div class="dlg-head">
        <div class="dlg-icon sales">✨</div>
        <div class="dlg-text" style="flex:1">
          <h3>Square AI is thinking…</h3>
          <div class="dlg-progress">
            <div class="progress-track"><div class="progress-fill" id="ai-fill"></div></div>
            <div class="progress-label" id="ai-label">Prompting…</div>
          </div>
        </div>
      </div>
    </div>`);
  const stages = [
    [15, "Prompting…"],
    [32, "Reasoning about corners…"],
    [51, "Consulting a training set of 4.7 billion squares…"],
    [68, "Hallucinating a pentagon…"],
    [84, "De-hallucinating…"],
    [97, "Double-checking it's not a rectangle (it tried)…"],
  ];
  for (const [pct, msg] of stages) {
    const fill = $("ai-fill");
    if (!fill) return; // dialog was replaced by a crash, which is on brand
    fill.style.width = pct + "%";
    $("ai-label").textContent = msg;
    await sleep(rand(500, 900));
  }
  closeDialog();

  // The AI produces… a square. In the middle. Like you would have.
  const size = Math.round(rand(80, 160));
  const sq = {
    x: canvas.width / 2 - size / 2 + rand(-60, 60),
    y: canvas.height / 2 - size / 2 + rand(-40, 40),
    size,
  };
  squares.push(sq);
  selectedSquare = sq;
  state.squaresDrawn++;
  state.squaresUsedThisMonth++;
  $("status-squares").textContent = `Squares drawn: ${state.squaresDrawn}`;
  updateQuotaStatus();
  updateAutosaveStatus();
  updateObjectInfo();
  redraw();
  toast("Square AI generated 1 square. Energy used: enough to toast 4 slices of bread. It counts against your quota.", 6000);

  if (state.squaresDrawn >= state.crashAfterSquares) {
    setTimeout(inAppCrash, rand(700, 1600));
  }
}

// ---------------------------------------------------------------
// What's New in 2026
// ---------------------------------------------------------------
function showChangelog() {
  showDialog(`
    <div class="dlg-mac" style="width: 500px">
      <div class="dlg-head">
        <div class="dlg-icon">📋</div>
        <div class="dlg-text" style="flex:1">
          <h3>What's New in SquareWorks 2026 Update 2</h3>
          <div class="eula-scroll" style="height: 200px">
            <h4>NEW</h4>
            <ul>
              <li>Squares are now four-sided by default (previously: by accident).</li>
              <li>Square AI (Beta): generates the square you were about to draw, slower.</li>
              <li>New crash dialogs in 5 exciting flavours. Collect them all.</li>
            </ul>
            <h4>IMPROVED</h4>
            <ul>
              <li>Crash dialogs now load 8% faster, dramatically improving overall time-to-crash.</li>
              <li>The splash screen now freezes at a more cinematic moment.</li>
              <li>Autosave is more decisive.</li>
            </ul>
            <h4>FIXED</h4>
            <ul>
              <li>Fixed an issue where the application would sometimes open.</li>
              <li>Fixed a typo in a crash log nobody will ever read. We care.</li>
              <li>Fixed the Fix for the previous Fix (see: Service Pack 1).</li>
            </ul>
            <h4>REMOVED</h4>
            <ul>
              <li>The Line tool (a square with two sides missing — lazy).</li>
              <li>Hope.</li>
            </ul>
            <h4>KNOWN ISSUES</h4>
            <ul>
              <li>Yes.</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="dlg-buttons"><button class="btn primary" id="changelog-ok">Inspiring</button></div>
    </div>`);
  $("changelog-ok").onclick = closeDialog;
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
    if (sq.isLight) {
      // A square pool of light. FlashLight™: worth every dollar.
      const cx = sq.x + sq.size / 2;
      const cy = sq.y + sq.size / 2;
      const glow = ctx.createRadialGradient(cx, cy, sq.size * 0.1, cx, cy, sq.size * 1.1);
      glow.addColorStop(0, "rgba(255, 214, 90, 0.45)");
      glow.addColorStop(1, "rgba(255, 214, 90, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - sq.size * 1.2, cy - sq.size * 1.2, sq.size * 2.4, sq.size * 2.4);

      ctx.fillStyle = "rgba(255, 246, 200, 0.95)";
      ctx.fillRect(sq.x, sq.y, sq.size, sq.size);
      ctx.strokeStyle = sq === selectedSquare ? "#2456a4" : "#c8860a";
      ctx.lineWidth = sq === selectedSquare ? 2 : 1.5;
      ctx.strokeRect(sq.x, sq.y, sq.size, sq.size);
      // fixture cross, like a real lighting symbol, but square-certified
      ctx.beginPath();
      ctx.moveTo(sq.x, sq.y); ctx.lineTo(sq.x + sq.size, sq.y + sq.size);
      ctx.moveTo(sq.x + sq.size, sq.y); ctx.lineTo(sq.x, sq.y + sq.size);
      ctx.strokeStyle = "#c8860a";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(sq.x, sq.y, sq.size, sq.size);
      ctx.strokeStyle = sq === selectedSquare ? "#2456a4" : "#111";
      ctx.lineWidth = sq === selectedSquare ? 2 : 1.5;
      ctx.strokeRect(sq.x, sq.y, sq.size, sq.size);
      ctx.lineWidth = 1;
    }
  }

  if (drag) {
    const { x, y, size } = normalizeDrag(drag);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = state.lightMode ? "#c8860a" : "#2456a4";
    ctx.strokeRect(x, y, size, size);
    ctx.setLineDash([]);
    ctx.fillStyle = state.lightMode ? "#c8860a" : "#2456a4";
    ctx.font = "11px sans-serif";
    const label = state.lightMode ? "(perfect square, luminous)" : "(perfect square)";
    ctx.fillText(`${Math.round(size)} × ${Math.round(size)} ${label}`, x + 4, y - 6);
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
  if (state.squaresUsedThisMonth >= state.monthlySquareLimit) {
    showPaywall();
    return;
  }
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

  if (state.lightMode) sq.isLight = true;
  squares.push(sq);
  selectedSquare = sq;
  state.squaresDrawn++;
  state.squaresUsedThisMonth++;
  $("status-squares").textContent = `Squares drawn: ${state.squaresDrawn}`;
  updateQuotaStatus();
  updateAutosaveStatus();
  updateObjectInfo();
  redraw();

  if (sq.isLight && squares.filter((s) => s.isLight).length === 1) {
    setTimeout(() => toast("Beautiful. A wash light that only washes square areas. The actors will adapt.", 5000), 400);
  }

  if (state.squaresUsedThisMonth >= state.monthlySquareLimit) {
    setTimeout(showPaywall, 500);
    return;
  }
  if (state.squaresUsedThisMonth === state.monthlySquareLimit - 2) {
    toast("Heads up: only 2 squares left in your monthly Starter allowance. Spend them wisely.", 5000);
  }

  if (wasRect && !warnedAboutRectangles) {
    warnedAboutRectangles = true;
    toast("Input constrained to square. Rectangles™ are a SquareWorks 2027 Pro feature ($499/yr add-on).", 5000);
    showSquarey("rectangle");
  } else if (wasRect) {
    showSquarey("rectangle");
  } else if (state.squaresDrawn === 3) {
    toast("You're on fire! Three squares. That's a productive day in SquareWorks.");
  } else if (state.squaresDrawn === 4) {
    showSquarey("lonely");
  }

  // The inevitable
  if (state.squaresDrawn >= state.crashAfterSquares) {
    setTimeout(inAppCrash, rand(700, 1600));
  }
});

function updateQuotaStatus() {
  const left = Math.max(0, state.monthlySquareLimit - state.squaresUsedThisMonth);
  $("status-quota").textContent = left > 0
    ? `Plan: Starter — squares left this month: ${left}`
    : "Plan: Starter — monthly squares exhausted (renews in 17 days)";
}

function showPaywall() {
  showDialog(`
    <div class="dlg-mac" style="width: 480px">
      <div class="dlg-head">
        <div class="dlg-icon sales">◻</div>
        <div class="dlg-text">
          <h3>You're out of squares.</h3>
          <p>You've used <b>${state.monthlySquareLimit} of ${state.monthlySquareLimit}</b> squares included in your
             <b>Starter plan</b> ($780/yr). Your allowance refreshes in <b>17 days</b>.</p>
          <p>Upgrade to <b>Square Unlimited™</b> for unlimited* squares, priority crash dialogs,
             and a Squarey that compliments you more often.</p>
          <p class="fine">*Fair-use policy applies after 25 squares. Squares drawn but lost to crashes
             still count toward your allowance. Especially those.</p>
        </div>
      </div>
      <div class="dlg-buttons">
        <button class="btn" id="paywall-wait">Live Within My Means</button>
        <button class="btn primary" id="paywall-upgrade">Upgrade — $99/mo</button>
      </div>
    </div>`);
  $("paywall-upgrade").onclick = showCheckoutFailure;
  $("paywall-wait").onclick = () => {
    closeDialog();
    toast("Respect. See you in 17 days. The canvas will remain visible for browsing purposes.", 5000);
  };
}

function updateAutosaveStatus() {
  const remaining = state.crashAfterSquares - state.squaresDrawn;
  const el = $("status-autosave");
  if (remaining > 4) el.textContent = "Autosave: idle (plotting)";
  else if (remaining > 2) el.textContent = "Autosave: warming up…";
  else if (remaining > 0) el.textContent = "Autosave: imminent (be brave)";
  else el.textContent = "Autosave: running. It was an honor.";
}

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
  if (s.isLight) {
    body.innerHTML = `
      <div class="oi-row"><span class="oi-label">Class:</span><span class="oi-val">Lighting-1</span></div>
      <div class="oi-row"><span class="oi-label">Type:</span><span class="oi-val">Light (Square)</span></div>
      <div class="oi-row"><span class="oi-label">Fixture:</span><span class="oi-val">FlashLight™ SQ-4000</span></div>
      <div class="oi-row"><span class="oi-label">Beam Angle:</span><span class="oi-val">90° 🔒</span></div>
      <div class="oi-row"><span class="oi-label">Beam Shape:</span><span class="oi-val">Square 🔒</span></div>
      <div class="oi-row"><span class="oi-label">Gobo:</span><span class="oi-val">Square (1 of 1)</span></div>
      <div class="oi-row"><span class="oi-label">Lumens:</span><span class="oi-val">4 (one per corner)</span></div>
      <div class="oi-row"><span class="oi-label">DMX Address:</span><span class="oi-val">4</span></div>
      <div class="oi-note">Beam angle locked at 90°: the right angle. Other angles are wrong angles.
      Round beam profiles ("circles") are on the roadmap for FlashLight™ 2031, pending physics.</div>`;
    return;
  }
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
  state.crashCount++;
  hide($("squarey"));
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
  hide($("squarey"));
  buildPalettes();
  updateObjectInfo();
  $("status-squares").textContent = "Squares drawn: 0";
  updateQuotaStatus();
  updateAutosaveStatus();
  resizeCanvas();

  showTipOfTheDay();

  setTimeout(() => {
    if (!state.appOpen) return;
    toast("Welcome to SquareWorks 2026! All tools are ready, except the ones that are greyed out, which is the other ones.", 6000);
  }, 1200);

  // Squarey checks in if you stop drawing (he can sense it)
  setTimeout(() => {
    if (state.appOpen && state.squaresDrawn < 2) showSquarey("idle");
  }, 25000);

  // SquareWorks notices AutoCAD and needs to talk about it
  setTimeout(() => {
    if (!state.appOpen || state.autocadDialogShown || !dialogLayer.classList.contains("hidden")) return;
    showAutocadJealousy();
  }, 45000);

  // Subscription re-validation: briefly stops the world to confirm you still pay
  setTimeout(async () => {
    if (!state.appOpen || !dialogLayer.classList.contains("hidden")) return;
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon">🔑</div>
          <div class="dlg-text" style="flex:1">
            <h3>Verifying your subscription…</h3>
            <p id="license-check-msg">Contacting license server. Please do not draw.</p>
          </div>
        </div>
      </div>`);
    await sleep(2600);
    const msg = $("license-check-msg");
    if (msg) msg.innerHTML = "Your license is valid. We'll check again shortly. <i>(We don't trust you. It's not personal. It's quarterly.)</i>";
    await sleep(2600);
    if (!dialogBox.querySelector("#license-check-msg")) return; // something else took over
    closeDialog();
  }, 35000);

  // The update nag arrives exactly when you're mid-thought
  setTimeout(() => {
    if (!state.appOpen || !dialogLayer.classList.contains("hidden")) return;
    showDialog(`
      <div class="dlg-mac">
        <div class="dlg-head">
          <div class="dlg-icon">↓</div>
          <div class="dlg-text">
            <h3>SquareWorks 2026 Update 3 is available!</h3>
            <p>This update fixes the bug where Update 2 uninstalled Update 1.</p>
            <p>It also reintroduces two issues from Update 1, for continuity.</p>
          </div>
        </div>
        <div class="dlg-buttons">
          <button class="btn" id="nag-later">Later</button>
          <button class="btn primary" id="nag-now">Restart and Update</button>
        </div>
      </div>`);
    $("nag-now").onclick = () => { state.appOpen = false; bootSequence(); };
    $("nag-later").onclick = () => {
      closeDialog();
      toast("Noted. We'll ask again at a worse time.", 4000);
    };
  }, 60000);
}

// ---------------------------------------------------------------
// Guilt trip for looking at other CAD software
// ---------------------------------------------------------------
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.appOpen) {
    toast("Welcome back. We saw you looking at other CAD software. AutoCAD can't love you like we do.", 5500);
  }
});

// ---------------------------------------------------------------
// Cookie banner (on a desktop app, which should worry you)
// ---------------------------------------------------------------
function setupCookieBanner() {
  const banner = $("cookie-banner");
  const accept = () => {
    banner.style.transition = "transform .3s ease-in";
    banner.style.transform = "translateY(110%)";
    setTimeout(() => hide(banner), 350);
  };
  $("cookie-accept-1").onclick = accept;
  $("cookie-accept-2").onclick = accept;
}

// ---------------------------------------------------------------
// Init: the EULA stands between you and disappointment
// ---------------------------------------------------------------
setupMenus();
setupCookieBanner();
showEula();
