/* Plant catalog: render, search, filter, and lazily pull each species'
   lead image + article link from Wikipedia. Uses the MediaWiki Action API
   (prop=pageimages|info, origin=* for anonymous CORS) which reliably returns
   a page's lead photo at a fixed size. Runs entirely in the visitor's browser;
   no key, no backend. */

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

  var cache = {};
  function fetchWiki(title) {
    if (cache[title]) return cache[title];
    var url =
      "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*" +
      "&redirects=1&prop=pageimages%7Cinfo&inprop=url&piprop=thumbnail&pithumbsize=500" +
      "&titles=" + encodeURIComponent(title);
    cache[title] = fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.query || !j.query.pages) return null;
        var pages = j.query.pages;
        var keys = Object.keys(pages);
        if (!keys.length) return null;
        var pg = pages[keys[0]];           // first (and only) page
        if (pg.missing !== undefined) return null;  // no such article
        return {
          img: pg.thumbnail ? pg.thumbnail.source : null,
          page: pg.fullurl ||
                ("https://en.wikipedia.org/wiki/" + encodeURIComponent(title))
        };
      })
      .catch(function () { return null; });
    return cache[title];
  }

  function hydrate(cardEl) {
    var title = cardEl.getAttribute("data-wiki");
    var thumb = cardEl.querySelector(".thumb");
    var linkWrap = cardEl.querySelector(".links");
    fetchWiki(title).then(function (data) {
      // image
      if (data && data.img && thumb) {
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
        img.onerror = function () { /* keep leaf placeholder */ };
        img.src = data.img;
      }
      // link
      if (!linkWrap) return;
      if (data && data.page) {
        linkWrap.innerHTML =
          '<a href="' + data.page + '" target="_blank" rel="noopener">Wikipedia &#8599;</a>';
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
    if (hydObserver) hydObserver.disconnect();
    if (!("IntersectionObserver" in window)) {
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
