/* ============================================================
   purwarkrishna.dev — interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- header scroll state ---------- */
  const header = document.getElementById("header");
  const onScroll = () => {
    if (window.scrollY > 24) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- scroll reveal (synchronous, scroll-driven) ---------- */
  const reveals = Array.prototype.slice.call(document.querySelectorAll(".r"));

  // stagger siblings within a list/grid
  reveals.forEach((el) => {
    const parent = el.parentElement;
    const sibs = Array.prototype.slice.call(parent.querySelectorAll(":scope > .r"));
    const idx = sibs.indexOf(el);
    if (idx > 0 && sibs.length > 1) el.style.setProperty("--d", (idx * 0.07) + "s");
  });

  const revealInView = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    for (let i = 0; i < reveals.length; i++) {
      const el = reveals[i];
      if (el.classList.contains("in")) continue;
      const top = el.getBoundingClientRect().top;
      if (top < vh * 0.9) el.classList.add("in");
    }
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) {
    // Only engage the hidden-then-animate state once we've confirmed
    // animation frames are actually running (two rAFs). In frozen
    // capture environments this never fires, so .r stays visible.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.add("reveal-ready");
        revealInView(); // reveal in-view items synchronously (no flash)
      });
    });
  }
  window.addEventListener("scroll", revealInView, { passive: true });
  window.addEventListener("resize", revealInView);

  /* ---------- duplicate marquee for seamless loop ---------- */
  const marquee = document.getElementById("marquee");
  if (marquee) {
    marquee.innerHTML += marquee.innerHTML;
  }

  /* ---------- booking modal ---------- */
  const backdrop = document.getElementById("booking");
  const calGrid = document.getElementById("cal-grid");
  const slotGrid = document.getElementById("slot-grid");
  const slotLabel = document.getElementById("slot-label");
  const confirmBtn = document.getElementById("confirm-btn");
  let lastFocus = null;
  let selectedDay = null;
  let selectedSlot = null;

  const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const SLOTS = ["09:30", "10:30", "11:30", "14:00", "15:00", "16:30"];

  function buildCalendar() {
    calGrid.innerHTML = "";
    DOW.forEach((d) => {
      const el = document.createElement("div");
      el.className = "dow";
      el.textContent = d;
      calGrid.appendChild(el);
    });
    // June 2026 starts on a Monday (offset 0)
    const startOffset = 0;
    const days = 30;
    const today = 1; // first selectable day
    for (let i = 0; i < startOffset; i++) {
      const el = document.createElement("button");
      el.className = "cal-day muted";
      el.disabled = true;
      calGrid.appendChild(el);
    }
    for (let d = 1; d <= days; d++) {
      const el = document.createElement("button");
      const dow = (startOffset + d - 1) % 7;
      const weekend = dow >= 5;
      const past = d < today;
      el.textContent = d;
      el.className = "cal-day" + (weekend || past ? " muted" : " avail");
      if (!weekend && !past) {
        el.addEventListener("click", () => selectDay(d, el));
      } else {
        el.disabled = true;
      }
      calGrid.appendChild(el);
    }
  }

  function selectDay(d, el) {
    selectedDay = d;
    selectedSlot = null;
    calGrid.querySelectorAll(".cal-day").forEach((c) => c.classList.remove("selected"));
    el.classList.add("selected");
    slotLabel.textContent = "Tuesday, June " + d + " — available times";
    renderSlots();
    updateConfirm();
  }

  function renderSlots() {
    slotGrid.innerHTML = "";
    SLOTS.forEach((t) => {
      const b = document.createElement("button");
      b.className = "slot";
      b.textContent = t;
      b.addEventListener("click", () => {
        selectedSlot = t;
        slotGrid.querySelectorAll(".slot").forEach((s) => s.classList.remove("selected"));
        b.classList.add("selected");
        updateConfirm();
      });
      slotGrid.appendChild(b);
    });
  }

  function updateConfirm() {
    const ready = selectedDay && selectedSlot;
    confirmBtn.disabled = !ready;
    confirmBtn.style.opacity = ready ? "1" : ".5";
    if (ready) {
      confirmBtn.innerHTML = 'Confirm June ' + selectedDay + ' · ' + selectedSlot + ' <span class="arrow">→</span>';
    } else {
      confirmBtn.innerHTML = 'Confirm booking <span class="arrow">→</span>';
    }
  }

  let built = false;
  function openModal() {
    if (!built) { buildCalendar(); built = true; }
    lastFocus = document.activeElement;
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
    document.getElementById("modal-close").focus();
  }
  function closeModal() {
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll("[data-book]").forEach((b) => {
    b.addEventListener("click", (e) => { e.preventDefault(); openModal(); });
  });
  document.getElementById("modal-close").addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && backdrop.classList.contains("open")) closeModal(); });

  confirmBtn.addEventListener("click", () => {
    if (confirmBtn.disabled) return;
    const body = backdrop.querySelector(".modal-body");
    body.innerHTML =
      '<div style="text-align:center; padding:48px 12px; display:flex; flex-direction:column; align-items:center; gap:18px;">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font-size:26px;">✓</div>' +
      '<h3 style="font-family:var(--display);font-weight:500;font-size:1.7rem;letter-spacing:-0.02em;">Request sent</h3>' +
      '<p style="color:var(--muted);max-width:34ch;">June ' + selectedDay + ' at ' + selectedSlot + '. You\'d receive a confirmation and Meet link by email. (Placeholder — wire to a real scheduler at launch.)</p>' +
      '<button class="btn btn-ghost" id="done-btn">Close</button></div>';
    document.getElementById("done-btn").addEventListener("click", closeModal);
  });

  /* ---------- article / work placeholder feedback ---------- */
  document.querySelectorAll("[data-article]").forEach((a) => {
    a.addEventListener("click", (e) => { e.preventDefault(); });
  });

  /* ---------- Alt+T easter egg — open tweaks panel ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyT") {
      window.postMessage({ type: "__activate_edit_mode" }, "*");
    }
  });
})();
