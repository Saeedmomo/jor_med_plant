/* Jordan Medicinal Plants — catalog engine
   Renders the enriched ethnobotanical catalog (window.JMP_PLANTS):
   rich cards, per-plant detail table (modal), a full sortable data table,
   live Wikipedia photography, and data-driven figures.
   Falls back gracefully to the basic list (window.JMP.plants). */
(function () {
  var LEAF_PH =
    '<div class="ph"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M24 4C12 9 6 19 6 30c0 8 5 14 14 14 0-12 2-22 18-30C30 9 27 6 24 4Z" fill="#7c8b5a"/>' +
    '<path d="M20 44C24 30 30 20 38 14" stroke="#c9a24b" stroke-width="2" stroke-linecap="round"/>' +
    "</svg></div>";
  window.JMP_LEAF_PH = LEAF_PH;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function wikiTitle(species, override) {
    return (override || species).replace(/ /g, "_");
  }

  /* ---------- live Wikipedia summary (thumbnail + extract), cached ---------- */
  var wikiCache = {};
  function fetchWiki(title, cb) {
    if (wikiCache[title]) { cb(wikiCache[title]); return; }
    var url = "https://en.wikipedia.org/api/rest_v1/page/summary/" +
      encodeURIComponent(title) + "?redirect=true";
    fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var out = null;
        if (d && !d.type || (d && d.type && d.type.indexOf("not_found") === -1)) {
          out = {
            thumb: d && d.thumbnail ? d.thumbnail.source : null,
            extract: d && d.extract ? d.extract : null,
            page: d && d.content_urls ? d.content_urls.desktop.page : null
          };
        }
        wikiCache[title] = out || {};
        cb(wikiCache[title]);
      }).catch(function () { wikiCache[title] = {}; cb({}); });
  }

  /* lazy-load thumbnails only when a card scrolls into view */
  var thumbObserver = ("IntersectionObserver" in window) ?
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; thumbObserver.unobserve(el);
        var title = el.getAttribute("data-wiki");
        fetchWiki(title, function (w) {
          if (w && w.thumb) {
            var img = new Image();
            img.onload = function () {
              el.style.backgroundImage = "url('" + w.thumb + "')";
              el.classList.add("has-photo");
            };
            img.src = w.thumb;
          }
        });
      });
    }, { rootMargin: "300px" }) : null;

  /* ---------- featured cards (curated, local images) ---------- */
  function makeFeatured(p) {
    var title = wikiTitle(p.s, p.wiki);
    var el = document.createElement("div");
    el.className = "plant reveal in";
    el.innerHTML =
      '<div class="thumb"><img src="' + esc(p.img) + '?v=11" alt="' + esc(p.s) +
      '" loading="lazy" decoding="async" onerror="this.closest(\'.thumb\').innerHTML=window.JMP_LEAF_PH"></div>' +
      '<div class="body">' +
      '<div class="sci">' + esc(p.s) + "</div>" +
      '<div class="fam">' + esc(p.f || "") + "</div>" +
      (p.common ? '<div class="common">' + esc(p.common) + "</div>" : "") +
      (p.uses ? '<div class="ex">' + esc(p.uses) + "</div>" : "") +
      (p.chem ? '<div class="chips"><span class="pill">' + esc(p.chem.split(",")[0].trim()) + "</span></div>" : "") +
      '<div class="links"><a href="https://en.wikipedia.org/wiki/' +
      encodeURIComponent(title) + '" target="_blank" rel="noopener">Wikipedia &#8599;</a></div>' +
      "</div>";
    return el;
  }
  window.renderFeatured = function (hostId, limit) {
    var host = document.getElementById(hostId);
    if (!host || !window.JMP || !JMP.featured) return;
    host.innerHTML = "";
    JMP.featured.slice(0, limit || JMP.featured.length).forEach(function (p) {
      host.appendChild(makeFeatured(p));
    });
  };

  /* ---------- enriched catalog data ---------- */
  function catalogData() {
    if (window.JMP_PLANTS && JMP_PLANTS.length) return JMP_PLANTS;
    return (window.JMP && JMP.plants) || [];
  }

  function makeCatalogCard(p) {
    var title = wikiTitle(p.s, p.wiki);
    var el = document.createElement("article");
    el.className = "plant plant-clickable reveal in";
    var thumb = '<div class="thumb lazy-thumb" data-wiki="' + esc(title) + '">' + LEAF_PH + "</div>";
    var chips = "";
    if (p.chem) {
      chips = '<div class="chips">' + p.chem.split(/[,;·]/).slice(0, 2).map(function (c) {
        c = c.trim(); return c ? '<span class="pill sm">' + esc(c) + "</span>" : "";
      }).join("") + "</div>";
    }
    el.innerHTML =
      thumb +
      '<div class="body">' +
      (p.ar ? '<div class="ar" dir="rtl" lang="ar">' + esc(p.ar) + "</div>" : "") +
      '<div class="sci">' + esc(p.s) + "</div>" +
      '<div class="fam">' + esc(p.f || "") + (p.en ? ' &middot; ' + esc(p.en) : "") + "</div>" +
      (p.uses ? '<div class="ex">' + esc(p.uses) + "</div>" : "") +
      chips +
      "</div>" +
      '<div class="card-tag">Details &rarr;</div>';
    el.addEventListener("click", function () { openDetail(p); });
    if (thumbObserver) {
      var lz = el.querySelector(".lazy-thumb");
      if (lz) thumbObserver.observe(lz);
    }
    return el;
  }

  /* ---------- detail modal (a table + figure per plant) ---------- */
  function ensureModal() {
    var m = document.getElementById("plantModal");
    if (m) return m;
    m = document.createElement("div");
    m.id = "plantModal";
    m.className = "modal";
    m.innerHTML =
      '<div class="modal-backdrop"></div>' +
      '<div class="modal-card" role="dialog" aria-modal="true">' +
      '<button class="modal-close" aria-label="Close">&times;</button>' +
      '<div class="modal-body"></div>' +
      "</div>";
    document.body.appendChild(m);
    function close() { m.classList.remove("open"); document.body.style.overflow = ""; }
    m.querySelector(".modal-backdrop").addEventListener("click", close);
    m.querySelector(".modal-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    return m;
  }

  function row(label, val, isAr) {
    if (!val) return "";
    return '<tr><th scope="row">' + esc(label) + "</th><td" +
      (isAr ? ' dir="rtl" lang="ar" class="ar-cell"' : "") + ">" + esc(val) + "</td></tr>";
  }

  function openDetail(p) {
    var m = ensureModal();
    var title = wikiTitle(p.s, p.wiki);
    var body = m.querySelector(".modal-body");
    var chemChips = p.chem ? '<div class="chips" style="margin-top:10px">' +
      p.chem.split(/[,;·]/).map(function (c) {
        c = c.trim(); return c ? '<span class="pill sm">' + esc(c) + "</span>" : "";
      }).join("") + "</div>" : "";
    body.innerHTML =
      '<div class="modal-hero">' +
      '<div class="modal-fig lazy-thumb" data-wiki="' + esc(title) + '">' + LEAF_PH + "</div>" +
      '<div class="modal-head">' +
      (p.ar ? '<div class="ar big" dir="rtl" lang="ar">' + esc(p.ar) + "</div>" : "") +
      '<h2 class="sci" style="margin:.1em 0 .1em">' + esc(p.s) + "</h2>" +
      '<div class="fam">' + esc(p.f || "") + (p.en ? " &middot; " + esc(p.en) : "") + "</div>" +
      chemChips +
      "</div></div>" +
      '<p class="modal-extract muted">Loading botanical summary&hellip;</p>' +
      '<table class="data kv">' +
      row("Latin name", p.s) +
      row("Arabic name", p.ar, true) +
      row("Common name", p.en) +
      row("Family", p.f) +
      row("Part used", p.part) +
      row("Region in Jordan", p.region) +
      row("Traditional uses", p.uses) +
      row("Main chemical constituents", p.chem) +
      row("Reference", p.ref) +
      "</table>" +
      '<div class="modal-links">' +
      '<a class="btn btn-ghost" href="https://en.wikipedia.org/wiki/' + encodeURIComponent(title) +
      '" target="_blank" rel="noopener">Wikipedia &#8599;</a> ' +
      '<a class="btn btn-ghost" href="https://www.gbif.org/species/search?q=' +
      encodeURIComponent(p.s) + '" target="_blank" rel="noopener">GBIF &#8599;</a></div>';

    // fill figure + extract live
    var fig = body.querySelector(".modal-fig");
    var extract = body.querySelector(".modal-extract");
    fetchWiki(title, function (w) {
      if (w && w.thumb) {
        fig.style.backgroundImage = "url('" + w.thumb + "')";
        fig.classList.add("has-photo");
      }
      extract.textContent = (w && w.extract) ? w.extract :
        "No public botanical summary available for this species yet.";
    });

    m.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  /* ---------- full table view ---------- */
  function renderTable(host, list) {
    var h = '<div class="table-scroll"><table class="data catalog-table"><thead><tr>' +
      "<th>Arabic</th><th>Latin name</th><th>Common</th><th>Family</th>" +
      "<th>Part</th><th>Traditional uses</th><th>Main constituents</th></tr></thead><tbody>";
    list.forEach(function (p) {
      h += "<tr class='tr-click'>" +
        '<td dir="rtl" lang="ar" class="ar-cell">' + esc(p.ar || "—") + "</td>" +
        '<td class="sci">' + esc(p.s) + "</td>" +
        "<td>" + esc(p.en || "—") + "</td>" +
        "<td>" + esc(p.f || "—") + "</td>" +
        "<td>" + esc(p.part || "—") + "</td>" +
        "<td>" + esc(p.uses || "—") + "</td>" +
        "<td>" + esc(p.chem || "—") + "</td></tr>";
    });
    h += "</tbody></table></div>";
    host.innerHTML = h;
    var rows = host.querySelectorAll("tr.tr-click");
    rows.forEach(function (tr, i) {
      tr.addEventListener("click", function () { openDetail(list[i]); });
    });
  }

  /* ---------- catalog controller ---------- */
  window.initCatalog = function () {
    var data = catalogData();
    var grid = document.getElementById("plantGrid");
    var search = document.getElementById("plantSearch");
    var famSel = document.getElementById("famSelect");
    var note = document.getElementById("catCount");
    var viewBtns = document.querySelectorAll("[data-view]");
    if (!grid || !search || !famSel) return;

    // families dropdown
    var fams = {};
    data.forEach(function (p) { if (p.f) fams[p.f] = (fams[p.f] || 0) + 1; });
    Object.keys(fams).sort().forEach(function (f) {
      var o = document.createElement("option");
      o.value = f; o.textContent = f + " (" + fams[f] + ")";
      famSel.appendChild(o);
    });

    var mode = "grid";
    var onlyDoc = false;
    var docToggle = document.getElementById("docToggle");
    if (docToggle) docToggle.addEventListener("change", function () { onlyDoc = docToggle.checked; apply(); });

    function apply() {
      var q = (search.value || "").trim().toLowerCase();
      var fam = famSel.value;
      var list = data.filter(function (p) {
        var hay = (p.s + " " + (p.f || "") + " " + (p.ar || "") + " " +
          (p.en || "") + " " + (p.uses || "") + " " + (p.chem || "")).toLowerCase();
        var okQ = !q || hay.indexOf(q) !== -1;
        var okF = !fam || p.f === fam;
        var okD = !onlyDoc || (p.uses && p.chem);
        return okQ && okF && okD;
      });
      if (mode === "table") { renderTable(grid, list); }
      else {
        grid.innerHTML = "";
        grid.className = "plant-grid";
        list.forEach(function (p) { grid.appendChild(makeCatalogCard(p)); });
      }
      if (note) note.textContent = list.length + " species" + (fam ? " in " + fam : "");
    }

    search.addEventListener("input", apply);
    famSel.addEventListener("change", apply);
    viewBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        viewBtns.forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        mode = b.getAttribute("data-view");
        grid.className = mode === "table" ? "" : "plant-grid";
        apply();
      });
    });
    apply();
  };

  /* ---------- data-driven figures (families + metabolite classes) ---------- */
  window.renderCatalogFigures = function () {
    var data = catalogData();
    // families
    var fams = {};
    data.forEach(function (p) { if (p.f) fams[p.f] = (fams[p.f] || 0) + 1; });
    var famTop = Object.keys(fams).map(function (k) { return [k, fams[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 12);
    barFigure("famFigure", famTop, "var(--green)");

    // metabolite classes (parse chem field)
    var classes = {};
    var keys = ["Flavonoid", "Alkaloid", "Terpen", "Phenolic", "Saponin", "Tannin",
      "Glycoside", "Essential oil", "Coumarin", "Sesquiterpene", "Anthraquinone",
      "Iridoid", "Sterol", "Polysaccharide", "Lignan"];
    data.forEach(function (p) {
      if (!p.chem) return;
      var c = p.chem.toLowerCase();
      keys.forEach(function (k) {
        var probe = k.toLowerCase().replace(/s$/, "");
        if (c.indexOf(probe) !== -1) classes[k] = (classes[k] || 0) + 1;
      });
    });
    var clsTop = Object.keys(classes).map(function (k) { return [k, classes[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; });
    barFigure("chemFigure", clsTop, "var(--clay)");
  };

  function barFigure(id, pairs, color) {
    var host = document.getElementById(id);
    if (!host || !pairs.length) return;
    var max = pairs[0][1];
    host.innerHTML = pairs.map(function (p) {
      var w = Math.max(6, Math.round((p[1] / max) * 100));
      return '<div class="bar-row"><span class="bar-lbl">' + esc(p[0]) + "</span>" +
        '<span class="bar-track"><span class="bar-fill" style="width:' + w + "%;background:" + color + '"></span></span>' +
        '<span class="bar-val">' + p[1] + "</span></div>";
    }).join("");
  }
})();
