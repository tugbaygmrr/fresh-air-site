"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px 8px 0px",
      }
    );

    const revealItems = document.querySelectorAll(".reveal");
    const viewTimeline = CSS.supports("animation-timeline: view()");

    revealItems.forEach((el) => {
      if (
        !viewTimeline ||
        el.closest(".strategy-list") ||
        el.closest(".services-grid")
      ) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = document.querySelector(".metrics-scroll-section");
    if (!section) return undefined;

    const cards = Array.from(section.querySelectorAll(".metric-spot-card"));
    const total = cards.length;

    let lastActive = -1;
    let lastProgressStr = "";
    let rafId = 0;

    const updateMetricsCards = () => {
      rafId = 0;
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const start = viewport * 0.18;
      const end = viewport * 0.75;
      const progressRaw = (start - rect.top) / (rect.height - end);
      const progress = Math.min(1, Math.max(0, progressRaw));
      const progressStr = progress.toFixed(3);
      if (progressStr !== lastProgressStr) {
        lastProgressStr = progressStr;
        section.style.setProperty("--metrics-progress", progressStr);
      }
      const active = Math.min(total - 1, Math.floor(progress * total) - 1);
      if (active !== lastActive) {
        lastActive = active;
        cards.forEach((card, idx) => {
          card.classList.toggle("is-active", idx <= active);
        });
      }
    };

    const schedule = () => { if (!rafId) rafId = requestAnimationFrame(updateMetricsCards); };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const numberEls = Array.from(document.querySelectorAll(".metric-spot-number"));
    if (!numberEls.length) return undefined;

    const formatNumber = (value, compact, withPlus) => {
      const rounded = Math.round(value);
      if (compact === "M") return `${rounded}M${withPlus ? "+" : ""}`;
      if (compact === "K") return `${rounded}K${withPlus ? "+" : ""}`;
      return `${rounded}${withPlus ? "+" : ""}`;
    };

    const animated = new WeakSet();

    const runAnimation = (el) => {
      if (animated.has(el)) return;
      animated.add(el);

      const target = Number(el.dataset.target || "0");
      const compact = el.dataset.compact || "";
      const withPlus = el.dataset.plus !== "0";
      const duration = 1200;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatNumber(target * eased, compact, withPlus);
        if (progress < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runAnimation(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.45 }
    );

    numberEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = document.querySelector(".hero-bg-canvas");
    const heroSection = document.querySelector(".hero");
    if (!canvas || !heroSection) return undefined;

    const ctx = canvas.getContext("2d");
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const LERP = 0.22;

    const frames = [];
    let lastIdx = -1;
    let targetProg = 0;
    let displayProg = 0;
    let rafId = 0;
    let isVisible = true;

    const syncSize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || (window.innerHeight - 84);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        lastIdx = -1;
      }
    };

    const drawFrame = (progress) => {
      if (!frames.length) return;
      const idx = clamp(Math.round(progress * (frames.length - 1)), 0, frames.length - 1);
      if (idx === lastIdx) return;
      lastIdx = idx;
      const bm = frames[idx];
      const cw = canvas.width;
      const ch = canvas.height;
      if (!cw || !ch || !bm) return;
      const canvasAspect = cw / ch;
      const videoAspect = bm.width / bm.height;
      // 16:9'dan dar ekranlarda (MacBook 16:10, tablet, telefon) contain — tam video görünür
      const useContain = canvasAspect < videoAspect * 1.05;
      const scale = useContain
        ? Math.min(cw / bm.width, ch / bm.height)
        : Math.max(cw / bm.width, ch / bm.height);
      const dw = bm.width * scale;
      const dh = bm.height * scale;
      ctx.fillStyle = "#04101c";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(bm, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    const tick = () => {
      rafId = 0;
      if (!isVisible) return;
      const rect = heroSection.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - (window.innerHeight || 1));
      targetProg = clamp(-rect.top / scrollable, 0, 1);
      const diff = targetProg - displayProg;
      if (Math.abs(diff) > 0.001) {
        displayProg += diff * LERP;
        rafId = requestAnimationFrame(tick);
      } else {
        displayProg = targetProg;
      }
      drawFrame(displayProg);
    };

    const scheduleSync = () => { if (!rafId) rafId = requestAnimationFrame(tick); };
    const onResize = () => { syncSize(); lastIdx = -1; scheduleSync(); };

    const visObs = new IntersectionObserver(
      ([e]) => { isVisible = e?.isIntersecting ?? true; if (isVisible) scheduleSync(); },
      { threshold: 0, rootMargin: "80px 0px 80px 0px" }
    );
    visObs.observe(heroSection);
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", onResize);
    syncSize();

    // Kareleri arka planda, idle zamanda çek — scroll'u bloklamasın
    let cancelled = false;
    const idle = (cb) =>
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(cb, { timeout: 400 })
        : setTimeout(cb, 1);

    (async () => {
      try {
        const vid = document.createElement("video");
        vid.src = "/hero-latest.mp4";
        vid.muted = true;
        vid.playsInline = true;
        vid.preload = "auto";
        await new Promise((res, rej) => {
          vid.addEventListener("loadedmetadata", res, { once: true });
          vid.addEventListener("error", rej, { once: true });
          vid.load();
        });
        if (cancelled) return;
        const dur = vid.duration;
        // Ağır videolarda kare sayısını düşür (max 40, ~8fps)
        const n = Math.min(Math.ceil(dur * 8), 40);
        for (let i = 0; i < n; i++) {
          if (cancelled) return;
          vid.currentTime = (i / Math.max(n - 1, 1)) * dur;
          await new Promise((r) => vid.addEventListener("seeked", r, { once: true }));
          if (cancelled) return;
          const bm = await createImageBitmap(vid);
          frames.push(bm);
          if (i === 0) { syncSize(); drawFrame(0); }
          else scheduleSync();
          // Sıradaki kareyi tarayıcı boşa çıkana kadar bekle
          await new Promise((r) => idle(r));
        }
      } catch (err) {
        console.warn("Frame extraction failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      visObs.disconnect();
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
      frames.forEach((bm) => bm.close?.());
    };
  }, []);

  useEffect(() => {
    const section = document.querySelector(".scroll-features-section");
    const videoEl = section?.querySelector(".scroll-features-video");
    if (!section || !videoEl) return undefined;

    const cards = Array.from(section.querySelectorAll(".feature-card"));
    const total = cards.length;

    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.loop = false;
    videoEl.autoplay = false;
    videoEl.preload = "auto";
    videoEl.pause();

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const LERP = 0.1;

    let isVisible = true;
    let rafId = 0;
    let targetTime = 0;
    let displayTime = 0;

    const calcProgress = () => {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const scrollable = Math.max(1, rect.height - viewport);
      return clamp(-rect.top / scrollable, 0, 1);
    };

    const tick = () => {
      rafId = 0;
      if (!isVisible) return;

      const progress = calcProgress();
      const activeIndex = Math.min(total - 1, Math.floor(progress * total));
      cards.forEach((card, idx) => card.classList.toggle("is-active", idx <= activeIndex));

      const duration = videoEl.duration;
      if (Number.isFinite(duration) && duration > 0) {
        targetTime = clamp(progress * duration, 0, Math.max(0, duration - 0.02));
        const diff = targetTime - displayTime;
        if (Math.abs(diff) < 0.002) {
          displayTime = targetTime;
        } else {
          displayTime += diff * LERP;
          rafId = requestAnimationFrame(tick);
        }
        try { videoEl.currentTime = displayTime; } catch {}
      }
    };

    const scheduleSync = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const visObs = new IntersectionObserver(
      ([e]) => {
        isVisible = e ? e.isIntersecting : true;
        if (isVisible) scheduleSync();
      },
      { threshold: 0, rootMargin: "80px 0px 80px 0px" }
    );
    visObs.observe(section);

    videoEl.addEventListener("loadedmetadata", scheduleSync);
    videoEl.addEventListener("loadeddata", scheduleSync);
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    scheduleSync();

    return () => {
      visObs.disconnect();
      videoEl.removeEventListener("loadedmetadata", scheduleSync);
      videoEl.removeEventListener("loadeddata", scheduleSync);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      if (rafId) cancelAnimationFrame(rafId);
      videoEl.pause();
    };
  }, []);

  useEffect(() => {
    const heroSection = document.querySelector(".hero");
    const card = document.querySelector(".hero-info-card");
    if (!heroSection || !card) return undefined;

    let rafId = 0;
    let lastOpacity = -1;

    const syncHeroCard = () => {
      rafId = 0;
      const viewport = window.innerHeight || 1;
      const heroTop = heroSection.offsetTop;
      const heroBottom = heroTop + heroSection.offsetHeight;
      const stickyEnd = heroBottom - viewport;
      const scrollY = window.pageYOffset || window.scrollY || 0;
      const fadePx = 380;

      let o;
      if (scrollY <= stickyEnd - fadePx) o = 1;
      else if (scrollY >= stickyEnd) o = 0;
      else o = (stickyEnd - scrollY) / fadePx;
      if (scrollY >= heroBottom) o = 0;

      if (Math.abs(o - lastOpacity) < 0.005) return;
      lastOpacity = o;
      card.style.opacity = String(o);
      const faded = o < 0.02;
      card.classList.toggle("hero-card-faded-out", faded);
      card.setAttribute("aria-hidden", faded ? "true" : "false");
    };

    const schedule = () => { if (!rafId) rafId = requestAnimationFrame(syncHeroCard); };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <header className="site-header glass">
        <div className="container nav">
          <a className="brand" href="#home" aria-label="AeroSystem">
            <img
              className="brand-logo"
              src="/aero-logo.png"
              alt="AeroSystem"
            />
          </a>
          <span className="nav-divider" aria-hidden="true" />
          <nav className="menu">
            <button className="is-active" type="button">
              Anasayfa
            </button>
            <button type="button">Hakkımızda</button>
            <button type="button">
              Ürünlerimiz
              <span className="caret" aria-hidden="true">
                ▾
              </span>
            </button>
            <button type="button">Belgelerimiz</button>
            <button type="button">Katalog</button>
            <button type="button">İletişim</button>
          </nav>
          <div className="nav-actions">
            <div className="lang-picker" aria-label="Dil seçenekleri">
              <button className="lang-current" type="button">
                <img
                  className="flag-icon"
                  src="https://flagcdn.com/w20/tr.png"
                  alt=""
                />
                TR
              </button>
              <div className="lang-list" aria-hidden="true">
                <span>
                  <img className="flag-icon" src="https://flagcdn.com/w20/sa.png" alt="" />
                  Arapça
                </span>
                <span>
                  <img className="flag-icon" src="https://flagcdn.com/w20/gb.png" alt="" />
                  İngilizce
                </span>
                <span>
                  <img className="flag-icon" src="https://flagcdn.com/w20/fr.png" alt="" />
                  Fransızca
                </span>
                <span>
                  <img className="flag-icon" src="https://flagcdn.com/w20/de.png" alt="" />
                  Almanca
                </span>
                <span>
                  <img className="flag-icon" src="https://flagcdn.com/w20/ru.png" alt="" />
                  Rusça
                </span>
                <span>
                  <img className="flag-icon" src="https://flagcdn.com/w20/tr.png" alt="" />
                  Türkçe
                </span>
              </div>
            </div>
            <button className="btn btn-primary nav-cta nav-cta-dark" type="button">
              Teklif Al
            </button>
          </div>
        </div>
      </header>

      <main id="home">
        <section className="hero section">
          <canvas className="hero-bg-video hero-bg-canvas" aria-hidden="true" />
          <div className="hero-visual-overlay" />
          <div className="container hero-grid">
            <aside className="hero-info-card">
              <p className="hero-info-eyebrow">• HAVALANDIRMA VE İKLİMLENDİRME SİSTEMLERİ</p>
              <h3>
                <span className="hero-grad-title">1 milyon m²</span>{" "}
                proje deneyimiyle, iç mekanlarda{" "}
                <span className="hero-grad-title">sağlıklı hava</span>{" "}
                ve{" "}
                <span className="hero-grad-title">ısı konforu</span>{" "}
                üretiyoruz.
              </h3>
              <p>
                İklimlendirme, havalandırma,{" "}
                <span className="hero-grad-text">klima santralleri</span>{" "}
                ve{" "}
                <span className="hero-grad-text">soğutma ekipmanları</span>{" "}
                alanında uçtan uca mühendislik ve üretim hizmetiyle, otel,
                hastane, AVM ve endüstriyel tesislerde{" "}
                <span className="hero-grad-text">güvenilir altyapı</span>{" "}
                kuruyoruz.
              </p>
              <div className="hero-info-actions">
                <button type="button">PROJENİZ İÇİN TEKLİF ALIN →</button>
                <a href="#services">ÜRÜNLERİMİZİ KEŞFEDİN →</a>
              </div>
            </aside>
          </div>
        </section>

        <section className="ticker section">
          <div className="container ticker-content reveal">
            <div className="trust-panel">
              <div className="trust-copy">
                <p className="mini-eyebrow">Sertifikalı Üretici</p>
                <h2>
                  ISO, CE ve TSE sertifikalarıyla belgelenmiş kalite,
                  güvenlik ve çevre standartları<span>.</span>
                </h2>
              </div>
              <div className="trust-logos" aria-label="Sertifikalarımız">
                <div className="trust-logo trust-logo--light trust-logo--badge">
                  <span className="trust-badge-mark trust-badge-mark--blue">ISO</span>
                  <span className="trust-badge-meta">
                    <span className="trust-badge-title">9001</span>
                    <span className="trust-badge-sub">Quality Management</span>
                  </span>
                </div>
                <div className="trust-logo trust-logo--light">
                  <img src="/cert-icons/ce.svg" alt="CE" loading="lazy" decoding="async" />
                </div>
                <div className="trust-logo trust-logo--light trust-logo--badge">
                  <span className="trust-badge-mark trust-badge-mark--cyan">TSE</span>
                  <span className="trust-badge-meta">
                    <span className="trust-badge-title">HYB</span>
                    <span className="trust-badge-sub">Hizmet Yeterlilik</span>
                  </span>
                </div>
                <div className="trust-logo trust-logo--light">
                  <img src="/cert-icons/iso-english.svg" alt="ISO Certified" loading="lazy" decoding="async" />
                </div>
              </div>
            </div>
            <div className="ticker-row">
              <p>İklimlendirme</p>
              <p>Klima Santralleri</p>
              <p>Havalandırma</p>
              <p>Soğutma Ekipmanları</p>
              <p>Endüstriyel Fanlar</p>
              <p>HVAC Üretimi</p>
            </div>
          </div>
        </section>

        <section id="about" className="section about-white reveal">
          <div className="container about-grid">
            <div className="about-left">
              <p className="about-eyebrow">Kurumsal</p>
              <div className="about-item is-active">
                <h3>1 Milyon m² Proje Deneyimi</h3>
                <p>
                  İklimlendirme alanında uçtan uca üretim, mühendislik ve servis
                  hizmeti veriyoruz. Klima santralleri, fan sistemleri ve soğutma
                  ekipmanlarımızla iç mekanlarda ısı konforu sağlıyor; otel,
                  hastane, AVM ve endüstriyel tesislerde sağlıklı, taze ve temiz
                  hava akışını güvence altına alıyoruz.
                </p>
              </div>
              <p className="about-intro">
                Yurt içi ve yurt dışı projelerimizde edindiğimiz tecrübeyi,
                projeye özel çözümlere dönüştürüyoruz.
              </p>
              <a href="#services" className="about-link">
                Daha fazla bilgi edin
              </a>
            </div>
            <div className="about-media">
              <model-viewer
                className="about-model-viewer"
                src="/models/hero-model-web.glb"
                camera-controls
                touch-action="pan-y"
                auto-rotate
                auto-rotate-delay="1200"
                rotation-per-second="20deg"
                shadow-intensity="0.35"
                environment-image="neutral"
                exposure="1"
                interaction-prompt="none"
                loading="eager"
                reveal="auto"
                suppressHydrationWarning
                style={{ width: "100%", height: "100%", background: "transparent" }}
              />
              <div className="about-stat-grid">
                <article className="about-stat about-stat--tl">
                  <h4>1.000.000 m²</h4>
                  <p>Tamamlanan iklimlendirme ve havalandırma proje alanı.</p>
                </article>
                <article className="about-stat about-stat--tr">
                  <h4>5 Ülke</h4>
                  <p>Azerbaycan, Irak, Kosova, Arnavutluk ve Tacikistan'da aktif projeler.</p>
                </article>
                <article className="about-stat about-stat--bl">
                  <h4>Çoklu Sektör</h4>
                  <p>Otel, hastane, AVM ve endüstriyel tesislerde uygulanan çözümler.</p>
                </article>
                <article className="about-stat about-stat--br">
                  <h4>Uçtan Uca</h4>
                  <p>Üretim, mühendislik, montaj ve servis süreçlerini tek elden yürütüyoruz.</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="scroll-features-section">
          <video
            className="scroll-features-video"
            src="/scroll-features-smooth.mp4"
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className="container scroll-features-sticky">
            <div className="feature-cards-grid">
              <article className="feature-card is-active">
                <span className="feature-icon">❄️</span>
                <h3>İklimlendirme Sistemleri</h3>
                <p>
                  İç mekanlarda soğutma, ısıtma, havalandırma ve dezenfeksiyonu
                  kapsayan kapsamlı HVAC çözümleri.
                </p>
                <button type="button">Daha fazla bilgi edin</button>
              </article>
              <article className="feature-card">
                <span className="feature-icon">🌬️</span>
                <h3>Havalandırma ve Fanlar</h3>
                <p>
                  Hava akışı oluşturmak için tasarlanmış endüstriyel fanlarla
                  güçlü ve sürekli havalandırma performansı.
                </p>
                <button type="button">Daha fazla bilgi edin</button>
              </article>
              <article className="feature-card">
                <span className="feature-icon">🏭</span>
                <h3>Klima Santralleri</h3>
                <p>
                  Sıcaklık kontrolü yaparak ortam havasını ısıtan, soğutan ve
                  taze hava sağlayan klima santral üniteleri.
                </p>
                <button type="button">Daha fazla bilgi edin</button>
              </article>
              <article className="feature-card">
                <span className="feature-icon">🧊</span>
                <h3>Soğutma Ekipmanları</h3>
                <p>
                  Endüstriyel ve ticari mekanlar için yüksek verimli soğutma
                  ekipmanları ve özel sistem çözümleri.
                </p>
                <button type="button">Daha fazla bilgi edin</button>
              </article>
            </div>
          </div>
        </section>

        <section className="section strategy strategy-modern">
          <div className="container">
            <div className="strategy-layout">
              <div className="strategy-main">
                <div className="section-top reveal">
                  <p className="eyebrow">Çalışma Yaklaşımımız</p>
                  <h2>3 adımda iklimlendirme projeleri: tasarımdan teslime</h2>
                </div>
                <ol className="strategy-list">
                  <li className="strategy-list-item reveal">
                    <span className="strategy-list-marker" aria-hidden="true" />
                    <div className="strategy-list-body">
                      <p className="strategy-list-layer">Aşama 01</p>
                      <h3>Mühendislik ve Üretim</h3>
                      <p>
                        Klima santrali, havalandırma fanı ve soğutma ekipmanlarını
                        proje özelinde tasarlayıp kendi tesisimizde üretiyoruz.
                      </p>
                    </div>
                  </li>
                  <li className="strategy-list-item reveal delay-1">
                    <span className="strategy-list-marker" aria-hidden="true" />
                    <div className="strategy-list-body">
                      <p className="strategy-list-layer">Aşama 02</p>
                      <h3>Montaj ve Devreye Alma</h3>
                      <p>
                        Otel, hastane, AVM ve endüstriyel tesislerde sistemleri
                        kurar, test eder ve performans hedeflerine göre ayarlarız.
                      </p>
                    </div>
                  </li>
                  <li className="strategy-list-item reveal delay-2">
                    <span className="strategy-list-marker" aria-hidden="true" />
                    <div className="strategy-list-body">
                      <p className="strategy-list-layer">Aşama 03</p>
                      <h3>Servis ve Bakım</h3>
                      <p>
                        Yurt içi ve yurt dışı projelerimizde uzun ömürlü
                        operasyon için periyodik bakım ve teknik destek sunuyoruz.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
              <div className="metrics-scroll-section metrics-scroll-inline strategy-metrics-aside">
                <div className="metrics-scroll-sticky">
                  <div className="metric-spot-grid metric-spot-grid--stack">
                    <article className="metric-spot-card tone-1">
                      <h3 className="metric-spot-number" data-target="1" data-compact="M">
                        0M+
                      </h3>
                      <p>m² Tamamlanan Proje Alanı</p>
                    </article>
                    <article className="metric-spot-card tone-2">
                      <h3 className="metric-spot-number" data-target="5">
                        0+
                      </h3>
                      <p>Aktif Ülke (Yurt Dışı)</p>
                    </article>
                    <article className="metric-spot-card tone-3">
                      <h3 className="metric-spot-number" data-target="4">
                        0+
                      </h3>
                      <p>Ürün Kategorisi</p>
                    </article>
                    <article className="metric-spot-card tone-4">
                      <h3 className="metric-spot-number" data-target="100" data-plus="0">
                        0
                      </h3>
                      <p>% Yerli Üretim</p>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="section services-section">
          <div className="container">
            <div className="section-top services-section-head reveal">
              <p className="eyebrow">Ürünlerimiz</p>
              <h2>İklimlendirme ve havalandırma ürün ailesi</h2>
            </div>
            <div className="cards services-grid">
              <article className="card service-card reveal">
                <div className="service-card-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="6" width="18" height="12" rx="2" />
                    <path d="M7 10h10M7 14h6M12 6v12" />
                  </svg>
                </div>
                <div className="service-card-body">
                  <h3>Klima Santralleri</h3>
                  <p>
                    İç ortamın sıcaklığını kontrol ederek havayı ısıtan, soğutan
                    ve taze hava ihtiyacını karşılayan üniteler.
                  </p>
                </div>
              </article>
              <article className="card service-card reveal delay-1">
                <div className="service-card-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round">
                    <circle cx="12" cy="12" r="2.5" />
                    <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21" />
                    <path d="M6.3 6.3l1.8 1.8M15.9 15.9l1.8 1.8M6.3 17.7l1.8-1.8M15.9 8.1l1.8-1.8" />
                  </svg>
                </div>
                <div className="service-card-body">
                  <h3>Havalandırma Fanları</h3>
                  <p>
                    Geniş hacimlerde hava akışı oluşturan endüstriyel ve ticari
                    fan çözümleri.
                  </p>
                </div>
              </article>
              <article className="card service-card reveal delay-2">
                <div className="service-card-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3.5c-3.8 5.8-6.5 9.8-6.5 13.2a6.5 6.5 0 1013 0c0-3.4-2.7-7.4-6.5-13.2z" />
                    <path d="M12 15v3" />
                  </svg>
                </div>
                <div className="service-card-body">
                  <h3>Soğutma Ekipmanları</h3>
                  <p>
                    Endüstriyel ve ticari tesisler için yüksek verimli soğutma
                    sistemleri ve özel ekipmanlar.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="solutions" className="section gradient-block">
          <div className="container">
            <div className="section-top reveal">
              <p className="eyebrow">Referans Sektörler</p>
              <h2>Otel, Hastane, AVM ve Endüstri</h2>
            </div>
            <div className="timeline">
              <article className="timeline-item reveal">
                <span>01</span>
                <div>
                  <h3>Otel ve Konaklama</h3>
                  <p>
                    Misafir konforu için sessiz ve verimli klima santral ve
                    havalandırma çözümleri.
                  </p>
                </div>
              </article>
              <article className="timeline-item reveal delay-1">
                <span>02</span>
                <div>
                  <h3>Hastane ve Sağlık</h3>
                  <p>
                    Hijyen standartlarına uygun, filtreli ve dezenfeksiyon
                    destekli iklimlendirme sistemleri.
                  </p>
                </div>
              </article>
              <article className="timeline-item reveal delay-2">
                <span>03</span>
                <div>
                  <h3>AVM ve Endüstri</h3>
                  <p>
                    Yüksek kapasiteli alanlarda kararlı ısı konforu ve
                    sürdürülebilir hava akışı.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section message-block dark-block">
          <div className="container quote reveal">
            <p className="eyebrow">Ekibimizden</p>
            <h2>
              "İklimlendirme alanında 1 milyon m²'yi aşan proje deneyimimizle,
              her projeye sağlıklı hava ve uzun ömürlü performans taahhüt
              ediyoruz."
            </h2>
            <p className="quote-author">AeroSystem Ekibi</p>
          </div>
        </section>

        <section className="section faq-section">
          <div className="container">
            <div className="section-top reveal">
              <p className="eyebrow">Sıkça Sorulan Sorular</p>
              <h2>Merak edilen konulara hızlı yanıtlar</h2>
            </div>
            <div className="faq-layout">
              <div className="faq-list">
                <details className="faq-item" open>
                  <summary>Hangi ürünleri üretiyorsunuz?</summary>
                  <p>
                    Klima santralleri, havalandırma fanları, soğutma ekipmanları
                    ve iklimlendirme sistemlerini tek çatı altında üretip
                    sahaya teslim ediyoruz.
                  </p>
                </details>
                <details className="faq-item">
                  <summary>Yurt dışında hangi ülkelerde projeniz var?</summary>
                  <p>
                    Azerbaycan, Irak, Kosova, Arnavutluk ve Tacikistan'da otel,
                    hastane ve endüstriyel tesis projelerinde aktif olarak çalıştık.
                  </p>
                </details>
                <details className="faq-item">
                  <summary>Hangi sektörlere hizmet veriyorsunuz?</summary>
                  <p>
                    Otel, hastane, alışveriş merkezi ve endüstriyel tesisler
                    başta olmak üzere geniş bir referans portföyümüz bulunmaktadır.
                  </p>
                </details>
                <details className="faq-item">
                  <summary>Bakım ve servis hizmeti veriyor musunuz?</summary>
                  <p>
                    Evet. Ürettiğimiz tüm iklimlendirme ve havalandırma sistemleri
                    için kısa ve uzun dönem bakım anlaşmaları sunuyoruz.
                  </p>
                </details>
              </div>
              <aside className="faq-contact-box">
                <p className="faq-contact-eyebrow">İletişim Al</p>
                <h3>Projenize özel hızlı geri dönüş alın</h3>
                <p>
                  İhtiyacınızı bize iletin, uzman ekibimiz en uygun HVAC çözümü
                  için kısa sürede sizinle iletişime geçsin.
                </p>
                <a href="#contact" className="btn btn-primary">
                  Hemen İletişime Geç
                </a>
              </aside>
            </div>
          </div>
        </section>

        <section className="slogan-strip">
          <div className="slogan-track">
            <span>İklimlendirme ve Havalandırma Sistemleri</span>
            <span>1.000.000 m² Proje Deneyimi</span>
            <span>5 Ülkede Aktif Çözüm Ortağı</span>
            <span>İklimlendirme ve Havalandırma Sistemleri</span>
            <span>1.000.000 m² Proje Deneyimi</span>
            <span>5 Ülkede Aktif Çözüm Ortağı</span>
          </div>
        </section>

        <section className="section cta-section">
          <div className="container cta-box reveal">
            <p className="eyebrow">Hızlı Teklif</p>
            <h2>Projenize özel iklimlendirme çözümünü birlikte planlayalım</h2>
            <p>
              Klima santrali, havalandırma fanı veya soğutma ekipmanı
              ihtiyacınızı paylaşın; mühendislik ekibimiz proje özelinde kısa
              sürede teklif sunsun.
            </p>
            <div className="cta-actions">
              <a href="#contact" className="btn btn-primary">
                Teklif Al
              </a>
              <a href="#contact" className="btn btn-ghost">
                Katalog İste
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="site-footer">
        <div className="container footer-grid reveal">
          <div className="footer-brand">
            <img className="footer-logo" src="/aero-logo.png" alt="AeroSystem" />
            <p>
              Havalandırma ve iklimlendirme sistemleri alanında üretim,
              mühendislik ve montaj hizmeti sunan AeroSystem; 1 milyon m²
              proje deneyimiyle yurt içi ve yurt dışında çözüm üretmeye
              devam ediyor.
            </p>
            <div className="footer-socials">
              <a href="#home" aria-label="Facebook">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 8h3V5h-3c-2.8 0-5 2.2-5 5v2H7v3h2v6h3v-6h3l1-3h-4v-2c0-1.1.9-2 2-2z" />
                </svg>
              </a>
              <a href="#home" aria-label="Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm11.5 1.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                </svg>
              </a>
              <a href="#home" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.5 8.5H3.5v12h3v-12zM5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm4.5 5.5h2.9v1.7h.1c.4-.8 1.5-1.9 3.3-1.9 3.5 0 4.2 2.3 4.2 5.4v6.8h-3v-6c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3v6.1h-3v-12z" />
                </svg>
              </a>
              <a href="#home" aria-label="YouTube">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2C2 9 2 12 2 12s0 3 .4 4.8a2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2c.4-1.8.4-4.8.4-4.8s0-3-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Ürünlerimiz</h4>
            <a href="#services">İklimlendirme</a>
            <a href="#services">Klima Santralleri</a>
            <a href="#services">Havalandırma Fanları</a>
            <a href="#services">Soğutma Ekipmanları</a>
            <a href="#solutions">Referans Sektörler</a>
          </div>
          <div className="footer-col">
            <h4>Kurumsal</h4>
            <a href="#home">Anasayfa</a>
            <a href="#about">Hakkımızda</a>
            <a href="#services">Ürünlerimiz</a>
            <a href="#home">Belgelerimiz</a>
            <a href="#home">Katalog</a>
            <a href="#contact">İletişim</a>
          </div>
          <div className="footer-col footer-contact">
            <h4>İletişim</h4>
            <p><strong>Adres:</strong> Ramazanoğlu Mah. Sanayi Cad. Kurtköy Sanayi Sitesi No:44/B Blok No:75 Pendik / İstanbul</p>
            <p><strong>Telefon:</strong> +90 (530) 241 23 76</p>
            <p><strong>E-posta:</strong> info@aerosystem.com.tr</p>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container footer-bottom-row">
            <p>© 2026 AeroSystem — Havalandırma ve İklimlendirme Sistemleri. Tüm hakları saklıdır.</p>
            <div>
              <a href="#home">Gizlilik Politikası</a>
              <a href="#home">Şartlar ve Koşullar</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
