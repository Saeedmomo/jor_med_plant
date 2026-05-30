/* Plant catalog: render, search, filter, and show each species' photo + a
   Wikipedia link.

   Image priority:
     1. a LOCAL image bundled in the repo (assets/img/plants/<slug>.jpg),
        declared per-plant via the "img" field in data.js  -> 100% reliable,
        no external dependency at runtime;
     2. if no local file is present, the lead photo from Wikipedia;
     3. otherwise the leaf placeholder.

   The Wikipedia article link is still fetched (REST summary API) so every
   card links out to its encyclopedia entry. */

(function () {
  var LEAF_PH =
    '<div class="ph"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M24 4C12 9 6 19 6 30c0 8 5 14 14 14 0-12 2-22 18-30C30 9 27 6 24 4Z" fill="#7c8b5a"/>' +
    '<path d="M20 44C24 30 30 20 38 14" stroke="#c9a24b" stroke-width="2" stroke-linecap="round"/>' +
    "</svg></div>";

  function wikiTitle(species, override) {
    if (override) return override;
    return species.replace(/ /g, "_");
  }

  // load `src` into the card's thumb; call onFail() if it can't load
  function setImage(cardEl, src, onFail) {
    var thumb = cardEl.querySelector(".thumb");
    if (!thumb || !src) { if (onFail) onFail(); return; }
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
    img.onerror = function () { if (onFail) onFail(); };
    img.src = src;
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
  var localImg = cardEl.getAttribute("data-img");
  var linkWrap = cardEl.querySelector(".links");

  if (localImg) {
    setImage(cardEl, localImg, function () {
      // If local image fails, Wikipedia fallback below can still work.
    });
  }

  fetchWiki(title).then(function (data) {
    var thumb = cardEl.querySelector(".thumb");
    var hasImg = thumb && thumb.querySelector("img");

    if (!hasImg && data && data.thumbnail && data.thumbnail.source) {
      setImage(cardEl, data.thumbnail.source, null);
    }

    if (!linkWrap) return;

    if (data && data.content_urls && data.content_urls.desktop) {
      linkWrap.innerHTML =
        '<a href="' + data.content_urls.desktop.page +
        '" target="_blank" rel="noopener">Wikipedia &#8599;</a>';
    } else {
      linkWrap.innerHTML =
        '<span class="muted" style="font-weight:600">No Wikipedia entry</span>';
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
    if (p.img) el.setAttribute("data-img", p.img);
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

  var hydObserver;
function observeHydration() {
  document.querySelectorAll(".plant[data-wiki]").forEach(function (c) {
    if (!c.__hyd) {
      c.__hyd = true;
      hydrate(c);
      c.classList.add("in");
    }
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
