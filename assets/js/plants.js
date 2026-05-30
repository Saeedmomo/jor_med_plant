(function () {
  var LEAF_PH =
    '<div class="ph"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M24 4C12 9 6 19 6 30c0 8 5 14 14 14 0-12 2-22 18-30C30 9 27 6 24 4Z" fill="#7c8b5a"/>' +
    '<path d="M20 44C24 30 30 20 38 14" stroke="#c9a24b" stroke-width="2" stroke-linecap="round"/>' +
    "</svg></div>";

  window.JMP_LEAF_PH = LEAF_PH;

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function wikiTitle(species, override) {
    return (override || species).replace(/ /g, "_");
  }

  function photoHtml(p) {
    if (p.img) {
      return (
        '<img src="' + esc(p.img) + '?v=10" ' +
        'alt="' + esc(p.s) + '" ' +
        'loading="lazy" decoding="async" ' +
        'onerror="this.closest(\'.thumb\').innerHTML=window.JMP_LEAF_PH">'
      );
    }
    return LEAF_PH;
  }

  function makeCard(p, opts) {
    opts = opts || {};
    var title = wikiTitle(p.s, p.wiki);

    var extra = "";
    if (opts.featured) {
      extra =
        (p.common ? '<div class="fam">' + esc(p.common) + "</div>" : "") +
        (p.uses ? '<div class="ex">' + esc(p.uses) + "</div>" : "") +
        (p.chem
          ? '<div style="margin-top:6px"><span class="pill">' +
            esc(p.chem.split(",")[0].trim()) +
            "</span></div>"
          : "");
    }

    var el = document.createElement("div");
    el.className = "plant reveal in";

    el.innerHTML =
      '<div class="thumb">' + photoHtml(p) + "</div>" +
      '<div class="body">' +
      '<div class="sci">' + esc(p.s) + "</div>" +
      '<div class="fam">' + esc(p.f || "Unknown") + "</div>" +
      extra +
      '<div class="links">' +
      '<a href="https://en.wikipedia.org/wiki/' + encodeURIComponent(title) + '" target="_blank" rel="noopener">Wikipedia &#8599;</a>' +
      "</div>" +
      "</div>";

    return el;
  }

  window.renderFeatured = function (hostId, limit) {
    var host = document.getElementById(hostId);
    if (!host || !window.JMP) return;

    host.innerHTML = "";
    var list = JMP.featured.slice(0, limit || JMP.featured.length);
    list.forEach(function (p) {
      host.appendChild(makeCard(p, { featured: true }));
    });
  };

  window.initCatalog = function () {
    if (!window.JMP) return;

    var grid = document.getElementById("plantGrid");
    var search = document.getElementById("plantSearch");
    var famSel = document.getElementById("famSelect");
    var note = document.getElementById("catCount");

    if (!grid || !search || !famSel || !note) return;

    famSel.innerHTML = '<option value="">All families</option>';

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
        var okQ =
          !q ||
          p.s.toLowerCase().indexOf(q) !== -1 ||
          (p.f || "").toLowerCase().indexOf(q) !== -1;

        var okF = !fam || p.f === fam;
        return okQ && okF;
      });

      grid.innerHTML = "";
      list.slice(0, 600).forEach(function (p) {
        grid.appendChild(makeCard(p));
      });

      note.textContent = list.length + " species" + (fam ? " in " + fam : "");
    }

    search.addEventListener("input", apply);
    famSel.addEventListener("change", apply);
    apply();
  };
})();
