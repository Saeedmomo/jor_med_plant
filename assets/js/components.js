/* Shared site chrome: injects the header nav + footer into every page,
   handles the mobile menu and scroll-reveal animations.
   To change navigation or footer for the WHOLE site, edit this one file. */

(function () {
  // ---- which links appear in the nav (order matters) ----
  var NAV = [
    ["index.html", "Home"],
    ["plants.html", "Plant Catalog"],
    ["untapped.html", "Untapped Flora"],
    ["research.html", "Methods & AI"],
    ["discoveries.html", "Discoveries"],
    ["about.html", "About"],
    ["collaborate.html", "Contribute", "cta"]
  ];

  var LEAF =
    '<svg class="mark" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M24 4C12 9 6 19 6 30c0 8 5 14 14 14 0-12 2-22 18-30C30 9 27 6 24 4Z" fill="#2f6b4f"/>' +
    '<path d="M20 44C24 30 30 20 38 14" stroke="#c9a24b" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M20 44c-1-9 1-18 8-26" stroke="#f7f1e3" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>' +
    "</svg>";

  function current() {
    var p = location.pathname.split("/").pop();
    return p === "" ? "index.html" : p;
  }

  function buildNav() {
    var cur = current();
    var links = NAV.map(function (l) {
      var cls = [];
      if (l[2] === "cta") cls.push("cta");
      if (l[0] === cur) cls.push("active");
      return '<a href="' + l[0] + '" class="' + cls.join(" ") + '">' + l[1] + "</a>";
    }).join("");

    return (
      '<header class="nav"><div class="nav-inner">' +
      '<a class="brand" href="index.html">' + LEAF +
      "<span>Jordan Medicinal Plants</span></a>" +
      '<button class="nav-toggle" aria-label="Menu" id="navToggle">&#9776;</button>' +
      '<nav class="nav-links" id="navLinks">' + links + "</nav>" +
      "</div></header>"
    );
  }

  function buildFooter() {
    var col2 = NAV.map(function (l) {
      return '<a href="' + l[0] + '">' + l[1] + "</a>";
    }).join("");
    return (
      '<footer class="footer"><div class="wrap"><div class="cols">' +
      "<div><h4>Jordan Medicinal Plants Database</h4>" +
      '<p style="color:#cfd6b7;max-width:42ch">An open cheminformatic and network-pharmacology resource cataloguing the secondary metabolites of Jordan&rsquo;s flora and their therapeutic potential.</p>' +
      '<p style="font-size:.85rem;color:#bcc6a6">Al-Ahliyya Amman University, Faculty of Pharmacy &middot; Open Access &middot; CC BY 4.0</p></div>' +
      '<div><h4>Explore</h4><div class="fnav">' + col2 + "</div></div>" +
      '<div><h4>Resources</h4><div class="fnav">' +
      '<a href="https://saeedmomo.github.io/jor_med_plant/" target="_blank" rel="noopener">Live project site &#8599;</a>' +
      '<a href="https://github.com/Saeedmomo/jor_med_plant" target="_blank" rel="noopener">GitHub repository &#8599;</a>' +
      '<a href="https://coconut.naturalproducts.net/" target="_blank" rel="noopener">COCONUT database &#8599;</a>' +
      '<a href="https://www.ebi.ac.uk/chembl/" target="_blank" rel="noopener">ChEMBL &#8599;</a>' +
      "</div></div>" +
      "</div>" +
      '<div class="fine"><span>&copy; ' + new Date().getFullYear() +
      " Jordan Medicinal Plants Project. Built for research, education &amp; the public.</span>" +
      "<span>Plant imagery &amp; summaries via Wikipedia / Wikimedia Commons (CC BY-SA).</span></div>" +
      "</div></footer>"
    );
  }

  function mountChrome() {
    var navHost = document.getElementById("site-nav");
    var footHost = document.getElementById("site-footer");
    if (navHost) navHost.innerHTML = buildNav();
    if (footHost) footHost.innerHTML = buildFooter();

    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        links.classList.toggle("open");
      });
    }
  }

  function setupReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    mountChrome();
    setupReveal();
  });
})();
