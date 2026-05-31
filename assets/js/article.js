/* ============================================================
   purwarkrishna.dev — article runtime
   Zero dependencies. Reading progress, TOC scrollspy,
   heading anchors, share + copy-link, theme toggle.
   ============================================================ */
(function () {
  "use strict";

  var header = document.getElementById("header");
  var progressBar = document.getElementById("progressBar");
  var body = document.getElementById("postBody");

  /* ---------- heading anchors + TOC ---------- */
  var tocList = document.getElementById("tocList");
  var headings = body ? body.querySelectorAll("h2, h3") : [];
  var slugCount = {};

  function slugify(t) {
    var s = t.toLowerCase().trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    if (slugCount[s] != null) { slugCount[s]++; s += "-" + slugCount[s]; }
    else { slugCount[s] = 0; }
    return s;
  }

  var tocMobileList = null;
  if (tocList && headings.length && body) {
    var details = document.createElement("details");
    details.className = "toc-mobile";
    details.id = "tocMobile";
    var summary = document.createElement("summary");
    summary.textContent = "On this page";
    var mul = document.createElement("ul");
    details.appendChild(summary);
    details.appendChild(mul);
    body.insertBefore(details, body.firstChild);
    tocMobileList = mul;
    mul.addEventListener("click", function (e) {
      if (e.target.closest("a")) details.open = false;
    });
  }

  var tocItems = [];
  headings.forEach(function (h) {
    if (!h.id) h.id = slugify(h.textContent || "section");
    var a = document.createElement("a");
    a.className = "anchor";
    a.href = "#" + h.id;
    a.setAttribute("aria-hidden", "true");
    a.textContent = "#";
    h.insertBefore(a, h.firstChild);

    var label = (h.textContent || "").replace(/^#/, "").trim();
    var isSub = h.tagName.toLowerCase() === "h3";
    var links = [];

    if (tocList) {
      var li = document.createElement("li");
      var link = document.createElement("a");
      link.href = "#" + h.id;
      link.textContent = label;
      if (isSub) link.className = "sub";
      li.appendChild(link);
      tocList.appendChild(li);
      links.push(link);
    }
    if (tocMobileList) {
      var mli = document.createElement("li");
      var mlink = document.createElement("a");
      mlink.href = "#" + h.id;
      mlink.textContent = label;
      if (isSub) mlink.className = "sub";
      mli.appendChild(mlink);
      tocMobileList.appendChild(mli);
      links.push(mlink);
    }
    if (links.length) tocItems.push({ id: h.id, el: h, links: links });
  });

  document.addEventListener("click", function (e) {
    var t = e.target.closest('a[href^="#"]');
    if (!t) return;
    var id = t.getAttribute("href").slice(1);
    var target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    var y = target.getBoundingClientRect().top + window.pageYOffset - 96;
    window.scrollTo({ top: y, behavior: "smooth" });
    history.replaceState(null, "", "#" + id);
  });

  /* ---------- scroll handler: progress + scrollspy + header ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var st = window.pageYOffset || document.documentElement.scrollTop;

      if (header) header.classList.toggle("scrolled", st > 12);

      if (progressBar && body) {
        var rect = body.getBoundingClientRect();
        var start = rect.top + st;
        var total = body.offsetHeight - window.innerHeight + 240;
        var pct = (st - start + 200) / Math.max(total, 1);
        pct = Math.max(0, Math.min(1, pct));
        progressBar.style.width = (pct * 100).toFixed(2) + "%";
      }

      if (tocItems.length) {
        var active = tocItems[0];
        for (var i = 0; i < tocItems.length; i++) {
          if (tocItems[i].el.getBoundingClientRect().top <= 120) active = tocItems[i];
        }
        tocItems.forEach(function (it) {
          it.links.forEach(function (lk) { lk.classList.toggle("active", it === active); });
        });
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---------- theme toggle ---------- */
  var themeBtn = document.getElementById("themeToggle");
  var themeMeta = document.getElementById("themeColorMeta");
  function applyThemeColor() {
    if (!themeMeta) return;
    var light = document.documentElement.getAttribute("data-theme") === "light";
    themeMeta.setAttribute("content", light ? "#f7f3ec" : "#16130f");
  }
  applyThemeColor();
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      var next = cur === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("pk-theme", next); } catch (e) {}
      applyThemeColor();
      window.dispatchEvent(new CustomEvent("pk-theme-change", { detail: next }));
    });
  }

  /* ---------- copy-code buttons (added to each <pre>) ---------- */
  document.querySelectorAll(".post-body pre").forEach(function (pre) {
    var codeEl = pre.querySelector("code");
    var lang = "";
    if (codeEl) {
      var m = (codeEl.className || "").match(/language-(\w+)/);
      if (m) lang = m[1];
    }
    var head = document.createElement("div");
    head.className = "code-head";
    head.innerHTML =
      '<span class="dots"><i></i><i></i><i></i></span>' +
      '<span class="lang">' + (lang || "code") + '</span>' +
      '<button class="code-copy" type="button">Copy</button>';
    pre.insertBefore(head, pre.firstChild);
    head.querySelector(".code-copy").addEventListener("click", function () {
      var txt = codeEl ? codeEl.innerText : "";
      copyText(txt);
      var btn = this;
      btn.textContent = "Copied"; btn.classList.add("copied");
      setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 1600);
    });
  });

  /* ---------- share buttons ---------- */
  function shareUrl() { return window.location.href; }
  function shareTitle() {
    var h1 = document.querySelector(".post-title");
    return h1 ? h1.textContent.trim() : document.title;
  }
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).catch(function(){ legacyCopy(txt); });
    } else { legacyCopy(txt); }
  }
  function legacyCopy(txt) {
    var ta = document.createElement("textarea");
    ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------- Alt+T easter egg — open tweaks panel ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyT") {
      window.postMessage({ type: "__activate_edit_mode" }, "*");
    }
  });

  document.querySelectorAll("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var kind = btn.getAttribute("data-share");
      var url = encodeURIComponent(shareUrl());
      var title = encodeURIComponent(shareTitle());
      if (kind === "x") {
        window.open("https://twitter.com/intent/tweet?text=" + title + "&url=" + url, "_blank", "noopener");
      } else if (kind === "linkedin") {
        window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + url, "_blank", "noopener");
      } else if (kind === "copy") {
        copyText(shareUrl());
        btn.classList.add("copied");
        var lbl = btn.querySelector(".copy-label");
        if (lbl) { var prev = lbl.textContent; lbl.textContent = "Copied!"; setTimeout(function(){ lbl.textContent = prev; }, 1600); }
        setTimeout(function () { btn.classList.remove("copied"); }, 1600);
      }
    });
  });
})();
