/* ============================================================
   purwarkrishna.dev — blog index (listing) runtime
   Header state, theme toggle, category filter, row nav.
   ============================================================ */
(function () {
  "use strict";

  var header = document.getElementById("header");
  if (header) {
    window.addEventListener("scroll", function () {
      header.classList.toggle("scrolled", window.scrollY > 24);
    }, { passive: true });
  }

  /* theme toggle */
  var themeMeta = document.getElementById("themeColorMeta");
  function applyThemeColor() {
    if (!themeMeta) return;
    var light = document.documentElement.getAttribute("data-theme") === "light";
    themeMeta.setAttribute("content", light ? "#f7f3ec" : "#16130f");
  }
  applyThemeColor();
  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      var next = cur === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("pk-theme", next); } catch (e) {}
      applyThemeColor();
    });
  }

  /* category filter */
  var filters = document.querySelectorAll(".filter");
  var feature = document.querySelector(".feature-post");
  var rows = Array.prototype.slice.call(document.querySelectorAll(".post-row"));
  var countN = document.getElementById("countN");
  var empty = document.getElementById("indexEmpty");

  function applyFilter(cat) {
    var shown = 0;
    if (feature) {
      var featMatch = (cat === "all" || feature.getAttribute("data-cat") === cat);
      feature.style.display = featMatch ? "" : "none";
      if (featMatch) shown++;
    }
    rows.forEach(function (r) {
      var match = (cat === "all" || r.getAttribute("data-cat") === cat);
      r.classList.toggle("is-hidden", !match);
      if (match) shown++;
    });
    if (countN) countN.textContent = shown;
    if (empty) empty.style.display = shown === 0 ? "block" : "none";
  }

  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      filters.forEach(function (x) { x.classList.remove("active"); });
      f.classList.add("active");
      applyFilter(f.getAttribute("data-cat"));
    });
  });

  /* row + feature click → navigate */
  function wire(el) {
    if (!el) return;
    el.addEventListener("click", function () {
      var href = el.getAttribute("data-href");
      if (href) window.location.href = href;
    });
  }
  rows.forEach(wire);
  wire(feature);
})();
