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

  // ---------- Copy-link toast ----------
  const toast = document.createElement("div");
  toast.className = "copy-toast";
  toast.id = "copy-toast";
  toast.textContent = "Link copied!";
  document.body.appendChild(toast);

  function showToast(msg) {
    toast.textContent = msg || "Link copied!";
    toast.classList.remove("is-visible");
    void toast.offsetWidth; // force reflow to restart animation
    toast.classList.add("is-visible");
    setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  // ---------- Single-play: pause all other videos ----------
  const allVideos = [];

  // ---------- Video card builder (supports local videos and Drive iframes) ----------
  function buildVideoCard(video, targetId) {
    const isDrive = video.type === "drive";
    const card = document.createElement("div");
    card.className = "video-card" + (isDrive ? " drive-embed-card" : "");
    // Give the video card its own anchor so links scroll directly to the player
    const videoAnchorId = targetId ? "video-" + targetId : "";
    if (videoAnchorId) card.id = videoAnchorId;

    if (targetId) {
      watchTotal++;
      if (watched.has(targetId)) card.classList.add("is-watched");
    }

    const frame = document.createElement("div");
    frame.className = "video-frame";

    // --- Label (for multi-video appendices) ---
    if (video.label) {
      const labelEl = document.createElement("div");
      labelEl.className = "video-label";
      labelEl.textContent = video.label;
      card.appendChild(labelEl);
    }

    if (isDrive) {
      // ---- Google Drive iframe embed ----
      const iframe = document.createElement("iframe");
      iframe.className = "drive-iframe";
      iframe.setAttribute("allow", "autoplay; encrypted-media; fullscreen");
      iframe.setAttribute("allowfullscreen", "true");
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("loading", "lazy");
      iframe.dataset.src = video.src;
      // Don't set src yet; lazy-load it when it scrolls near viewport
      
      // Custom fullscreen elements
      const fsOverlay = document.createElement("button");
      fsOverlay.className = "custom-fs-overlay";
      fsOverlay.setAttribute("aria-label", "Enter fullscreen");
      
      const fsClose = document.createElement("button");
      fsClose.className = "custom-fs-close";
      fsClose.setAttribute("aria-label", "Exit fullscreen");
      fsClose.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      
      fsOverlay.addEventListener("click", (e) => {
        e.stopPropagation();

        // Stop all other Drive videos by reloading their iframes
        document.querySelectorAll(".drive-iframe").forEach(otherIframe => {
          if (otherIframe !== iframe && otherIframe.src) {
            const currentSrc = otherIframe.src;
            otherIframe.src = "about:blank";
            setTimeout(() => { otherIframe.src = currentSrc; }, 50);
          }
        });

        const nativeFs = frame.requestFullscreen || frame.webkitRequestFullscreen || frame.mozRequestFullScreen || frame.msRequestFullscreen;

        function useCustomFallback() {
          frame.classList.add("is-custom-fs");
        }

        if (nativeFs) {
          try {
            const result = nativeFs.call(frame);
            if (result && typeof result.then === "function") {
              result.catch(useCustomFallback);
            }
          } catch (err) {
            useCustomFallback();
          }
        } else {
          useCustomFallback();
        }

        // Some Android/in-app browsers silently no-op requestFullscreen —
        // no error, no promise rejection, just nothing happens.
        // So verify the actual state shortly after and fall back if it didn't take.
        setTimeout(() => {
          const isNowFullscreen =
            document.fullscreenElement || document.webkitFullscreenElement ||
            document.mozFullScreenElement || document.msFullscreenElement;
          if (!isNowFullscreen && !frame.classList.contains("is-custom-fs")) {
            useCustomFallback();
          }
        }, 250);

        // Load iframe if it hasn't loaded yet
        if (!iframe.src) iframe.src = iframe.dataset.src;
      });

      fsClose.addEventListener("click", (e) => {
        e.stopPropagation();
        frame.classList.remove("is-custom-fs");
        
        // Also ensure native fullscreen is exited if it was successful
        const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        
        if (exitFs && isFullscreen) {
          exitFs.call(document);
        }
      });

      frame.appendChild(iframe);
      frame.appendChild(fsOverlay);
      frame.appendChild(fsClose);

      // Lazy load
      const lazyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!iframe.src) {
                iframe.src = iframe.dataset.src;
              }
              lazyObserver.unobserve(card);
            }
          });
        },
        { rootMargin: "600px" }
      );
      lazyObserver.observe(card);

    } else {
      // ---- Local video file ----
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

      overlay.addEventListener("click", () => {
        if (!vid.src) {
          vid.src = vid.dataset.src;
          vid.load();
        }
        vid.play();
      });
      vid.addEventListener("play", () => {
        overlay.classList.add("is-hidden");
        // Pause every other video on the page
        allVideos.forEach((v) => { if (v !== vid && !v.paused) v.pause(); });
      });
      allVideos.push(vid);
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
    }

    const badge = document.createElement("span");
    badge.className = "watched-badge";
    badge.textContent = "Watched";

    // Copy-link button
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-link-btn";
    copyBtn.setAttribute("aria-label", "Copy video link");
    copyBtn.innerHTML =
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>' +
        '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' +
      '</svg>' +
      '<span>Copy Link</span>';

    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Link directly to the video card on the page
      const base = window.location.origin + window.location.pathname;
      const videoUrl = videoAnchorId ? base + "#" + videoAnchorId : base;
      navigator.clipboard.writeText(videoUrl).then(() => {
        showToast("Link copied!");
        copyBtn.classList.add("is-copied");
        setTimeout(() => copyBtn.classList.remove("is-copied"), 1800);
      }).catch(() => {
        // Fallback for older browsers / insecure contexts
        const ta = document.createElement("textarea");
        ta.value = videoUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("Link copied!");
        copyBtn.classList.add("is-copied");
        setTimeout(() => copyBtn.classList.remove("is-copied"), 1800);
      });
    });

    // "Mark as Watched" button for Drive embeds (since we can't detect iframe playback)
    if (isDrive) {
      const markBtn = document.createElement("button");
      markBtn.className = "mark-watched-btn";
      if (watched.has(targetId)) {
        markBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>Watched</span>';
        markBtn.classList.add("is-marked");
      } else {
        markBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg><span>Mark as Watched</span>';
      }
      markBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        markWatched(targetId, card);
        markBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>Watched</span>';
        markBtn.classList.add("is-marked");
      });

      // "Open in Google Drive" button — opens the video in Drive's native
      // player which works much better on mobile than the embedded iframe.
      const driveViewUrl = video.src.replace("/preview", "/view");
      const openDriveBtn = document.createElement("a");
      openDriveBtn.className = "open-drive-btn";
      openDriveBtn.href = driveViewUrl;
      openDriveBtn.target = "_blank";
      openDriveBtn.rel = "noopener noreferrer";
      openDriveBtn.innerHTML =
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' +
          '<polyline points="15 3 21 3 21 9"/>' +
          '<line x1="10" y1="14" x2="21" y2="3"/>' +
        '</svg>' +
        '<span>Open in Google Drive</span>';

      card.appendChild(frame);
      card.appendChild(badge);
      // Button row for drive embeds
      const btnRow = document.createElement("div");
      btnRow.className = "video-card-actions";
      btnRow.appendChild(openDriveBtn);
      btnRow.appendChild(markBtn);
      btnRow.appendChild(copyBtn);
      card.appendChild(btnRow);
    } else {
      card.appendChild(frame);
      card.appendChild(badge);
      card.appendChild(copyBtn);
    }

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

      // Support both single "video" and multiple "videos" array
      if (app.videos && app.videos.length) {
        const videosContainer = document.createElement("div");
        videosContainer.className = "multi-video-grid";
        app.videos.forEach((v, idx) => {
          const subId = "app-" + app.id + "-" + (idx + 1);
          videosContainer.appendChild(buildVideoCard(v, subId));
        });
        item.appendChild(videosContainer);
      } else if (app.video && app.video.src) {
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

  // ---------- Documentaries ----------
  const documentariesRoot = document.getElementById("documentaries-root");
  const documentarySection = document.getElementById("documentary-section");

  if (cfg.documentaries && cfg.documentaries.length) {
    const docLabel = document.createElement("p");
    docLabel.className = "toc-group-label";
    docLabel.textContent = "Documentaries";
    tocInner.appendChild(docLabel);

    cfg.documentaries.forEach((doc) => {
      const item = document.createElement("div");
      item.className = "documentary-item";
      item.id = "doc-" + doc.id;

      const head = document.createElement("div");
      head.innerHTML =
        '<div class="documentary-item-head">' +
          '<span class="documentary-number">' + escapeHtml(doc.number) + '</span>' +
          '<h4 class="documentary-title">' + escapeHtml(doc.title) + '</h4>' +
        '</div>' +
        (doc.titleKu ? '<p class="documentary-title-ku" dir="rtl">' + escapeHtml(doc.titleKu) + '</p>' : '') +
        (doc.summary ? '<p class="documentary-summary">' + escapeHtml(doc.summary) + '</p>' : '');
      item.appendChild(head);

      if (doc.video && doc.video.src) {
        item.appendChild(buildVideoCard(doc.video, "doc-" + doc.id));
      }

      documentariesRoot.appendChild(item);

      const link = document.createElement("a");
      link.className = "toc-link";
      link.href = "#doc-" + doc.id;
      link.dataset.target = "doc-" + doc.id;
      link.innerHTML = '<span class="check" aria-hidden="true"></span><span class="n">' + escapeHtml(doc.number) + '</span><span>' + escapeHtml(doc.title) + '</span>';
      tocInner.appendChild(link);
    });
    revealTargets.push(documentarySection);
  } else {
    documentarySection.hidden = true;
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
