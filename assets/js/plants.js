/* Plant catalog: render, search, filter, and lazily pull each species'
   lead image + one-line summary + article link from the public Wikipedia
   REST API (CORS-enabled, no key needed). Runs in the visitor's browser. */

(function () {
  var LEAF_PH =
    '<div class="ph"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M24 4C12 9 6 19 6 30c0 8 5 14 14 14 0-12 2-22 18-30C30 9 27 6 24 4Z" fill="#7c8b5a"/>' +
    '<path d="M20 44C24 30 30 20 38 14" stroke="#c9a24b" stroke-width="2" stroke-linecap="round"/>' +
    "</svg></div>";

  // species -> chosen Wikipedia title (defaults to species name with spaces->_)
  function wikiTitle(species, override) {
    if (override) return override;
    return species.replace(/ /g, "_");
  }

  // Pick the best image URL from a REST summary payload and, when it is a
  // standard MediaWiki thumbnail, bump the requested width so cards look sharp.
  function pickImage(data) {
    var src = null;
    if (data && data.thumbnail && data.thumbnail.source) src = data.thumbnail.source;
    else if (data && data.originalimage && data.originalimage.source) src = data.originalimage.source;
    if (!src) return null;
    // upscale the default ~240-320px thumb to 500px when the URL exposes a width
    src = src.replace(/\/(\d+)px-/, "/500px-");
    return src;
  }

  var cache = {};
  function fetchWiki(title) {
    if (cache[title]) return cache[title];
    var url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title);
    cache[title] = fetch(url, { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
    return cache[title];
  }

  function hydrate(cardEl) {
    var title = cardEl.getAttribute("data-wiki");
    var thumb = cardEl.querySelector(".thumb");
    var linkWrap = cardEl.querySelector(".links");
    fetchWiki(title).then(function (data) {
      var src = pickImage(data);
      if (src && thumb) {
        var img = new Image();
        img.alt = cardEl.getAttribute("data-species") || "";
        img.loading = "lazy";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";
        img.className = "wikifade";
        img.onload = function () {
          thumb.innerHTML = "";
          thumb.appendChild(img);
          requestAnimationFrame(function () { img.classList.add("in"); });
        };
        img.onerror = function () { /* keep the leaf placeholder on failure */ };
        img.src = src;
      }
      if (data && data.content_urls && data.content_urls.desktop && linkWrap) {
        var page = data.content_urls.desktop.page;
        linkWrap.innerHTML =
          '<a href="' + page + '" target="_blank" rel="noopener">Wikipedia &#8599;</a>';
      } else if (linkWrap) {
        linkWrap.innerHTML = '<span class="muted" style="font-weight:600">No Wikipedia entry</span>';
      }
    });
  }

  function makeCard(p, opts) {
    opts = opts || {};
    var title = wikiTitle(p.s, p.wiki);
    var extra = "";
    if (opts.featured) {
      extra =
        (p.common ? '<div class="fam">' + p.common + "</div>" : "") +
        (p.uses ? '<div class="ex">' + p.uses + "</div>" : "") +
        (p.chem ? '<div style="margin-top:6px"><span class="pill">' + p.chem.split(",")[0].trim() + "</span></div>" : "");
    }
    var el = document.createElement("div");
    el.className = "plant reveal";
    el.setAttribute("data-wiki", title);
    el.setAttribute("data-species", p.s);
    el.innerHTML =
      '<div class="thumb">' + LEAF_PH + "</div>" +
      '<div class="body">' +
      '<div class="sci">' + p.s + "</div>" +
      '<div class="fam">' + (p.f || "Unknown") + "</div>" +
      extra +
      '<div class="links"><span class="muted">loading&hellip;</span></div>' +
      "</div>";
    return el;
  }

  // lazy-hydrate cards as they scroll into view (avoids hammering the API)
  var hydObserver;
  function observeHydration() {
    if (hydObserver) hydObserver.disconnect();
    if (!("IntersectionObserver" in window)) {
      // fallback: hydrate everything immediately
      document.querySelectorAll(".plant[data-wiki]").forEach(function (c) {
        if (!c.__hyd) { c.__hyd = true; hydrate(c); c.classList.add("in"); }
      });
      return;
    }
    hydObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          hydrate(en.target);
          en.target.classList.add("in");
          hydObserver.unobserve(en.target);
        }
      });
    }, { rootMargin: "300px" });
    document.querySelectorAll(".plant[data-wiki]").forEach(function (c) {
      if (!c.__hyd) { c.__hyd = true; hydObserver.observe(c); }
    });
  }

  // ---------- Featured strip (home + plants page) ----------
  window.renderFeatured = function (hostId, limit) {
    var host = document.getElementById(hostId);
    if (!host || !window.JMP) return;
    var list = JMP.featured.slice(0, limit || JMP.featured.length);
    list.forEach(function (p) { host.appendChild(makeCard(p, { featured: true })); });
    observeHydration();
  };

  // ---------- Full searchable catalog ----------
  window.initCatalog = function () {
    if (!window.JMP) return;
    var grid = document.getElementById("plantGrid");
    var search = document.getElementById("plantSearch");
    var famSel = document.getElementById("famSelect");
    var note = document.getElementById("catCount");

    // family dropdown
    JMP.families.forEach(function (f) {
      var o = document.createElement("option");
      o.value = f[0];
      o.textContent = f[0] + " (" + f[1] + ")";
      famSel.appendChild(o);
    });

    function apply() {
      var q = (search.value || "").trim().toLowerCase();
      var fam = famSel.value;
      var list = JMP.plants.filter(function (p) {
        var okQ = !q || p.s.toLowerCase().indexOf(q) !== -1 || (p.f || "").toLowerCase().indexOf(q) !== -1;
        var okF = !fam || p.f === fam;
        return okQ && okF;
      });
      grid.innerHTML = "";
      list.slice(0, 600).forEach(function (p) { grid.appendChild(makeCard(p)); });
      note.textContent = list.length + " species" + (fam ? " in " + fam : "");
      observeHydration();
    }

    search.addEventListener("input", apply);
    famSel.addEventListener("change", apply);
    apply();
  };
})();
