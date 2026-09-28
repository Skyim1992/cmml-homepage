/* =========================================================================
   CMM Lab site — loads content from /data/*.json and renders it.
   Multi-page aware: shared parts (nav, footer, language) render on every page;
   page-specific parts render only if their containers exist.
   Bilingual (EN/KO) via <html data-lang>. Edit the JSON files in /data.
   ========================================================================= */

const DATA = { content: null, news: null, people: null, research: null, publications: null };

/* ---- helpers ---- */
const $  = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function getLang() { try { return localStorage.getItem("cmml-lang") || "ko"; } catch { return "ko"; } }
function setLang(lang) {
  document.documentElement.setAttribute("data-lang", lang);
  try { localStorage.setItem("cmml-lang", lang); } catch {}
  $$(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  document.documentElement.lang = lang === "ko" ? "ko" : "en";
  if (DATA.content) renderAll();
  fitBrandSub();
}
const t = (obj) => {
  if (obj == null) return "";
  const lang = document.documentElement.getAttribute("data-lang") || "en";
  if (typeof obj === "string") return obj;
  return obj[lang] ?? obj.en ?? "";
};
function docLang() { return document.documentElement.getAttribute("data-lang") || "en"; }
function setText(sel, text) { const n = $(sel); if (n) n.textContent = text; }
function localizedList(obj) { return (obj?.[docLang()] || obj?.en || []); }

/* ---- data loading ---- */
async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

async function boot() {
  wireLangButtons();
  wireMobileNav();
  setLang(getLang());
  try {
    DATA.content = await loadJSON("data/content.json");
    const jobs = [];
    if ($("#news-list"))    jobs.push(loadJSON("data/news.json").then(d => DATA.news = d));
    if ($("#people-root"))  jobs.push(loadJSON("data/people.json").then(d => DATA.people = d));
    if ($("#research-root")) jobs.push(loadJSON("data/research.json").then(d => DATA.research = d));
    if ($("#pubs-root"))    jobs.push(loadJSON("data/publications.json").then(d => DATA.publications = d));
    if ($("#news-root"))    jobs.push(loadJSON("data/news.json").then(d => DATA.news = d));
    await Promise.all(jobs);
    renderAll();
  } catch (err) {
    showLoadError(err);
    console.error(err);
  }
}
function showLoadError(err) {
  const host = $("#news-list") || $("#people-root") || document.body;
  host.replaceChildren(el("div", "load-error",
    `Content could not be loaded (${esc(err.message)}).<br>` +
    `If you opened this file directly, serve it over HTTP — e.g. ` +
    `<code>python -m http.server</code> — or view it on GitHub Pages.`));
}

/* ---- master render ---- */
function renderAll() {
  const c = DATA.content; if (!c) return;
  renderShared(c);
  if ($("#hero-h1"))     renderHome(c);
  if ($("#people-root")) renderPeople(c);
  if ($("#research-root")) renderResearch(c);
  if ($("#pubs-root"))     renderPublications(c);
  if ($("#news-root"))     renderNewsPage(c);
  if ($("#contact-root"))  renderContact(c);
}

function renderShared(c) {
  // Nav labels
  Object.entries(c.nav).forEach(([key, val]) => setText(`[data-nav="${key}"]`, t(val)));
  // Footer
  setText("#foot-name", t(c.lab.name));
  const fa = localizedList(c.contact.footer_address || c.contact.address).map(esc).join("<br>");
  if ($("#foot-address")) $("#foot-address").innerHTML = fa;
  const mail = c.contact.email;
  if ($("#foot-email")) $("#foot-email").innerHTML = `<a href="mailto:${esc(mail)}">${esc(mail)}</a>`;
  const ph = c.contact.phone_local || c.contact.phone;
  if ($("#foot-phone")) $("#foot-phone").innerHTML = `<a href="tel:${esc(c.contact.phone || ph)}">${esc(ph)}</a>`;
  setText("#foot-room", t(c.contact.room));
  setText("#foot-copy-name", c.lab.acronym + " · " + t(c.lab.name));
  if ($("#foot-year")) $("#foot-year").textContent = new Date().getFullYear();
}

/* ---- HOME ---- */
function renderHome(c) {
  setText("#hero-eyebrow", t(c.hero.eyebrow));
  setText("#hero-h1", t(c.lab.name));
  const affil = localizedList(c.lab.affiliation).map(esc);
  if ($("#hero-affil-lines")) {
    const lead = esc(affil[affil.length - 1]);
    const others = affil.slice(0, -1);
    let html;
    if (docLang() === "en" && others.length >= 2) {
      // each part on its own line: University / Department / Division
      html = `<b>${lead}</b><br>${others.map(esc).join("<br>")}`;
    } else {
      html = `<b>${lead}</b> · ${others.map(esc).join(" · ")}`;
    }
    $("#hero-affil-lines").innerHTML = html;
  }
  setText("#hero-tagline", t(c.hero.tagline));
  setText("#cta-primary", t(c.hero.cta_primary));
  setText("#cta-secondary", t(c.hero.cta_secondary));

  if (c.about) {
    setText("#about-eyebrow", t(c.about.eyebrow));
    setText("#about-statement", t(c.about.statement));
  }

  setText("#vision-eyebrow", t(c.vision.eyebrow));
  setText("#vision-heading", t(c.vision.heading));
  const vb = $("#vision-body"); if (vb) { vb.replaceChildren(); localizedList(c.vision.body).forEach(p => vb.append(el("p", null, esc(p)))); }
  if (c.vision.media) renderMedia(c.vision.media);
  renderVideos("#vision-videos", c.vision.videos);

  setText("#news-eyebrow", t(c.news_section.eyebrow));
  setText("#news-heading", t(c.news_section.heading));
  renderNews();

  document.title = `${c.lab.acronym} — ${t(c.lab.name)}`;
}

function renderVideos(hostSel, list) {
  const host = $(hostSel); if (!host) return;
  host.replaceChildren();
  (list || []).forEach(v => {
    const fig = el("figure", "vid");
    const poster = v.src.replace(/\.mp4$/i, ".jpg");
    fig.innerHTML =
      `<video src="${esc(v.src)}" poster="${esc(poster)}" controls autoplay muted loop playsinline preload="metadata"></video>` +
      `<figcaption>${esc(t(v.caption))}</figcaption>`;
    host.append(fig);
  });
}

function renderMedia(m, hostSel = "#vision-media") {
  const host = $(hostSel); if (!host) return;
  host.replaceChildren();
  const frame = el("div", "media__frame");
  if (m.type === "youtube") {
    frame.classList.add("media__frame--video");
    frame.innerHTML = `<iframe src="https://www.youtube.com/embed/${esc(m.src)}" title="${esc(t(m.caption))}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  } else if (m.type === "video") {
    frame.innerHTML = `<video controls playsinline preload="metadata" ${m.poster ? `poster="${esc(m.poster)}"` : ""}><source src="${esc(m.src)}" type="video/mp4"></video>`;
  } else {
    frame.innerHTML = `<img src="${esc(m.src)}" alt="${esc(t(m.caption))}" loading="lazy">`;
  }
  host.append(frame);
  if (t(m.caption)) host.append(el("figcaption", null, esc(t(m.caption))));
}

function renderNews() {
  const host = $("#news-list"); if (!host) return;
  host.replaceChildren();
  const items = [...(DATA.news?.items || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (!items.length) { host.append(el("p", null, esc(t(DATA.content.news_section.empty)))); return; }
  items.forEach(it => {
    const item = el("article", "news__item");
    const meta = el("div", "news__meta", esc(it.date));
    if (it.tag) meta.append(el("span", "news__tag", esc(t(it.tag))));
    const main = el("div");
    main.append(el("h3", "news__title", esc(t(it.title))));
    const body = esc(t(it.body)) + (it.link ? ` <a href="${esc(it.link)}" target="_blank" rel="noopener">→</a>` : "");
    main.append(el("p", "news__body", body));
    item.append(meta, main);
    host.append(item);
  });
}

/* ---- PEOPLE ---- */
function initials(name) {
  const parts = String(name || "").trim().split(/\s+/);
  const s = (parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
  return s.toUpperCase() || "•";
}
function avatarHTML(person, cls) {
  const photo = person.photo && person.photo.trim();
  if (photo) return `<div class="${cls}"><img src="${esc(photo)}" alt="${esc(t(person.name))}" loading="lazy"></div>`;
  return `<div class="${cls} ${cls}--initials" aria-hidden="true">${esc(initials(t(person.name)))}</div>`;
}
function linksHTML(person) {
  const bits = [];
  if (person.email) bits.push(`<a href="mailto:${esc(person.email)}">Email</a>`);
  if (person.phone) bits.push(`<a href="tel:${esc(person.phone)}">Tel</a>`);
  (person.links || []).forEach(l => {
    if (!l.url) return;
    bits.push(`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(t(l.label))}</a>`);
  });
  return bits.length ? `<div class="member__links">${bits.join("")}</div>` : "";
}

function renderPeople(c) {
  const P = DATA.people; if (!P) return;
  const L = P.labels || {};
  document.title = `${t(L.title) || "People"} — ${c.lab.acronym}`;
  setText("#people-title", t(L.title));
  setText("#pi-label", t(L.pi));
  setText("#researchers-label", t(L.researchers));
  setText("#students-label", t(L.students));

  // PI
  const piHost = $("#pi-card");
  if (piHost && P.pi) {
    const pi = P.pi;
    const bio = localizedList(pi.bio).map(p => `<p>${esc(p)}</p>`).join("");
    const deg = pi.degree_note ? `<span class="pi__deg">(${esc(t(pi.degree_note))})</span>` : "";
    const interests = (pi.interests || []).length
      ? `<div class="pi__interests"><span class="pi__interests-label">${esc(t(L.interests))}</span>
           <div class="pi__tags">${pi.interests.map(i => `<span class="pi__tag">${esc(t(i))}</span>`).join("")}</div></div>`
      : "";
    const contact = `<dl class="pi__contact">
        <dt>Email</dt><dd><a href="mailto:${esc(pi.email)}">${esc(pi.email)}</a></dd>
        ${pi.phone ? `<dt>Tel</dt><dd><a href="tel:${esc(pi.phone)}">${esc(pi.phone)}</a></dd>` : ""}
      </dl>`;
    const profiles = (pi.profiles && pi.profiles.length)
      ? `<div class="profile-links">${pi.profiles.filter(pr => pr.url).map(pr =>
          `<a class="profile-btn" href="${esc(pr.url)}" target="_blank" rel="noopener" aria-label="${esc(pr.label)}"><span>${esc(pr.label)}</span><span class="profile-btn__arrow" aria-hidden="true">↗</span></a>`).join("")}</div>`
      : "";
    piHost.innerHTML =
      avatarHTML(pi, "pi__avatar") +
      `<div class="pi__info">
         <h3 class="pi__name">${esc(t(pi.name))} ${deg}</h3>
         <p class="pi__title">${esc(t(pi.title))}</p>
         <div class="pi__bio">${bio}</div>
         ${interests}
         ${contact}
         ${profiles}
       </div>`;
  }

  renderMembers("#researchers-grid", P.researchers, t(L.empty_researchers));
  renderMembers("#students-grid", P.students, t(L.empty_students));

  // PI education & experience
  setText("#education-label", t(L.education));
  setText("#experience-label", t(L.experience));
  const eh = $("#education-list");
  if (eh) {
    eh.replaceChildren();
    (P.pi?.education || []).forEach(e => {
      const note = t(e.note);
      eh.append(el("li", "cv",
        `<span class="cv__period">${esc(e.period)}</span>
         <span class="cv__body"><b>${esc(t(e.degree))}</b><br>${esc(t(e.org))}
         ${note ? `<span class="cv__note">${esc(note)}</span>` : ""}</span>`));
    });
  }
  const xh = $("#experience-list");
  if (xh) {
    xh.replaceChildren();
    (P.pi?.experience || []).forEach(x => {
      xh.append(el("li", "cv",
        `<span class="cv__period">${esc(t(x.period))}</span>
         <span class="cv__body"><b>${esc(t(x.role))}</b><br>${esc(t(x.org))}</span>`));
    });
  }
}

function renderMembers(sel, list, emptyMsg) {
  const host = $(sel); if (!host) return;
  host.replaceChildren();
  const arr = list || [];
  if (!arr.length) { host.append(el("p", "people-empty", esc(emptyMsg))); return; }
  arr.forEach(m => {
    const card = el("article", "member");
    const role = t(m.title) || t(m.degree) || "";
    const brief = t(m.brief);
    card.innerHTML =
      avatarHTML(m, "member__avatar") +
      `<h4 class="member__name">${esc(t(m.name))}</h4>` +
      (role ? `<p class="member__role">${esc(role)}</p>` : "") +
      (brief ? `<p class="member__brief">${esc(brief)}</p>` : "") +
      linksHTML(m);
    host.append(card);
  });
}

/* ---- RESEARCH ---- */
function renderResearch(c) {
  const R = DATA.research; if (!R) return;
  const L = R.labels || {};
  document.title = `${t(L.title) || "Research"} — ${c.lab.acronym}`;
  setText("#research-title", t(L.title));

  // Overview
  setText("#research-overview-label", t(L.overview_label));
  setText("#research-overview-heading", t(R.overview.heading));
  const ob = $("#research-overview-body");
  if (ob) { ob.replaceChildren(); localizedList(R.overview.body).forEach(p => ob.append(el("p", null, esc(p)))); }
  if (R.overview.media) renderMedia(R.overview.media, "#research-overview-media");

  // Areas
  setText("#research-areas-label", t(L.areas_label));
  const ah = $("#research-areas");
  if (ah) {
    ah.replaceChildren();
    (R.areas || []).forEach(a => {
      const tags = (a.methods || []).map(m => `<span class="area__tag">${esc(t(m))}</span>`).join("");
      const works = (a.pubs || []).map(d =>
        `<a class="area__doi" href="https://doi.org/${esc(d)}" target="_blank" rel="noopener">${esc(d)}</a>`).join("");
      const worksBlock = works
        ? `<div class="area__works"><span class="area__works-label">${esc(t(L.works))}</span><div class="area__doi-list">${works}</div></div>`
        : "";
      const img = a.image
        ? `<figure class="area__figure"><img src="${esc(a.image)}" alt="${esc(t(a.title))}" loading="lazy"></figure>`
        : "";
      const card = el("article", "area area--stack");
      card.innerHTML =
        `<div class="area__head">
           <span class="area__num">${esc(a.num || "")}</span>
           ${a.category ? `<span class="area__cat">${esc(t(a.category))}</span>` : ""}
         </div>
         <h3 class="area__title">${esc(t(a.title))}</h3>
         ${img}
         <p class="area__desc">${esc(t(a.body))}</p>
         ${tags ? `<div class="area__tags">${tags}</div>` : ""}
         ${worksBlock}`;
      ah.append(card);
    });
  }
}

/* ---- PUBLICATIONS ---- */
function boldAuthors(authors, highlight) {
  let out = esc(authors);
  if (highlight) {
    const h = esc(highlight);
    out = out.split(h).join(`<b>${h}</b>`);
  }
  return out;
}
function renderPublications(c) {
  const P = DATA.publications; if (!P) return;
  const L = P.labels || {};
  document.title = `${t(L.title) || "Publications"} — ${c.lab.acronym}`;
  setText("#pubs-title", t(L.title));
  setText("#pubs-intro", t(L.intro));

  const items = [...(P.items || [])];
  // stats
  const total = items.length;
  const nFirst = items.filter(p => p.first).length;
  const nCorr = items.filter(p => p.corresponding).length;
  const nTop10 = items.filter(p => p.jcr === "10").length;
  const pctTop10 = total ? Math.round(nTop10 / total * 100) : 0;
  const sh = $("#pubs-stats");
  if (sh) {
    sh.replaceChildren();
    [[total, t(L.stats_total)], [nFirst, t(L.stats_first)], [nCorr, t(L.stats_corr)],
     [pctTop10 + "%", t(L.stats_top10)]].forEach(([n, lab]) => {
      sh.append(el("div", "stat", `<span class="stat__num">${n}</span><span class="stat__label">${esc(lab)}</span>`));
    });
  }

  const host = $("#pubs-list"); if (!host) return;
  host.replaceChildren();
  if (!items.length) { host.append(el("p", "people-empty", esc(t(L.empty)))); return; }

  const years = [...new Set(items.map(p => p.year))].sort((a, b) => b - a);
  years.forEach(y => {
    const group = el("section", "pub-year");
    group.append(el("h2", "pub-year__label", String(y)));
    const list = el("ol", "pub-list");
    items.filter(p => p.year === y).forEach(p => {
      const jcrLabel = p.jcr === "10" ? t(L.jcr10) : p.jcr === "25" ? t(L.jcr25) : p.jcr === "50" ? t(L.jcr50) : "";
      const badges = [
        p.jcr ? `<span class="pub__badge pub__badge--jcr pub__badge--jcr${p.jcr}">${esc(jcrLabel)}</span>` : "",
        p.first ? `<span class="pub__badge">${esc(t(L.badge_first))}</span>` : "",
        p.corresponding ? `<span class="pub__badge pub__badge--corr">${esc(t(L.badge_corr))}</span>` : ""
      ].join("");
      const doi = p.doi
        ? `<a class="pub__doi" href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">${esc(t(L.doi_label))}: ${esc(p.doi)}</a>`
        : "";
      const li = el("li", "pub");
      li.innerHTML =
        `<p class="pub__title">${esc(p.title)}</p>
         <p class="pub__authors">${boldAuthors(p.authors, P.highlight_author)}</p>
         <p class="pub__meta"><span class="pub__journal">${esc(p.journal)}</span>
           ${p.volume ? `<span class="pub__vol">Vol. ${esc(p.volume)}${p.article ? `, ${esc(p.article)}` : ""}</span>` : ""}
           <span class="pub__date">${esc(p.date)}</span>
           ${p.impact ? `<span class="pub__if">${esc(p.impact)}</span>` : ""}</p>
         <div class="pub__foot">${badges}${doi}</div>`;
      list.append(li);
    });
    group.append(list);
    host.append(group);
  });
}

/* ---- NEWS PAGE ---- */
function renderNewsPage(c) {
  const N = DATA.news; if (!N) return;
  const L = N.labels || {};
  document.title = `${t(L.title) || "News"} — ${c.lab.acronym}`;
  setText("#newspage-title", t(L.title));
  setText("#newspage-intro", t(L.intro));
  const host = $("#newspage-list"); if (!host) return;
  host.replaceChildren();
  const items = [...(N.items || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (!items.length) { host.append(el("p", "people-empty", esc(t(L.empty)))); return; }
  items.forEach(it => {
    const item = el("article", "news__item");
    const meta = el("div", "news__meta", esc(it.date));
    if (it.tag) meta.append(el("span", "news__tag", esc(t(it.tag))));
    const main = el("div");
    main.append(el("h3", "news__title", esc(t(it.title))));
    const body = esc(t(it.body)) + (it.link ? ` <a href="${esc(it.link)}" target="_blank" rel="noopener">→</a>` : "");
    main.append(el("p", "news__body", body));
    item.append(meta, main);
    host.append(item);
  });
}

/* ---- CONTACT ---- */
function renderContact(c) {
  document.title = `${t(c.nav.contact)} — ${c.lab.acronym}`;
  setText("#contact-title", t(c.nav.contact));
  const ct = c.contact;
  const mail = ct.email;
  if ($("#contact-email")) $("#contact-email").innerHTML = `<a href="mailto:${esc(mail)}">${esc(mail)}</a>`;
  if ($("#contact-phone")) $("#contact-phone").innerHTML = `<a href="tel:${esc(ct.phone || "")}">${esc(ct.phone_local || ct.phone || "")}</a>`;
  setText("#contact-fax", ct.fax || "");
  if ($("#contact-address")) $("#contact-address").innerHTML = localizedList(ct.address).map(esc).join("<br>");
  setText("#contact-room", t(ct.room));
}

/* Stretch the Korean brand sub-line so it spans exactly the width of "CMM Lab".
   CJK text does not justify reliably, so the letter-spacing is computed here. */
function fitBrandSub() {
  [[".nav__word", ".nav__sub"], [".footer__word", ".footer__sub"]].forEach(([wordSel, subSel]) => {
    const word = $(wordSel);
    const subs = $$(subSel);
    if (!word || !subs.length) return;
    subs.forEach(s => { s.style.letterSpacing = ""; s.style.marginRight = ""; });
    if (docLang() !== "ko") return;
    const sub = subs.find(e => getComputedStyle(e).display !== "none");
    if (!sub) return;
    const measure = (node) => {
      const r = document.createRange();
      r.selectNodeContents(node);
      return r.getBoundingClientRect().width;
    };
    const target = measure(word);
    const n = (sub.textContent || "").trim().length;
    if (!target || n < 2) return;
    sub.style.letterSpacing = "0px";
    const natural = measure(sub);
    const ls = (target - natural) / (n - 1);
    if (ls > 0) {
      sub.style.letterSpacing = ls.toFixed(2) + "px";
      sub.style.marginRight = (-ls).toFixed(2) + "px";  // drop trailing space
    }
  });
}

/* ---- wiring ---- */
function wireLangButtons() {
  $$(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
}
function wireMobileNav() {
  const toggle = $(".nav__toggle"), links = $(".nav__links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$(".nav__links a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));
}

document.addEventListener("DOMContentLoaded", boot);
// Web fonts change text metrics — re-fit once they are ready, and on resize.
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBrandSub);
window.addEventListener("load", fitBrandSub);
window.addEventListener("resize", fitBrandSub);
