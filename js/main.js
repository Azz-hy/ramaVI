(function () {
  const cfg = window.SITE_CONFIG;

  document.title = cfg.brandFull + " — " + cfg.brand;
  document.getElementById("brand-text").textContent = cfg.brand;

  // ---------- Cover ----------
  document.getElementById("confidential-badge").textContent = cfg.cover.confidential;
  document.getElementById("cover-kicker").textContent = cfg.cover.kicker;
  document.getElementById("cover-title-en").textContent = cfg.cover.titleEn;
  const titleKu = document.getElementById("cover-title-ku");
  titleKu.textContent = cfg.cover.titleKu;
  document.getElementById("cover-subtitle").textContent = cfg.cover.subtitle;
  document.getElementById("presented-to").textContent = cfg.cover.presentedTo;
  document.getElementById("presented-by").textContent = cfg.cover.presentedBy + "  ·  " + cfg.cover.tel;
  document.getElementById("cover-date").textContent = cfg.cover.date;
  document.getElementById("cover-cta-label").textContent = cfg.cover.ctaLabel;

  const coverStats = document.getElementById("cover-stats");
  (cfg.quickStats || []).forEach((s) => {
    coverStats.appendChild(buildStat(s));
  });

  document.getElementById("cover-cta").addEventListener("click", () => {
    const first = cfg.sections[0];
    if (first) document.getElementById("sec-" + first.id).scrollIntoView({ behavior: "smooth" });
  });

  function buildStat(s) {
    const el = document.createElement("div");
    el.className = "stat";
    el.innerHTML =
      '<div class="stat-value">' + escapeHtml(s.value) + '</div>' +
      '<div class="stat-label">' + escapeHtml(s.label) + '</div>';
    return el;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  // ---------- Watch-progress tracking ----------
  const WATCHED_KEY = "ksecs-watched-v1";
  function loadWatched() {
    try {
      return new Set(JSON.parse(localStorage.getItem(WATCHED_KEY) || "[]"));
    } catch (e) {
      return new Set();
    }
  }
  function saveWatched(set) {
    try {
      localStorage.setItem(WATCHED_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }
  const watched = loadWatched();
  let watchTotal = 0;

  function updateWatchProgress() {
    const el = document.getElementById("watch-progress");
    if (el) el.innerHTML = "<strong>" + watched.size + "</strong> / " + watchTotal + " watched";
  }

  function markWatched(id, card) {
    if (!id || watched.has(id)) return;
    watched.add(id);
    saveWatched(watched);
    if (card) card.classList.add("is-watched");
    const link = document.querySelector('.toc-link[data-target="' + id + '"]');
    if (link) link.classList.add("is-watched");
    updateWatchProgress();
  }

  // ---------- Video card builder (lazy-loaded) ----------
  function buildVideoCard(video, targetId) {
    const card = document.createElement("div");
    card.className = "video-card";
    if (targetId) {
      watchTotal++;
      if (watched.has(targetId)) card.classList.add("is-watched");
    }

    const frame = document.createElement("div");
    frame.className = "video-frame";

    const vid = document.createElement("video");
    vid.playsInline = true;
    vid.controls = true;
    vid.preload = "none";
    vid.dataset.src = video.src;
    if (video.poster) vid.poster = video.poster;

    const overlay = document.createElement("button");
    overlay.className = "play-overlay";
    overlay.setAttribute("aria-label", "Play video");
    overlay.innerHTML = '<span class="play-icon"></span>';

    const badge = document.createElement("span");
    badge.className = "watched-badge";
    badge.textContent = "Watched";

    overlay.addEventListener("click", () => {
      if (!vid.src) {
        vid.src = vid.dataset.src;
        vid.load();
      }
      vid.play();
    });
    vid.addEventListener("play", () => overlay.classList.add("is-hidden"));
    vid.addEventListener("pause", () => overlay.classList.remove("is-hidden"));
    vid.addEventListener("ended", () => {
      overlay.classList.remove("is-hidden");
      markWatched(targetId, card);
    });
    let nearEndFired = false;
    vid.addEventListener("timeupdate", () => {
      if (nearEndFired || !vid.duration) return;
      if (vid.currentTime / vid.duration >= 0.92) {
        nearEndFired = true;
        markWatched(targetId, card);
      }
    });

    frame.appendChild(vid);
    frame.appendChild(overlay);
    card.appendChild(frame);
    card.appendChild(badge);

    // Lazily set the real src once the card scrolls near the viewport,
    // so the browser can fetch metadata for the poster frame.
    const lazyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!vid.src) {
              vid.preload = "metadata";
              vid.src = vid.dataset.src;
            }
            lazyObserver.unobserve(card);
          }
        });
      },
      { rootMargin: "400px" }
    );
    lazyObserver.observe(card);

    return card;
  }

  // ---------- Main sections ----------
  const sectionsRoot = document.getElementById("sections-root");
  const tocInner = document.getElementById("toc-inner");
  const revealTargets = [];

  const mainLabel = document.createElement("p");
  mainLabel.className = "toc-group-label";
  mainLabel.textContent = "Proposal";
  tocInner.appendChild(mainLabel);

  (cfg.sections || []).forEach((sec) => {
    const section = document.createElement("section");
    section.className = "proposal-section reveal";
    section.id = "sec-" + sec.id;

    const inner = document.createElement("div");
    inner.className = "section-inner";

    const head = document.createElement("div");
    head.innerHTML =
      '<div class="section-head">' +
        '<span class="section-number">' + escapeHtml(sec.number) + '</span>' +
        '<h2 class="section-title-en">' + escapeHtml(sec.title) + '</h2>' +
      '</div>' +
      '<p class="section-title-ku" dir="rtl">' + escapeHtml(sec.titleKu || "") + '</p>' +
      '<p class="section-summary">' + escapeHtml(sec.summary || "") + '</p>';
    inner.appendChild(head);

    if (sec.stats && sec.stats.length) {
      const grid = document.createElement("div");
      grid.className = "stat-grid";
      sec.stats.forEach((s) => grid.appendChild(buildStat(s)));
      inner.appendChild(grid);
    }

    if (sec.video && sec.video.src) {
      inner.appendChild(buildVideoCard(sec.video, "sec-" + sec.id));
    }

    section.appendChild(inner);
    sectionsRoot.appendChild(section);
    revealTargets.push(section);

    const link = document.createElement("a");
    link.className = "toc-link";
    link.href = "#sec-" + sec.id;
    link.dataset.target = "sec-" + sec.id;
    link.innerHTML = '<span class="check" aria-hidden="true"></span><span class="n">' + escapeHtml(sec.number) + '</span><span>' + escapeHtml(sec.title) + '</span>';
    tocInner.appendChild(link);
  });

  // ---------- Appendices ----------
  const appendicesRoot = document.getElementById("appendices-root");
  const appendixSection = document.getElementById("appendix-section");

  if (cfg.appendices && cfg.appendices.length) {
    const appLabel = document.createElement("p");
    appLabel.className = "toc-group-label";
    appLabel.textContent = "Appendices";
    tocInner.appendChild(appLabel);

    cfg.appendices.forEach((app) => {
      const item = document.createElement("div");
      item.className = "appendix-item";
      item.id = "app-" + app.id;

      const head = document.createElement("div");
      head.innerHTML =
        '<div class="appendix-item-head">' +
          '<span class="appendix-letter">' + escapeHtml(app.letter) + '</span>' +
          '<h4 class="appendix-title">' + escapeHtml(app.title) + '</h4>' +
        '</div>' +
        '<p class="appendix-title-ku" dir="rtl">' + escapeHtml(app.titleKu || "") + '</p>' +
        '<p class="appendix-summary">' + escapeHtml(app.summary || "") + '</p>';
      item.appendChild(head);

      if (app.video && app.video.src) {
        item.appendChild(buildVideoCard(app.video, "app-" + app.id));
      }

      appendicesRoot.appendChild(item);

      const link = document.createElement("a");
      link.className = "toc-link";
      link.href = "#app-" + app.id;
      link.dataset.target = "app-" + app.id;
      link.innerHTML = '<span class="check" aria-hidden="true"></span><span class="n">' + escapeHtml(app.letter) + '</span><span>' + escapeHtml(app.title) + '</span>';
      tocInner.appendChild(link);
    });
    revealTargets.push(appendixSection);
  } else {
    appendixSection.hidden = true;
  }

  // ---------- References ----------
  document.getElementById("references-heading").textContent = cfg.references.heading;
  document.getElementById("references-note").textContent = cfg.references.note || "";
  const refBody = document.getElementById("references-body");
  (cfg.references.groups || []).forEach((group) => {
    const g = document.createElement("div");
    const h = document.createElement("p");
    h.className = "ref-group-heading";
    h.textContent = group.heading;
    g.appendChild(h);
    const ul = document.createElement("ul");
    ul.className = "ref-list";
    group.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
    g.appendChild(ul);
    refBody.appendChild(g);
  });

  const refToggle = document.getElementById("references-toggle");
  refToggle.addEventListener("click", () => {
    const isOpen = refToggle.classList.toggle("is-open");
    refBody.hidden = !isOpen;
  });

  // ---------- Closing ----------
  document.getElementById("closing-title").textContent = cfg.closing.title;
  document.getElementById("closing-message").textContent = cfg.closing.message;
  document.getElementById("closing-by").textContent = cfg.closing.presentedBy;
  document.getElementById("closing-tel").textContent = cfg.closing.tel;
  document.getElementById("closing-date").textContent = cfg.closing.date;
  revealTargets.push(document.getElementById("references-section"));
  revealTargets.push(document.getElementById("closing-section"));

  // ---------- Scroll reveal ----------
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  revealTargets.forEach((el) => el && revealObserver.observe(el));

  // ---------- Scrollspy ----------
  const tocLinks = Array.from(document.querySelectorAll(".toc-link"));
  const spyTargets = tocLinks
    .map((l) => document.getElementById(l.dataset.target))
    .filter(Boolean);

  // Sync watched state onto toc links (video cards were already flagged as
  // they were built) and show the final counter now that watchTotal is known.
  tocLinks.forEach((link) => {
    if (watched.has(link.dataset.target)) link.classList.add("is-watched");
  });
  updateWatchProgress();

  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = tocLinks.find((l) => l.dataset.target === entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          tocLinks.forEach((l) => l.classList.remove("is-active"));
          link.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
  );
  spyTargets.forEach((el) => spyObserver.observe(el));

  // ---------- Section list drawer ----------
  const toc = document.getElementById("toc");
  const tocBackdrop = document.getElementById("toc-backdrop");
  const navToggle = document.getElementById("nav-toggle");
  const tocClose = document.getElementById("toc-close");

  function openToc() {
    toc.classList.add("is-open");
    tocBackdrop.classList.add("is-open");
  }
  function closeToc() {
    toc.classList.remove("is-open");
    tocBackdrop.classList.remove("is-open");
  }
  navToggle.addEventListener("click", () => {
    if (toc.classList.contains("is-open")) closeToc();
    else openToc();
  });
  tocClose.addEventListener("click", closeToc);
  tocBackdrop.addEventListener("click", closeToc);
  tocLinks.forEach((link) => {
    link.addEventListener("click", closeToc);
  });

  // ---------- Scroll progress ----------
  const progressBar = document.getElementById("progress-bar");
  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
})();
