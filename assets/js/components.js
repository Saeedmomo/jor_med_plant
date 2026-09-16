/* Shared site chrome: injects the header nav + footer into every page,
   handles the mobile menu and scroll-reveal animations.
   To change navigation or footer for the WHOLE site, edit this one file. */

(function () {
  // ---- which links appear in the nav (order matters) ----
  var NAV = [
    ["index.html", "Plant Catalog"],
    ["study.html", "The Study"],
    ["research.html", "Methods & AI"],
    ["discoveries.html", "Discoveries"],
    ["untapped.html", "Untapped Flora"],
    ["about.html", "About"],
    ["collaborate.html", "Contribute", "cta"]
  ];

  // (the leaf mark was removed from the header - the wordmark stands alone)

  var ICON_MENU =
    '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var ICON_CLOSE =
    '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M6 6l12 12M18 6L6 18"/></svg>';

  function current() {
    var p = location.pathname.split("/").pop();
    return p === "" ? "index.html" : p;
  }

  function buildSkipLink() {
    return '<a class="skip-link" href="#main">Skip to main content</a>';
  }

  function buildNav() {
    var cur = current();
    var links = NAV.map(function (l) {
      var cls = [];
      if (l[2] === "cta") cls.push("cta");
      var isCurrent = l[0] === cur;
      if (isCurrent) cls.push("active");
      return '<a href="' + l[0] + '" class="' + cls.join(" ") + '"' +
        (isCurrent ? ' aria-current="page"' : "") + ">" + l[1] + "</a>";
    }).join("");

    return (
      '<header class="nav"><div class="nav-inner">' +
      '<a class="brand" href="index.html">' +
      "<span>Jordan Medicinal Plants</span></a>" +
      '<button class="nav-toggle" type="button" aria-label="Open menu" ' +
      'aria-expanded="false" aria-controls="navLinks" id="navToggle">' + ICON_MENU + "</button>" +
      '<nav class="nav-links" id="navLinks" aria-label="Primary">' + links + "</nav>" +
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
      '<a href="https://www.linkedin.com/in/said-moshawih-636a3097/" target="_blank" rel="noopener">LinkedIn profile &#8599;</a>' +
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
    if (navHost) navHost.insertAdjacentHTML("beforebegin", buildSkipLink());
    if (navHost) navHost.innerHTML = buildNav();
    if (footHost) footHost.innerHTML = buildFooter();

    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (!toggle || !links) return;

    function setOpen(open) {
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      toggle.innerHTML = open ? ICON_CLOSE : ICON_MENU;
    }

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!links.classList.contains("open"));
    });

    // choosing a destination closes the menu
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    // Escape returns focus to the control that opened the menu
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    // a tap anywhere outside dismisses it
    document.addEventListener("click", function (e) {
      if (links.classList.contains("open") && !links.contains(e.target)) setOpen(false);
    });

    // returning to desktop width must clear the mobile-open state
    if (window.matchMedia) {
      var wide = window.matchMedia("(min-width: 941px)");
      var onWide = function (m) { if (m.matches) setOpen(false); };
      if (wide.addEventListener) wide.addEventListener("change", onWide);
      else if (wide.addListener) wide.addListener(onWide);
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
