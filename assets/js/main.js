// ---- Site settings ----
const SITE_SETTINGS = {
  goatcounterCode: "abuhazafa",
  formspreeId: "xnpnqpby",
};

// ---- Footer year ----
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Light / dark theme toggle ----
const root = document.documentElement;
const themeButton = document.getElementById("theme-toggle");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function currentTheme() {
  return root.getAttribute("data-theme") || (systemDark.matches ? "dark" : "light");
}

function updateThemeIcon() {
  const dark = currentTheme() === "dark";
  themeButton.innerHTML = dark
    ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
    : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
  themeButton.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
}

themeButton.addEventListener("click", function () {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch (e) { /* storage blocked */ }
  updateThemeIcon();
});

systemDark.addEventListener("change", updateThemeIcon);
updateThemeIcon();

// ---- Mobile menu ----
const nav = document.getElementById("site-nav");
const navButton = document.getElementById("nav-toggle");

function setMenu(open) {
  if (open) setTranslatePanel(false);
  nav.classList.toggle("open", open);
  navButton.setAttribute("aria-expanded", String(open));
  navButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  navButton.innerHTML = open
    ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
    : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
}

navButton.addEventListener("click", function () {
  setMenu(!nav.classList.contains("open"));
});

nav.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () { setMenu(false); });
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    setMenu(false);
    setTranslatePanel(false);
  }
});

// ---- Google Translate ----
const translateButton = document.getElementById("translate-toggle");
const translatePanel = document.getElementById("translate-panel");
const translateBox = document.getElementById("google_translate_element");
let translateScriptAdded = false;

window.googleTranslateInit = function () {
  translateBox.textContent = "";
  new google.translate.TranslateElement(
    { pageLanguage: "en", autoDisplay: false },
    "google_translate_element"
  );
};

function loadTranslateScript() {
  if (translateScriptAdded) return;
  translateScriptAdded = true;
  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateInit";
  script.onerror = function () {
    translateBox.textContent = "Google Translate could not be loaded. Please try again later.";
  };
  document.body.appendChild(script);
}

function setTranslatePanel(open) {
  if (open) setMenu(false);
  translatePanel.hidden = !open;
  translateButton.setAttribute("aria-expanded", String(open));
  if (open) loadTranslateScript();
}

translateButton.addEventListener("click", function () {
  setTranslatePanel(translatePanel.hidden);
});

document.addEventListener("click", function (event) {
  if (translatePanel.hidden) return;
  if (!translatePanel.contains(event.target) && !translateButton.contains(event.target)) {
    setTranslatePanel(false);
  }
});

document.getElementById("translate-reset").addEventListener("click", function () {
  const expired = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = expired;
  document.cookie = expired + "; domain=" + location.hostname;
  document.cookie = expired + "; domain=." + location.hostname;
  location.reload();
});

if (/(^|;\s*)googtrans=\/[^/;]+\/(?!en\b)/.test(document.cookie)) {
  loadTranslateScript();
}

// ---- Background artwork ----
const bgArt = document.querySelector(".bg-art svg");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let bgFramePending = false;

function moveBackground() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  bgArt.style.transform = "translate3d(0, " + (-progress * 20).toFixed(2) + "vh, 0)";
  bgFramePending = false;
}

window.addEventListener("scroll", function () {
  if (reduceMotion.matches || bgFramePending) return;
  bgFramePending = true;
  requestAnimationFrame(moveBackground);
}, { passive: true });

// ---- Highlight the nav link of the section on screen ----
const navLinks = Array.from(nav.querySelectorAll("a"));
const sections = navLinks
  .map(function (link) { return document.querySelector(link.getAttribute("href")); })
  .filter(Boolean);

const observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (!entry.isIntersecting) return;
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
    });
  });
}, { rootMargin: "-45% 0px -50% 0px" });

sections.forEach(function (section) { observer.observe(section); });

// ---- Publication filter ----
const filterBar = document.querySelector(".pub-filters");
const filterButtons = filterBar.querySelectorAll("button");
const pubYears = document.querySelectorAll("#publications .pub-year");

function applyPubFilter(filter) {
  filterButtons.forEach(function (button) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  });

  pubYears.forEach(function (yearBlock) {
    let visibleCount = 0;
    yearBlock.querySelectorAll(".pub").forEach(function (pub) {
      const show =
        filter === "all" ||
        (filter === "selected" && pub.dataset.selected === "true") ||
        pub.dataset.topic === filter;
      pub.hidden = !show;
      if (show) visibleCount += 1;
    });
    yearBlock.hidden = visibleCount === 0;
  });
}

filterButtons.forEach(function (button) {
  button.addEventListener("click", function () { applyPubFilter(button.dataset.filter); });
});

filterBar.hidden = false;
applyPubFilter("selected");

// ---- Email address ----
document.querySelectorAll(".js-email").forEach(function (link) {
  const address = link.dataset.user + "@" + link.dataset.domain;
  link.href = "mailto:" + address;
  const text = link.querySelector(".js-email-text");
  if (text) text.textContent = address;
});

// ---- Contact form (Formspree) ----
if (SITE_SETTINGS.formspreeId) {
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("cf-status");
  const formButton = document.getElementById("cf-submit");
  contactForm.action = "https://formspree.io/f/" + SITE_SETTINGS.formspreeId;
  contactForm.hidden = false;
  document.getElementById("contact-grid").classList.add("has-form");

  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    formButton.disabled = true;
    formStatus.textContent = "Sending…";
    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Formspree answered " + response.status);
      contactForm.reset();
      formStatus.textContent = "Thank you. Your message has been sent.";
    } catch (error) {
      formStatus.textContent = "Sorry, the message could not be sent. Please use the email button instead.";
    } finally {
      formButton.disabled = false;
    }
  });
}

// ---- Visitor statistics ----
const onOwnComputer = location.protocol === "file:" ||
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

if (SITE_SETTINGS.goatcounterCode && !onOwnComputer) {
  const counter = document.createElement("script");
  counter.async = true;
  counter.src = "https://gc.zgo.at/count.js";
  counter.dataset.goatcounter = "https://" + SITE_SETTINGS.goatcounterCode + ".goatcounter.com/count";
  document.body.appendChild(counter);
}

// ---- Citations ----
const citeDialog = document.getElementById("cite-dialog");
const citeOutput = document.getElementById("cite-output");
const citeStatus = document.getElementById("cite-status");
const citeTabs = citeDialog.querySelectorAll("[role=tab]");
const publications = {};
const publicationOrder = [];
let openRecord = null;
let openFormat = "apa";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function recordLink(p) {
  return p.doi ? "https://doi.org/" + p.doi : p.url;
}

// APA 7th edition
function formatApa(p) {
  const names = p.authors.map(function (a) { return escapeHtml(a.family + ", " + a.given); });
  let authors;
  if (names.length === 1) {
    authors = names[0];
  } else if (names.length <= 20) {
    authors = names.slice(0, -1).join(", ") + ", &amp; " + names[names.length - 1];
  } else {
    authors = names.slice(0, 19).join(", ") + ", . . . " + names[names.length - 1];
  }
  const start = authors + " (" + p.year + "). ";
  const title = escapeHtml(p.title);
  const container = escapeHtml(p.container);
  const pages = p.firstPage ? p.firstPage + "–" + p.lastPage : "";

  if (p.type === "preprint") {
    return start + "<i>" + title + "</i> [Preprint]. " + container + ". " + recordLink(p);
  }
  if (p.type === "chapter") {
    return start + title + ". In <i>" + container + "</i>" + (pages ? " (pp. " + pages + ")" : "") +
      ". " + escapeHtml(p.publisher) + ". " + recordLink(p);
  }
  let source = "<i>" + container + "</i>";
  if (p.volume) source += ", <i>" + escapeHtml(p.volume) + "</i>";
  if (p.issue) source += "(" + escapeHtml(p.issue) + ")";
  if (pages) source += ", " + pages;
  else if (p.article) source += ", Article " + escapeHtml(p.article);
  return start + title + ". " + source + ". " + recordLink(p);
}

function bibtexValue(text) {
  return String(text).replace(/([&%$#_])/g, "\\$1");
}

function formatBibtex(p) {
  const entryType = { article: "article", chapter: "incollection", preprint: "misc" }[p.type];
  const fields = [];
  fields.push(["author", p.authors.map(function (a) { return a.family + ", " + a.given; }).join(" and ")]);
  fields.push(["title", "{" + p.title + "}"]);
  if (p.type === "chapter") {
    fields.push(["booktitle", p.container]);
    fields.push(["publisher", p.publisher]);
  } else if (p.type === "preprint") {
    fields.push(["howpublished", p.container]);
    fields.push(["note", "Preprint"]);
  } else {
    fields.push(["journal", p.container]);
  }
  fields.push(["year", String(p.year)]);
  if (p.volume) fields.push(["volume", p.volume]);
  if (p.issue) fields.push(["number", p.issue]);
  if (p.firstPage) fields.push(["pages", p.firstPage + "--" + p.lastPage]);
  else if (p.article) fields.push(["pages", p.article]);
  if (p.doi) fields.push(["doi", p.doi]);
  if (p.url) fields.push(["url", p.url]);
  if (p.pmid) fields.push(["pmid", p.pmid]);
  const lines = fields.map(function (f) {
    return "  " + f[0].padEnd(12) + " = {" + bibtexValue(f[1]) + "}";
  });
  return "@" + entryType + "{" + p.id + ",\n" + lines.join(",\n") + "\n}";
}

// RIS
function formatRis(p) {
  const lines = [];
  function add(tag, value) {
    if (value) lines.push(tag + "  - " + value);
  }
  add("TY", { article: "JOUR", chapter: "CHAP", preprint: "UNPB" }[p.type]);
  p.authors.forEach(function (a) { add("AU", a.family + ", " + a.given); });
  add("TI", p.title);
  add("T2", p.container);
  add("PY", String(p.year));
  add("VL", p.volume);
  add("IS", p.issue);
  add("SP", p.firstPage || p.article);
  add("EP", p.lastPage);
  add("PB", p.publisher);
  add("DO", p.doi);
  add("UR", recordLink(p));
  lines.push("ER  - ");
  return lines.join("\r\n");
}

const CITATION_FORMATS = {
  apa:    { make: formatApa,    extension: "txt", mime: "text/plain" },
  bibtex: { make: formatBibtex, extension: "bib", mime: "application/x-bibtex" },
  ris:    { make: formatRis,    extension: "ris", mime: "application/x-research-info-systems" },
};

function citationText(format, record) {
  const text = CITATION_FORMATS[format].make(record);
  if (format !== "apa") return text;
  const holder = document.createElement("div");
  holder.innerHTML = text;
  return holder.textContent;
}

function saveFile(fileName, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime + ";charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function downloadAll(format) {
  const records = publicationOrder.map(function (id) { return publications[id]; });
  let text;
  if (format === "apa") {
    text = "Abu Hazafa: publications (APA 7th edition)\n\n" +
      records.map(function (p) { return citationText("apa", p); }).join("\n\n") + "\n";
  } else if (format === "ris") {
    text = records.map(formatRis).join("\r\n\r\n") + "\r\n";
  } else {
    text = records.map(formatBibtex).join("\n\n") + "\n";
  }
  saveFile("Abu_Hazafa_publications." + CITATION_FORMATS[format].extension, text,
    CITATION_FORMATS[format].mime);
}

function showCitation(format) {
  openFormat = format;
  citeStatus.textContent = "";
  citeTabs.forEach(function (tab) {
    tab.setAttribute("aria-selected", String(tab.dataset.format === format));
  });
  if (format === "apa") {
    citeOutput.innerHTML = "<p>" + formatApa(openRecord) + "</p>";
  } else {
    const pre = document.createElement("pre");
    pre.textContent = CITATION_FORMATS[format].make(openRecord);
    citeOutput.replaceChildren(pre);
  }
}

citeTabs.forEach(function (tab) {
  tab.addEventListener("click", function () { showCitation(tab.dataset.format); });
});

document.getElementById("cite-close").addEventListener("click", function () {
  citeDialog.close();
});

citeDialog.addEventListener("click", function (event) {
  if (event.target === citeDialog) citeDialog.close();
});

document.getElementById("cite-copy").addEventListener("click", async function () {
  const text = citationText(openFormat, openRecord);
  try {
    if (openFormat === "apa" && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([formatApa(openRecord)], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      })]);
    } else {
      await navigator.clipboard.writeText(text);
    }
    citeStatus.textContent = "Copied";
  } catch (error) {
    const range = document.createRange();
    range.selectNodeContents(citeOutput);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    let copied = false;
    try { copied = document.execCommand("copy"); } catch (e) { copied = false; }
    citeStatus.textContent = copied ? "Copied" : "Text selected: press Ctrl+C to copy";
  }
});

document.getElementById("cite-download").addEventListener("click", function () {
  const format = CITATION_FORMATS[openFormat];
  saveFile(openRecord.id + "." + format.extension, citationText(openFormat, openRecord), format.mime);
});

fetch("assets/data/publications.json", { cache: "no-cache" })
  .then(function (response) {
    if (!response.ok) throw new Error("publications.json: " + response.status);
    return response.json();
  })
  .then(function (records) {
    records.forEach(function (p) { publications[p.id] = p; });

    document.querySelectorAll("#publications li[data-cite]").forEach(function (item) {
      const id = item.dataset.cite;
      if (!publications[id]) return;
      publicationOrder.push(id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pub-link cite-btn";
      button.textContent = "Cite";
      button.setAttribute("aria-label", "Cite: " + publications[id].title);
      button.addEventListener("click", function () {
        openRecord = publications[id];
        showCitation("apa");
        citeDialog.showModal();
      });
      item.querySelector(".pub-link").after(button);
    });

    const downloads = document.getElementById("pub-downloads");
    downloads.querySelectorAll("[data-download]").forEach(function (button) {
      button.addEventListener("click", function () { downloadAll(button.dataset.download); });
    });
    downloads.hidden = false;
  })
  .catch(function (error) {
    console.warn("Citation data not loaded:", error);
  });
