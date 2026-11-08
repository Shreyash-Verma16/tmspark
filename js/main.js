    // --- Initialize Lenis Smooth Scrolling ---
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });
    window.lenis = lenis;

    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    document.addEventListener('DOMContentLoaded', () => {

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // =========================================================
      // 1. HERO TYPOGRAPHY & INTERACTIVE LANDING ANIMATION CONTROLLER
      // =========================================================
      const heroTypedTextEl = document.getElementById('hero-typed-text');
      const heroTypingCursorEl = document.getElementById('hero-typing-cursor');
      const heroSubtitleRowEl = document.getElementById('hero-subtitle-row');
      const heroSubtitleEl = document.getElementById('hero-subtitle');
      const cornerBadgeEl = document.getElementById('corner-badge');
      const heroActionsEl = document.getElementById('hero-actions');
      const navWrapperEl = document.getElementById('nav-wrapper');
      const canvasContainer = document.getElementById('canvas-container');
      const dotGridEl = document.getElementById('stitch-dot-grid');

      const primaryHeadlineText = "Beyond What You Type.";

      // Controllable state machine: 'IDLE' -> 'RUNNING' -> 'ACCELERATING' -> 'DONE'
      let heroAnimationState = 'IDLE';
      let typeTimer = null;
      let startTimeout = null;
      let cursorTimeout = null;
      let navTimeout = null;
      let canvasTimeout = null;
      let normalIntroTl = null;
      let charIdx = 0;

      function completeHeroIntroDirectly() {
        if (heroAnimationState === 'DONE') return;
        heroAnimationState = 'DONE';
        cleanupInteractionListeners();

        if (heroTypedTextEl) heroTypedTextEl.textContent = primaryHeadlineText;
        if (heroTypingCursorEl) heroTypingCursorEl.classList.add('cursor-done');

        if (heroSubtitleRowEl || heroSubtitleEl) {
          gsap.set(heroSubtitleRowEl || heroSubtitleEl, {
            opacity: 1, y: 0, filter: "blur(0px)"
          });
        }
        if (heroActionsEl) {
          gsap.set(heroActionsEl, {
            opacity: 1, y: 0, filter: "blur(0px)"
          });
        }
        if (navWrapperEl) {
          navWrapperEl.classList.add('nav-visible');
          gsap.set(navWrapperEl, { opacity: 1, y: 0 });
        }
        if (canvasContainer) {
          canvasContainer.classList.add('canvas-active');
          gsap.set(canvasContainer, { opacity: 0.55, scale: 1 });
        }
      }

      function accelerateHeroIntro() {
        if (heroAnimationState !== 'RUNNING') return;
        heroAnimationState = 'ACCELERATING';
        cleanupInteractionListeners();

        // 1. Cancel normal timers & pending tweens
        if (typeTimer) clearInterval(typeTimer);
        if (startTimeout) clearTimeout(startTimeout);
        if (cursorTimeout) clearTimeout(cursorTimeout);
        if (navTimeout) clearTimeout(navTimeout);
        if (canvasTimeout) clearTimeout(canvasTimeout);
        if (normalIntroTl) normalIntroTl.kill();

        // 2. Finish any remaining headline text rapidly over ~140ms
        const remainingChars = primaryHeadlineText.length - charIdx;
        if (remainingChars > 0 && heroTypedTextEl) {
          const fastIntervalTime = Math.max(10, Math.floor(130 / remainingChars));
          const fastType = setInterval(() => {
            charIdx++;
            heroTypedTextEl.textContent = primaryHeadlineText.slice(0, charIdx);
            if (charIdx >= primaryHeadlineText.length) {
              clearInterval(fastType);
              if (heroTypingCursorEl) heroTypingCursorEl.classList.add('cursor-done');
            }
          }, fastIntervalTime);
        } else {
          if (heroTypedTextEl) heroTypedTextEl.textContent = primaryHeadlineText;
          if (heroTypingCursorEl) heroTypingCursorEl.classList.add('cursor-done');
        }

        // 3. Smoothly accelerate subtitle, buttons, navigation, and canvas together (~0.55-0.70s)
        const accelTl = gsap.timeline({
          defaults: { ease: "power2.out" },
          onComplete: () => {
            heroAnimationState = 'DONE';
          }
        });

        gsap.killTweensOf([heroSubtitleRowEl || heroSubtitleEl, heroActionsEl, navWrapperEl, canvasContainer]);

        if (navWrapperEl) navWrapperEl.classList.add('nav-visible');
        if (canvasContainer) canvasContainer.classList.add('canvas-active');

        accelTl
          .to(heroSubtitleRowEl || heroSubtitleEl, {
            opacity: 1, y: 0, filter: "blur(0px)", duration: 0.52
          }, 0)
          .to(heroActionsEl, {
            opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55
          }, 0.04)
          .to(navWrapperEl, {
            opacity: 1, y: 0, duration: 0.62
          }, 0.06)
          .to(canvasContainer, {
            opacity: 0.55, scale: 1, duration: 0.78
          }, 0.08);
      }

      function runHeroTypographyIntro() {
        if (prefersReducedMotion) {
          completeHeroIntroDirectly();
          return;
        }

        heroAnimationState = 'RUNNING';
        charIdx = 0;

        startTimeout = setTimeout(() => {
          if (heroAnimationState !== 'RUNNING') return;

          // Initial typing animation on clean screen
          typeTimer = setInterval(() => {
            if (heroAnimationState !== 'RUNNING') {
              clearInterval(typeTimer);
              return;
            }

            charIdx++;
            heroTypedTextEl.textContent = primaryHeadlineText.slice(0, charIdx);

            if (charIdx >= primaryHeadlineText.length) {
              clearInterval(typeTimer);

              cursorTimeout = setTimeout(() => {
                if (heroAnimationState !== 'RUNNING') return;
                if (heroTypingCursorEl) heroTypingCursorEl.classList.add('cursor-done');

                // Buttons and subtitle reveal smoothly
                normalIntroTl = gsap.timeline({
                  defaults: { ease: "power3.out" },
                  onComplete: () => {
                    if (heroAnimationState !== 'RUNNING') return;

                    // Navigation bar glides down
                    navTimeout = setTimeout(() => {
                      if (heroAnimationState !== 'RUNNING') return;
                      if (navWrapperEl) {
                        navWrapperEl.classList.add('nav-visible');
                        gsap.to(navWrapperEl, {
                          opacity: 1, y: 0, duration: 0.85, ease: "expo.out"
                        });
                      }

                      // Fluid canvas flows in
                      canvasTimeout = setTimeout(() => {
                        if (heroAnimationState !== 'RUNNING') return;
                        if (canvasContainer) {
                          canvasContainer.classList.add('canvas-active');
                          gsap.fromTo(canvasContainer,
                            { opacity: 0, scale: 0.84 },
                            {
                              opacity: 0.55, scale: 1, duration: 2.0, ease: "power2.out",
                              onComplete: () => {
                                heroAnimationState = 'DONE';
                                cleanupInteractionListeners();
                              }
                            }
                          );
                        } else {
                          heroAnimationState = 'DONE';
                          cleanupInteractionListeners();
                        }
                      }, 320);

                    }, 280);
                  }
                });

                normalIntroTl
                  .fromTo(heroSubtitleRowEl || heroSubtitleEl,
                    { opacity: 0, y: 20, filter: "blur(10px)" },
                    { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.75 }
                  )
                  .fromTo(heroActionsEl,
                    { opacity: 0, y: 20, filter: "blur(10px)" },
                    { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7 },
                    "-=0.25"
                  );
              }, 240);
            }
          }, 65);
        }, 280);
      }

      // Interaction listeners: detect early wheel, touch, scroll, pointer, or navigation key
      function onEarlyUserInteraction() {
        if (heroAnimationState === 'RUNNING') {
          accelerateHeroIntro();
        }
      }

      const scrollCheckHandler = () => {
        const sy = window.scrollY || window.pageYOffset || 0;
        if (sy > 2) onEarlyUserInteraction();
      };

      const keyHandler = (e) => {
        if (['Space', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Enter'].includes(e.code)) {
          onEarlyUserInteraction();
        }
      };

      window.addEventListener('wheel', onEarlyUserInteraction, { passive: true });
      window.addEventListener('touchstart', onEarlyUserInteraction, { passive: true });
      window.addEventListener('touchmove', onEarlyUserInteraction, { passive: true });
      window.addEventListener('pointerdown', onEarlyUserInteraction, { passive: true });
      window.addEventListener('scroll', scrollCheckHandler, { passive: true });
      window.addEventListener('keydown', keyHandler, { passive: true });

      if (typeof lenis !== 'undefined') {
        lenis.on('scroll', (e) => {
          if (e.scroll > 2) onEarlyUserInteraction();
        });
      }

      function cleanupInteractionListeners() {
        window.removeEventListener('wheel', onEarlyUserInteraction);
        window.removeEventListener('touchstart', onEarlyUserInteraction);
        window.removeEventListener('touchmove', onEarlyUserInteraction);
        window.removeEventListener('pointerdown', onEarlyUserInteraction);
        window.removeEventListener('scroll', scrollCheckHandler);
        window.removeEventListener('keydown', keyHandler);
      }

      runHeroTypographyIntro();


      // =========================================================
      // 2. SMOOTH ACTIVE-SECTION NAVIGATION PILL CONTROLLER
      // =========================================================
      const islandLinksContainer = document.getElementById('island-links-container');
      const navLiquidPill = document.getElementById('nav-liquid-pill');
      const navLinks = islandLinksContainer ? Array.from(islandLinksContainer.querySelectorAll('.nav-link')) : [];

      const sectionMap = [
        { id: 'top', el: document.getElementById('top') },
        { id: 'philosophy', el: document.getElementById('philosophy') },
        { id: 'features', el: document.getElementById('features') },
        { id: 'beyond-keyboard', el: document.getElementById('beyond-keyboard') },
        { id: 'models', el: document.getElementById('models') },
        { id: 'plans', el: document.getElementById('plans') },
        { id: 'privacy', el: document.getElementById('privacy') }
      ].filter(item => item.el !== null);

      let currentActiveSectionId = 'top';
      let isNavClickScrolling = false;
      let navClickTimeout = null;

      function moveNavPillTo(targetLink, immediate = false) {
        if (!navLiquidPill || !islandLinksContainer || !targetLink) return;

        const x = targetLink.offsetLeft;
        const w = targetLink.offsetWidth;

        if (w <= 0) return;

        navLinks.forEach(link => {
          if (link === targetLink) {
            link.classList.add('active-section');
          } else {
            link.classList.remove('active-section');
          }
        });

        if (immediate || prefersReducedMotion) {
          gsap.set(navLiquidPill, {
            x: x,
            width: w,
            opacity: 1
          });
        } else {
          gsap.to(navLiquidPill, {
            x: x,
            width: w,
            opacity: 1,
            duration: 0.45,
            ease: "cubic-bezier(0.22, 1, 0.36, 1)",
            overwrite: "auto"
          });
        }
      }

      function setActiveSection(sectionId, immediate = false) {
        if (!sectionId) return;
        currentActiveSectionId = sectionId;
        const matchingLink = navLinks.find(link => link.dataset.section === sectionId);
        if (matchingLink) {
          moveNavPillTo(matchingLink, immediate);
        }
      }

      function updateActiveSectionFromScroll() {
        if (isNavClickScrolling) return;
        if (!sectionMap.length) return;

        const scrollY = window.scrollY || window.pageYOffset || 0;
        const vh = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;

        // 1. Top of page
        if (scrollY < 120) {
          if (currentActiveSectionId !== 'top') {
            setActiveSection('top');
          }
          return;
        }

        // 2. Bottom of page -> Privacy
        if (scrollY + vh >= docHeight - 60) {
          const lastSection = sectionMap[sectionMap.length - 1];
          if (lastSection && currentActiveSectionId !== lastSection.id) {
            setActiveSection(lastSection.id);
          }
          return;
        }

        // 3. Scan sections with a focal reading band at ~36% viewport height
        const focalY = vh * 0.36;
        let bestSectionId = null;

        for (let i = 0; i < sectionMap.length; i++) {
          const item = sectionMap[i];
          const rect = item.el.getBoundingClientRect();

          if (rect.top <= focalY && rect.bottom >= focalY) {
            bestSectionId = item.id;
            break;
          }
        }

        // If between section padding gaps, pick closest
        if (!bestSectionId) {
          let minDistance = Infinity;
          for (let i = 0; i < sectionMap.length; i++) {
            const item = sectionMap[i];
            const rect = item.el.getBoundingClientRect();
            const dist = Math.min(Math.abs(rect.top - focalY), Math.abs(rect.bottom - focalY));
            if (dist < minDistance) {
              minDistance = dist;
              bestSectionId = item.id;
            }
          }
        }

        if (bestSectionId && bestSectionId !== currentActiveSectionId) {
          setActiveSection(bestSectionId);
        }
      }

      // Nav click handling: smooth Lenis navigation & immediate pill transition without jitter
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          const targetSectionId = link.dataset.section;
          if (targetSectionId) {
            e.preventDefault();
            const targetEl = document.getElementById(targetSectionId);
            isNavClickScrolling = true;
            setActiveSection(targetSectionId);

            if (targetEl) {
              if (window.lenis) {
                window.lenis.scrollTo(targetEl, {
                  offset: targetSectionId === 'top' ? 0 : -20,
                  duration: 1.15
                });
              } else {
                targetEl.scrollIntoView({ behavior: 'smooth' });
              }
            }

            if (navClickTimeout) clearTimeout(navClickTimeout);
            navClickTimeout = setTimeout(() => {
              isNavClickScrolling = false;
              updateActiveSectionFromScroll();
            }, 1200);
          }
        });
      });

      // Scroll listeners for active nav pill
      window.addEventListener('scroll', updateActiveSectionFromScroll, { passive: true });
      if (typeof lenis !== 'undefined') {
        lenis.on('scroll', updateActiveSectionFromScroll);
      }

      // Window resize recalculation
      window.addEventListener('resize', () => {
        const activeLink = navLinks.find(link => link.dataset.section === currentActiveSectionId);
        if (activeLink) moveNavPillTo(activeLink, true);
      }, { passive: true });

      // Initial alignment on load
      window.addEventListener('load', () => {
        const initialLink = navLinks.find(link => link.dataset.section === currentActiveSectionId) || navLinks[0];
        if (initialLink) moveNavPillTo(initialLink, true);
      });
      requestAnimationFrame(() => {
        const initialLink = navLinks.find(link => link.dataset.section === currentActiveSectionId) || navLinks[0];
        if (initialLink) moveNavPillTo(initialLink, true);
      });

      // Smooth Entrance Bloom for Moving Ambient Lights when reaching that section
      const ambientGlowEls = document.querySelectorAll('.ambient-glow-aura, .ambient-glow-cyan-wide, .ambient-glow-purple-wide');
      if ('IntersectionObserver' in window) {
        const glowObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('glow-bloomed');
            }
          });
        }, {
          threshold: 0.12,
          rootMargin: "0px 0px -40px 0px"
        });

        ambientGlowEls.forEach(glow => glowObserver.observe(glow));
      } else {
        ambientGlowEls.forEach(glow => glow.classList.add('glow-bloomed'));
      }


                  // =========================================================
      // ULTRA-SMOOTH SCROLL-DRIVEN VIDEO SHOWCASE & MOUSE FOLLOWER
      // =========================================================
      const sparkVideoSection = document.getElementById('philosophy');
      const sparkVideoShell = document.getElementById('spark-video-shell');
      const sparkVideoFrame = document.getElementById('spark-video-frame');
      const sparkShowcaseVideo = document.getElementById('spark-showcase-video');
      const sparkVideoPlaceholder = document.getElementById('spark-video-placeholder');
      const sparkVideoPlayToggle = document.getElementById('spark-video-play-toggle');
      const videoCursorPill = document.getElementById('video-cursor-pill');
      const videoCursorIcon = document.getElementById('video-cursor-icon');
      const videoCursorText = document.getElementById('video-cursor-text');

      // Hide Dynamic Island during Video Showcase section
      if (sparkVideoSection && navWrapperEl) {
        ScrollTrigger.create({
          trigger: sparkVideoSection,
          start: 'top 20%',
          end: 'bottom 80%',
          onEnter: () => navWrapperEl.classList.add('nav-hidden-video'),
          onLeave: () => {
            navWrapperEl.classList.remove('nav-hidden-video');
            if (typeof updateActiveSectionFromScroll === 'function') updateActiveSectionFromScroll();
          },
          onEnterBack: () => navWrapperEl.classList.add('nav-hidden-video'),
          onLeaveBack: () => {
            navWrapperEl.classList.remove('nav-hidden-video');
            if (typeof updateActiveSectionFromScroll === 'function') updateActiveSectionFromScroll();
          },
        });
      }

      // Ultra-smooth follower cursor with slow liquid momentum
      if (sparkVideoShell && videoCursorPill) {
        let mouseX = -200, mouseY = -200;
        let followerX = -200, followerY = -200;
        let isHovered = false;
        let scaleVal = 0;
        let isMouseDown = false;

        const loopCursorFollower = () => {
          // Slow, ultra-smooth liquid damping (0.10 factor gives trailing momentum)
          followerX += (mouseX - followerX) * 0.10;
          followerY += (mouseY - followerY) * 0.10;

          if (isHovered) {
            scaleVal += (1 - scaleVal) * 0.16;
          } else {
            scaleVal += (0 - scaleVal) * 0.22;
          }

          if (scaleVal > 0.01) {
            const pressScale = isMouseDown ? 0.90 : 1;
            const finalScale = scaleVal * pressScale;
            videoCursorPill.style.transform = `translate3d(${followerX.toFixed(2)}px, ${followerY.toFixed(2)}px, 0) translate(-50%, -50%) scale(${finalScale.toFixed(3)})`;
            videoCursorPill.style.opacity = scaleVal.toFixed(2);
          } else {
            videoCursorPill.style.opacity = '0';
          }

          requestAnimationFrame(loopCursorFollower);
        };
        requestAnimationFrame(loopCursorFollower);

        const setCursorPos = (e) => {
          mouseX = e.clientX;
          mouseY = e.clientY;
        };

        sparkVideoShell.addEventListener('mouseenter', (e) => {
          isHovered = true;
          mouseX = followerX = e.clientX;
          mouseY = followerY = e.clientY;
        });

        sparkVideoShell.addEventListener('mousemove', (e) => {
          isHovered = true;
          setCursorPos(e);
        });

        sparkVideoShell.addEventListener('mouseleave', () => {
          isHovered = false;
          isMouseDown = false;
        });

        sparkVideoShell.addEventListener('mousedown', () => {
          isMouseDown = true;
        });

        window.addEventListener('mouseup', () => {
          isMouseDown = false;
        });

        function syncCursorState() {
          if (!sparkShowcaseVideo) return;
          const isPaused = sparkShowcaseVideo.paused;
          if (videoCursorIcon) {
            videoCursorIcon.innerHTML = isPaused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
          }
          if (videoCursorText) {
            videoCursorText.textContent = isPaused ? 'Play intro' : 'Pause';
          }
        }

        sparkVideoShell.addEventListener('click', () => {
          if (!sparkShowcaseVideo) return;
          if (sparkShowcaseVideo.paused) {
            sparkShowcaseVideo.play().catch(() => {});
          } else {
            sparkShowcaseVideo.pause();
          }
          syncCursorState();
        });

        if (sparkShowcaseVideo) {
          sparkShowcaseVideo.addEventListener('play', syncCursorState);
          sparkShowcaseVideo.addEventListener('pause', syncCursorState);
        }
      }

      // High-performance video showcase scroll architecture
      if (sparkVideoSection && sparkVideoShell && sparkVideoFrame) {
        if (prefersReducedMotion) {
          gsap.set(sparkVideoShell, { opacity: 1, scale: 1, y: 0 });
          gsap.set(sparkVideoFrame, { borderRadius: 16 });
        } else {
          const getMotionConfig = () => {
            const w = window.innerWidth;
            if (w < 768) {
              return { initialScale: 0.85, initialY: window.innerHeight * 0.35, maxRadius: 20, entranceEnd: 0.55 };
            } else if (w < 1024) {
              return { initialScale: 0.76, initialY: window.innerHeight * 0.48, maxRadius: 28, entranceEnd: 0.58 };
            } else {
              return { initialScale: 0.70, initialY: window.innerHeight * 0.58, maxRadius: 36, entranceEnd: 0.58 };
            }
          };

          let cfg = getMotionConfig();
          window.addEventListener('resize', () => {
            cfg = getMotionConfig();
            ScrollTrigger.refresh();
          });

          const clamp01 = n => Math.max(0, Math.min(1, n));
          const smoothstep = n => {
            n = clamp01(n);
            return n * n * (3 - 2 * n);
          };

          // Render direct GPU transforms in lockstep with Lenis smooth scroll
          const renderShowcase = (progress) => {
            const normP = clamp01(progress);
            const entranceProgress = clamp01(normP / cfg.entranceEnd);
            const ease = smoothstep(entranceProgress);

            const currentScale = cfg.initialScale + (1.0 - cfg.initialScale) * ease;
            const currentY = cfg.initialY * (1.0 - ease);
            const currentRadius = cfg.maxRadius * (1.0 - ease);

            // Directly update GPU matrix without CSS variable style recalcs
            sparkVideoShell.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0) scale(${currentScale.toFixed(4)})`;
            sparkVideoFrame.style.borderRadius = `${currentRadius.toFixed(1)}px`;
          };

          // Direct sync with Lenis frame schedule
          ScrollTrigger.create({
            trigger: sparkVideoSection,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: self => renderShowcase(self.progress),
            onLeaveBack: () => renderShowcase(0),
            onLeave: () => renderShowcase(1),
            onRefresh: self => renderShowcase(self.progress)
          });

          renderShowcase(0);
        }
      }

      const sparkVideoSoundToggle = document.getElementById('spark-video-sound-toggle');

      function updateSoundToggleUI(isUnmuted) {
        if (!sparkVideoSoundToggle) return;
        if (isUnmuted) {
          sparkVideoSoundToggle.classList.add('is-unmuted');
          sparkVideoSoundToggle.setAttribute('aria-label', 'Mute product film');
          sparkVideoSoundToggle.innerHTML = '<i class="fa-solid fa-volume-high" aria-hidden="true"></i> <span class="sound-toggle-label">Sound On</span>';
        } else {
          sparkVideoSoundToggle.classList.remove('is-unmuted');
          sparkVideoSoundToggle.setAttribute('aria-label', 'Enable sound for product film');
          sparkVideoSoundToggle.innerHTML = '<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i> <span class="sound-toggle-label">Enable Sound</span>';
        }
      }

      if (sparkShowcaseVideo) {
        sparkShowcaseVideo.muted = true;
        sparkShowcaseVideo.defaultMuted = true;
        updateSoundToggleUI(false);

        if (sparkVideoSoundToggle) {
          sparkVideoSoundToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sparkShowcaseVideo.muted) {
              sparkShowcaseVideo.muted = false;
              sparkShowcaseVideo.volume = 1.0;
              updateSoundToggleUI(true);
            } else {
              sparkShowcaseVideo.muted = true;
              updateSoundToggleUI(false);
            }
          });
        }

        sparkShowcaseVideo.addEventListener('volumechange', () => {
          updateSoundToggleUI(!sparkShowcaseVideo.muted);
        });
        if (prefersReducedMotion) {
          sparkShowcaseVideo.removeAttribute('autoplay');
          sparkShowcaseVideo.pause();
        }
        let userPausedFilm = false;
        let filmVisible = false;
        const updateFilmToggle = () => {
          if (!sparkVideoPlayToggle) return;
          const paused = sparkShowcaseVideo.paused;
          sparkVideoPlayToggle.setAttribute('aria-label', paused ? 'Play product film' : 'Pause product film');
          sparkVideoPlayToggle.innerHTML = paused
            ? '<i class="fa-solid fa-play" aria-hidden="true"></i>'
            : '<i class="fa-solid fa-pause" aria-hidden="true"></i>';
        };
        const playFilmIfAllowed = () => {
          if (!filmVisible || userPausedFilm || prefersReducedMotion || sparkShowcaseVideo.readyState < 2) return;
          const playAttempt = sparkShowcaseVideo.play();
          if (playAttempt && typeof playAttempt.catch === 'function') playAttempt.catch(() => {});
        };
        sparkShowcaseVideo.addEventListener('loadeddata', () => {
          if (sparkVideoPlaceholder) sparkVideoPlaceholder.classList.add('is-hidden');
          if (sparkVideoPlayToggle) sparkVideoPlayToggle.hidden = false;
          playFilmIfAllowed();
          updateFilmToggle();
        });
        sparkShowcaseVideo.addEventListener('play', updateFilmToggle);
        sparkShowcaseVideo.addEventListener('pause', updateFilmToggle);
        if ('IntersectionObserver' in window) {
          const filmObserver = new IntersectionObserver(entries => {
            filmVisible = entries[0].isIntersecting;
            if (filmVisible) playFilmIfAllowed();
            else sparkShowcaseVideo.pause();
          }, { threshold: 0.15 });
          filmObserver.observe(sparkVideoSection);
        } else {
          filmVisible = true;
          playFilmIfAllowed();
        }
        if (sparkVideoPlayToggle) {
          sparkVideoPlayToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sparkShowcaseVideo.paused) {
              userPausedFilm = false;
              sparkShowcaseVideo.play().catch(() => {});
            } else {
              userPausedFilm = true;
              sparkShowcaseVideo.pause();
            }
          });
        }
      }


      
      // =========================================================
      // 4. VOLUMETRIC 3D FLUID SILK CANVAS RUNTIME
      // =========================================================
      const fluidCanvas = document.getElementById('fluid-canvas');
      if (fluidCanvas) {
        const ctx = fluidCanvas.getContext('2d');
        let width = fluidCanvas.width = window.innerWidth;
        let height = fluidCanvas.height = window.innerHeight;
        let time = 0;

        window.addEventListener('resize', () => {
          width = fluidCanvas.width = window.innerWidth;
          height = fluidCanvas.height = window.innerHeight;
        });

        const fov = 720;
        const cameraZ = 340;

        function project3D(x, y, z) {
          const depth = z + cameraZ;
          const scale = fov / Math.max(1, depth);
          return {
            x: (width * 0.5) + x * scale,
            y: (height * 0.48) + y * scale,
            scale: scale
          };
        }

        function drawContinuousSilkLayer(layerIndex, totalLayers, speed, ampMultiplier, alpha, phaseShift) {
          ctx.save();
          ctx.beginPath();
          const stepCount = 50;
          const layerDepthZ = (layerIndex / totalLayers) * 380;
          const layerYOffset = (layerIndex / totalLayers) * 115;
          const points = [];

          for (let i = 0; i <= stepCount; i++) {
            const u = (i / stepCount) * 2 - 1;
            const worldX = u * (width * 0.74);
            const uDip = (Math.pow(Math.abs(u), 1.85) * -380) + ((1 - Math.pow(Math.abs(u), 2.2)) * 280);
            const wave1 = Math.sin(u * 4.8 + time * speed + layerIndex * 0.45 + phaseShift) * (42 * ampMultiplier);
            const wave2 = Math.cos(u * 2.8 - time * (speed * 0.75) + layerIndex * 0.3) * (26 * ampMultiplier);
            const wave3 = Math.sin(u * 8.5 + time * (speed * 1.3)) * 14;
            const worldY = uDip + layerYOffset + wave1 + wave2 + wave3;
            const concaveZ = (1 - Math.pow(Math.abs(u), 1.6)) * 460 + layerDepthZ;
            const waveZ = Math.sin(u * 4.2 + time * (speed * 0.9)) * 38;
            const worldZ = concaveZ + waveZ;
            points.push(project3D(worldX, worldY, worldZ));
          }

          ctx.moveTo(-60, height + 120);
          ctx.lineTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            const xc = (points[i].x + points[i - 1].x) * 0.5;
            const yc = (points[i].y + points[i - 1].y) * 0.5;
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
          }
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.lineTo(width + 60, height + 120);
          ctx.closePath();

          const gradAngle = time * 0.3 + (layerIndex / totalLayers) * Math.PI;
          const gx1 = (width * 0.5) + Math.cos(gradAngle) * (width * 0.55);
          const gy1 = (height * 0.5) + Math.sin(gradAngle) * (height * 0.45);
          const gx2 = (width * 0.5) - Math.cos(gradAngle) * (width * 0.55);
          const gy2 = (height * 0.5) - Math.sin(gradAngle) * (height * 0.45);
          const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);

          grad.addColorStop(0.0, '#00d2ff');
          grad.addColorStop(0.25, '#7c3aed');
          grad.addColorStop(0.50, '#d946ef');
          grad.addColorStop(0.75, '#06b6d4');
          grad.addColorStop(1.0, '#8b5cf6');

          ctx.fillStyle = grad;
          ctx.globalAlpha = alpha;
          ctx.fill();
          ctx.strokeStyle = 'rgba(124, 58, 237, 0.20)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }

        function drawAmbientGlowNode(xRatio, yRatio, radius, color, speedX, speedY, alpha) {
          const x = width * xRatio + Math.sin(time * speedX) * (width * 0.1);
          const y = height * yRatio + Math.cos(time * speedY) * (height * 0.08);
          const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
          grad.addColorStop(0, color);
          grad.addColorStop(1, 'transparent');
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        function render3DScene() {
          ctx.clearRect(0, 0, width, height);
          time += 0.016;

          // Multi-node dynamic ambient illumination
          drawAmbientGlowNode(0.12, 0.75, 480, '#00d2ff', 0.6, 0.4, 0.35);
          drawAmbientGlowNode(0.50, 0.88, 540, '#7c3aed', 0.5, 0.6, 0.30);
          drawAmbientGlowNode(0.88, 0.75, 480, '#e11d48', 0.6, 0.5, 0.30);

          const ribbonCount = 18;
          for (let i = ribbonCount - 1; i >= 0; i--) {
            const alpha = 0.16 + (i / ribbonCount) * 0.22;
            const amp = 0.92 + (i % 3) * 0.24;
            const speed = 0.95 + (i * 0.065);
            const phaseShift = (i / ribbonCount) * Math.PI * 0.8;
            drawContinuousSilkLayer(i, ribbonCount, speed, amp, alpha, phaseShift);
          }
          requestAnimationFrame(render3DScene);
        }
        render3DScene();

        // 15s flowing / 4s gentle recede cycle
        const flowDuration = 15000;
        const recedeDuration = 4000;
        setInterval(() => {
          if (canvasContainer) {
            canvasContainer.classList.add('water-recede');
            setTimeout(() => {
              canvasContainer.classList.remove('water-recede');
            }, recedeDuration);
          }
        }, flowDuration + recedeDuration);
      }


      // =========================================================
      // 6. TEST FEATURE MODAL MANAGEMENT
      // =========================================================
      const testModal = document.getElementById('test-feature-modal');
      const closeTestModalBtn = document.getElementById('close-test-modal');
      const ackTestModalBtn = document.getElementById('ack-test-modal');

      function openTestFeatureModal() {
        if (!testModal) return;
        testModal.classList.add('is-active');
        if (typeof lenis !== 'undefined') lenis.stop();
        if (ackTestModalBtn) ackTestModalBtn.focus();
      }

      function closeTestFeatureModal() {
        if (!testModal) return;
        testModal.classList.remove('is-active');
        if (typeof lenis !== 'undefined') lenis.start();
      }

      if (closeTestModalBtn) closeTestModalBtn.addEventListener('click', closeTestFeatureModal);
      if (ackTestModalBtn) ackTestModalBtn.addEventListener('click', closeTestFeatureModal);
      if (testModal) {
        testModal.addEventListener('click', (e) => {
          if (e.target === testModal) closeTestFeatureModal();
        });
      }


      // =========================================================
      // 7. BEYOND THE KEYBOARD (CHOREOGRAPHED BUBBLE-TO-ARC & WIRE SEQUENCE)
      // =========================================================
      const btkSection = document.getElementById('beyond-keyboard');
      const btkLeftCol = document.getElementById('btk-left-column');
      const btkRightCol = document.getElementById('btk-right-column');
      const btkPhoneScreen = document.getElementById('btk-phone-screen');
      const btkChatOutgoing = document.getElementById('chat-outgoing-text');
      const wiresCanvas = document.getElementById('wires-canvas');

      let btkSequenceTriggered = false;

      function runBeyondKeyboardSequence() {
        if (btkSequenceTriggered) return;
        btkSequenceTriggered = true;

        if (prefersReducedMotion) {
          if (btkPhoneScreen) {
            btkPhoneScreen.style.filter = "none";
            btkPhoneScreen.style.opacity = "1";
          }
          gsap.set([btkLeftCol, btkRightCol], { opacity: 1, pointerEvents: "auto" });
          drawWires(null);
          return;
        }

        const btkTl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // 1. Phone wakes up (turns on with white screen)
        btkTl.to(btkPhoneScreen, {
          filter: "brightness(1) grayscale(0)",
          opacity: 1,
          duration: 0.8,
          ease: "power2.out"
        })
        // 2. Phone types the message: "TM Spark is written"
        .add(() => {
          if (btkChatOutgoing) {
            btkChatOutgoing.textContent = "";
            let msg = "TM Spark is written";
            let c = 0;
            const t = setInterval(() => {
              c++;
              btkChatOutgoing.textContent = msg.slice(0, c);
              if (c >= msg.length) clearInterval(t);
            }, 45);
          }
        }, "+=0.15")
        // 3. Suddenly, 7 bubbles fly out from back of phone to LHS & 7 bubbles fly out to RHS!
        .set([btkLeftCol, btkRightCol], { opacity: 1, pointerEvents: "auto" }, "+=0.6")
        .fromTo('#btk-left-column .pill-card', {
          scale: 0.2,
          x: 220,
          y: 40,
          opacity: 0,
          borderRadius: "9999px"
        }, {
          scale: 1,
          x: (i) => (window.innerWidth >= 1024 ? [36, 12, -28, -44, -18, 18, 42][i] : 0),
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.75,
          ease: "back.out(1.5)"
        }, "<")
        .fromTo('#btk-right-column .pill-card', {
          scale: 0.2,
          x: -220,
          y: 40,
          opacity: 0,
          borderRadius: "9999px"
        }, {
          scale: 1,
          x: (i) => (window.innerWidth >= 1024 ? [-36, -12, 28, 44, 18, -18, -42][i] : 0),
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.75,
          ease: "back.out(1.5)"
        }, "<")
        // 4. Once all boxes have settled into their curved bracket (  PHONE  ) shape, draw the connecting ropes!
        .add(() => {
          drawWires(null);
        }, "+=0.2");
      }

      new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runBeyondKeyboardSequence();
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 }).observe(btkSection);


      // =========================================================
      // 8. BEYOND THE KEYBOARD INTERACTIVE WIRE & TOOLTIP LOGIC
      // =========================================================
      const btkCapabilities = {
        rewrite: { title: "Help Me Rewrite", badge: "CORE CAPABILITY", tagline: "Transform your drafts into polished messages.", desc: "Allows users to select an existing draft and transform it into a clearer, more professional, or context-appropriate message.", demo: { contact: "Draft Assistant", status: "refining draft", avatar: "✍️", incoming: "Selected Draft: 'hey need slides quick for tomorrow'", outgoing: "✦ Help Me Rewrite: 'Hi team, could you please share the finalized presentation slides when ready? Thank you!'", badge: "✦ Help Me Rewrite" } },
        context: { title: "Live Context Detection (LCD)", badge: "CORE CAPABILITY", tagline: "Adapts to where you are writing.", desc: "Detects the current app or writing context, such as WhatsApp, Gmail, or LinkedIn, to adapt writing suggestions, autocorrect, and Thought Completion.", demo: { contact: "Dev Team Sprint", status: "online", avatar: "💻", incoming: "Where are we on dynamic SVG wire recalculations?", outgoing: "The SVG curves recalculate dynamically on resize and key animations are locked at 60fps. Ready for PR.", badge: "✦ Live Context (LCD)" } },
        memory: { title: "Personal AI Memory", badge: "CORE CAPABILITY", tagline: "Let TM Spark remember what matters.", desc: "Save preferences like your writing style, tone, or common choices, so future suggestions feel more personal.", demo: { contact: "Personal Knowledge Base", status: "synced", avatar: "🧠", incoming: "Insert bio for College Placement Portfolio:", outgoing: "Frontend Engineer specializing in on-device AI UI, real-time keyboard interaction layers, and multimodal responsive systems.", badge: "✦ Personal AI Memory" } },
        completion: { title: "Thought Completion", badge: "CORE CAPABILITY", tagline: "Complete unfinished thoughts naturally.", desc: "Helps users complete unfinished thoughts naturally while typing, preserving their intended meaning.", demo: { contact: "Writing Flow", status: "typing active", avatar: "💡", incoming: "Unfinished Draft: 'Regarding our launch schedule, we should probably...'", outgoing: "✦ Thought Completion: '...ensure cross-app testing is complete before rolling out to beta users.'", badge: "✦ Thought Completion" } },
        studio: { title: "Personal AI Studio", badge: "CORE CAPABILITY", tagline: "Create without leaving your keyboard.", desc: "Use AI tools to create things like custom emojis, GIFs, images, or other content directly from your writing workflow.", demo: { contact: "Spark Studio Agent", status: "active runtime", avatar: "⚡", incoming: "/explain-tech vram bottlenecks in 2 lines", outgoing: "⚡ [Tech Explainer Mode]: VRAM saturation forces texture paging into system RAM, triggering latency spikes.", badge: "✦ Personal AI Studio" } },
        actions: { title: "Cross-App AI Actions", badge: "CORE CAPABILITY", tagline: "Turn your words into actions.", desc: "Ask TM Spark to help with tasks like creating reminders, opening locations, or working with supported apps — with confirmation when needed.", demo: { contact: "Project Sync", status: "online", avatar: "🔄", incoming: "Let's schedule a mock placement interview this Friday at 4 PM.", outgoing: "✦ Spark Action: Added 'Placement Mock Interview' to Google Calendar for Friday @ 4:00 PM. Event confirmed.", badge: "✦ Cross-App AI Actions" } },
        clone: { title: "Clone Agent", badge: "EXPERIMENTAL", tagline: "Create an AI that writes more like you.", desc: "Clone Agent is designed to learn your preferences, communication style, and writing flow to create a personalized AI experience.", isExp: true, demo: { contact: "Placement Alumni Group", status: "online", avatar: "🤖", incoming: "Who can attend the early morning industry keynote on Saturday?", outgoing: "[Clone Agent Sim]: I will be attending the session remotely from 9:00 AM. Please count me in.", badge: "✦ Clone Agent (Sim)" } },
        whatsapp: { title: "WhatsApp", badge: "DESIGNED FOR", tagline: "Write better without leaving the conversation.", desc: "Rewrite messages, change your tone, get smart replies, or express what you're trying to say more clearly.", demo: { contact: "Team Chat", status: "online", avatar: "💬", incoming: "Can you send over the latest status update for the deployment?", outgoing: "The build is packaged and passing all sandbox integration checks. Deploying to production in 15 minutes.", badge: "✦ Designed for WhatsApp" } },
        gmail: { title: "Gmail", badge: "DESIGNED FOR", tagline: "From rough thought to polished email.", desc: "Compose, rewrite, shorten, or adjust the tone of your emails while keeping your original intent.", demo: { contact: "Campus Placement Cell", status: "inbox", avatar: "✉️", incoming: "Please submit your preferred interview time slots.", outgoing: "Respected Sir, I am available on Thursday and Friday afternoon between 2:00 PM and 6:00 PM. Thank you.", badge: "✦ Designed for Gmail" } },
        linkedin: { title: "LinkedIn", badge: "DESIGNED FOR", tagline: "Sound professional without sounding robotic.", desc: "Turn simple thoughts into polished messages, replies, posts, or professional conversations.", demo: { contact: "Talent Partner", status: "messaging", avatar: "💼", incoming: "Loved your interactive keyboard prototype! Are you open to frontend engineering roles?", outgoing: "Thank you for reaching out! I'm actively exploring frontend and AI engineering roles. I would love to connect.", badge: "✦ Designed for LinkedIn" } },
        calendar: { title: "Calendar", badge: "DESIGNED FOR", tagline: "Turn a request into a reminder or event.", desc: "Use natural language to describe what you want, then let TM Spark help turn it into a calendar action.", demo: { contact: "Quick Event Creator", status: "events hook", avatar: "📅", incoming: "coffee with dev team next wednesday at 10 am", outgoing: "✦ Calendar Draft: 'Dev Team Sync' · Next Wednesday, 10:00 AM - 10:30 AM · Main Lab.", badge: "✦ Designed for Calendar" } },
        notes: { title: "Notes", badge: "DESIGNED FOR", tagline: "Capture thoughts the way you think them.", desc: "Write freely, then use TM Spark to organize, summarize, rewrite, or turn rough notes into something clearer.", demo: { contact: "Architecture Scratchpad", status: "markdown active", avatar: "📝", incoming: "gpu cache ram paging latency spike explain", outgoing: "# Architecture Notes\n• VRAM saturation triggers host RAM paging.\n• Bus latency causes frame degradation.", badge: "✦ Designed for Notes" } },
        browser: { title: "Browser", badge: "DESIGNED FOR", tagline: "Get help while you're browsing.", desc: "Use TM Spark to rewrite, summarize, explain, or work with text without constantly switching between apps.", demo: { contact: "Web Input Query", status: "active field", avatar: "🌐", incoming: "How does factory reset destroy encryption keys?", outgoing: "Factory resets overwrite the encrypted Master Key in hardware-backed keystore, rendering remaining block data unrecoverable.", badge: "✦ Designed for Browser" } },
        more: { title: "More Apps", badge: "WORKS ACROSS SUPPORTED APPS", tagline: "The keyboard goes where you type.", desc: "TM Spark is designed to work across supported apps and text fields, bringing its writing intelligence wherever you need it.", demo: { contact: "Universal Input Field", status: "keyboard ready", avatar: "📱", incoming: "spark status check", outgoing: "TM Spark System Engine: 100% Operational · Memory Cache Active · Input Latency: <15ms.", badge: "✦ Works Across Supported Apps" } }
      };

      const bubble = document.getElementById('speech-bubble');
      const bubbleTitle = document.getElementById('bubble-title');
      const bubbleBadge = document.getElementById('bubble-badge');
      const bubbleTagline = document.getElementById('bubble-tagline');
      const bubbleDesc = document.getElementById('bubble-desc');
      const bubbleExp = document.getElementById('bubble-experimental');
      const phoneLeftAnchor = document.getElementById('phone-left-anchor');
      const phoneRightAnchor = document.getElementById('phone-right-anchor');
      const chatContact = document.getElementById('chat-contact-name');
      const chatStatus = document.getElementById('chat-status');
      const chatAvatar = document.getElementById('chat-avatar');
      const chatIncoming = document.getElementById('chat-incoming-text');
      const chatOutgoing = document.getElementById('chat-outgoing-text');
      const activeFeatureTag = document.getElementById('active-feature-tag');

      function drawWires(highlightId = null) {
        if (!wiresCanvas || window.innerWidth < 1024) {
          if (wiresCanvas) wiresCanvas.innerHTML = '';
          return;
        }
        const svgRect = wiresCanvas.getBoundingClientRect();
        const pLeftRect = phoneLeftAnchor.getBoundingClientRect();
        const pRightRect = phoneRightAnchor.getBoundingClientRect();

        const phoneLX = pLeftRect.left + pLeftRect.width / 2 - svgRect.left;
        const phoneLY = pLeftRect.top + pLeftRect.height / 2 - svgRect.top;
        const phoneRX = pRightRect.left + pRightRect.width / 2 - svgRect.left;
        const phoneRY = pRightRect.top + pRightRect.height / 2 - svgRect.top;

        let paths = '';
        document.querySelectorAll('#btk-composition-grid .pill-card').forEach(pill => {
          const id = pill.dataset.id;
          const side = pill.dataset.side;
          const rect = pill.getBoundingClientRect();
          const isGlow = highlightId === id;

          if (side === 'left') {
            const startX = rect.right - svgRect.left;
            const startY = rect.top + rect.height / 2 - svgRect.top;
            const deltaX = phoneLX - startX;
            const cp1X = startX + deltaX * 0.42;
            const cp1Y = startY;
            const cp2X = startX + deltaX * 0.68;
            const cp2Y = phoneLY;
            paths += `<path d="M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${phoneLX} ${phoneLY}" class="wire-base ${isGlow ? 'wire-glow' : ''}" />`;
          } else {
            const endX = rect.left - svgRect.left;
            const endY = rect.top + rect.height / 2 - svgRect.top;
            const deltaX = endX - phoneRX;
            const cp1X = phoneRX + deltaX * 0.32;
            const cp1Y = phoneRY;
            const cp2X = phoneRX + deltaX * 0.58;
            const cp2Y = endY;
            paths += `<path d="M ${phoneRX} ${phoneRY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}" class="wire-base ${isGlow ? 'wire-glow' : ''}" />`;
          }
        });
        wiresCanvas.innerHTML = paths;
      }

      function selectBtkFeature(id) {
        document.querySelectorAll('#btk-composition-grid .pill-card').forEach(p => {
          p.classList.toggle('active-pill', p.dataset.id === id);
        });
        const data = btkCapabilities[id];
        if (data && data.demo) {
          if (chatContact) chatContact.textContent = data.demo.contact;
          if (chatStatus) chatStatus.textContent = data.demo.status;
          if (chatAvatar) chatAvatar.textContent = data.demo.avatar;
          if (chatIncoming) chatIncoming.textContent = data.demo.incoming;
          if (chatOutgoing) chatOutgoing.textContent = data.demo.outgoing;
          if (activeFeatureTag) activeFeatureTag.textContent = data.demo.badge;
          if (chatOutgoing && chatOutgoing.parentElement) {
            chatOutgoing.parentElement.classList.add('ring-2', 'ring-cyan-400');
            setTimeout(() => chatOutgoing.parentElement.classList.remove('ring-2', 'ring-cyan-400'), 350);
          }
        }
      }

      document.querySelectorAll('#btk-composition-grid .pill-card').forEach(pill => {
        const id = pill.dataset.id;
        const side = pill.dataset.side;
        const data = btkCapabilities[id];
        if (!data) return;

        pill.addEventListener('mouseenter', () => {
          drawWires(id);
          if (bubbleTitle) bubbleTitle.textContent = data.title;
          if (bubbleBadge) bubbleBadge.textContent = data.badge;
          if (bubbleTagline) bubbleTagline.textContent = data.tagline;
          if (bubbleDesc) bubbleDesc.textContent = data.desc;
          if (data.isExp && bubbleExp) {
            bubbleExp.classList.remove('hidden');
          } else if (bubbleExp) {
            bubbleExp.classList.add('hidden');
          }
          const rect = pill.getBoundingClientRect();
          let top = rect.top - 12;
          let left = side === 'left' ? rect.right + 18 : rect.left - bubble.offsetWidth - 18;
          bubble.style.top = `${top}px`;
          bubble.style.left = `${left}px`;
          bubble.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
          bubble.classList.add('opacity-100', 'scale-100');
        });

        pill.addEventListener('mouseleave', () => {
          drawWires(null);
          bubble.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
          bubble.classList.remove('opacity-100', 'scale-100');
        });

        pill.addEventListener('click', () => {
          selectBtkFeature(id);
        });
      });

      window.addEventListener('resize', () => drawWires(null));


      // =========================================================
      // 9. MEMBERSHIP PREVIEW & ENGINE SELECTION LOGIC
      // =========================================================
      const engineAuraBtn = document.getElementById('engine-select-aura');
      const enginePrismBtn = document.getElementById('engine-select-prism');

      // Functional Engine Selector (Highlights planned engine associations)
      if (engineAuraBtn && enginePrismBtn) {
        engineAuraBtn.addEventListener('click', () => {
          engineAuraBtn.className = 'p-6 rounded-2xl bg-cyan-50/80 border-2 border-cyan-500 transition-all text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-md';
          enginePrismBtn.className = 'p-6 rounded-2xl bg-white border border-purple-300 hover:border-purple-500 transition-all text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-md';
          document.querySelectorAll('#pricing-grid [data-plan="free"], #pricing-grid [data-plan="plus"]').forEach(card => {
            card.classList.add('ring-2', 'ring-cyan-400');
            setTimeout(() => card.classList.remove('ring-2', 'ring-cyan-400'), 500);
          });
        });

        enginePrismBtn.addEventListener('click', () => {
          enginePrismBtn.className = 'p-6 rounded-2xl bg-purple-50/80 border-2 border-purple-500 transition-all text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-md';
          engineAuraBtn.className = 'p-6 rounded-2xl bg-white border border-cyan-300 hover:border-cyan-500 transition-all text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-md';
          document.querySelectorAll('#pricing-grid [data-plan="pro"], #pricing-grid [data-plan="ultra"]').forEach(card => {
            card.classList.add('ring-2', 'ring-purple-400');
            setTimeout(() => card.classList.remove('ring-2', 'ring-purple-400'), 500);
          });
        });
      }


      // =========================================================
      // 10. PRIVACY ANIMATION SEQUENCE
      // =========================================================
      let isPrivacyPlaying = false;
      let hasPrivacyPlayedOnce = false;

      function typeString(element, text, speed, callback) {
        element.textContent = "";
        let i = 0;
        function typeChar() {
          if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typeChar, speed);
          } else if (callback) {
            callback();
          }
        }
        typeChar();
      }

      function runPrivacySequence() {
        if (isPrivacyPlaying) return;
        isPrivacyPlaying = true;

        const qTitle = document.getElementById('priv-title-question');
        const point1 = document.getElementById('priv-point-1');
        const type1 = document.getElementById('type-target-1');
        const privCursor1 = document.getElementById('priv-typing-cursor-1');
        const sub1 = document.getElementById('sub-target-1');
        const point2 = document.getElementById('priv-point-2');
        const point3 = document.getElementById('priv-point-3');
        const settingItems = point3.querySelectorAll('.setting-item');
        const logoLock = document.getElementById('priv-logo-lock');
        const medallionBox = document.getElementById('apple-medallion-box');
        const stageLogo = document.getElementById('stage-logo-wrap');
        const stageLock = document.getElementById('stage-lock-wrap');
        const shackle = document.getElementById('lock-shackle');
        const lockBody = document.getElementById('lock-body');
        const lockKeyhole = document.getElementById('lock-keyhole');
        const lockStem = document.getElementById('lock-stem');
        const unlockText = document.getElementById('apple-unlock-text');
        const finalCard = document.getElementById('priv-final-card');
        const pillars = finalCard.querySelectorAll('.security-pillar');

        gsap.set([qTitle, point1, point2, point3, logoLock, finalCard, unlockText], { opacity: 0, pointerEvents: "none" });
        gsap.set(finalCard, { y: 40 });
        gsap.set(medallionBox, { scale: 0.75, opacity: 0, y: 0 });
        gsap.set(stageLogo, { opacity: 1, rotateY: 0 });
        gsap.set(stageLock, { opacity: 0, rotateY: -90 });
        gsap.set(shackle, { y: -16, stroke: "#64748b" });
        gsap.set(lockBody, { fill: "#0f172a", stroke: "#64748b" });
        gsap.set([lockKeyhole, lockStem], { fill: "#38bdf8", stroke: "#38bdf8" });
        settingItems.forEach(item => {
          item.style.opacity = "0.4";
          item.querySelector('.check-icon').className = "fa-regular fa-square text-lg check-icon";
        });
        sub1.style.opacity = 0;
        sub1.style.transform = "translateY(16px)";
        type1.textContent = "";
        if (privCursor1) {
          privCursor1.classList.remove('cursor-done');
          privCursor1.style.opacity = "1";
        }

        const tl = gsap.timeline({
          onComplete: () => {
            isPrivacyPlaying = false;
            finalCard.style.pointerEvents = "auto";
          }
        });

        tl.to(qTitle, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.2)" })
          .to(qTitle, { opacity: 0, scale: 0.85, filter: "blur(10px)", duration: 0.45, delay: 0.8, ease: "power2.in" });

        tl.call(() => {
          gsap.to(point1, { opacity: 1, duration: 0.3 });
          typeString(type1, "1. Sensitive fields will be excluded", 26, () => {
            if (privCursor1) privCursor1.classList.add('cursor-done');
            gsap.to(sub1, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.5)" });
          });
        }, null, "+=0.2");

        tl.to(point1, { opacity: 0, scale: 0.88, filter: "blur(12px)", y: -30, duration: 0.55, ease: "power3.inOut" }, "+=2.0")
          .fromTo(point2, { opacity: 0, scale: 0.88, filter: "blur(12px)", y: 30 }, { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 0.6, ease: "back.out(1.3)" }, "-=0.2")
          .to(point2, { opacity: 0, scale: 0.88, filter: "blur(12px)", y: -30, duration: 0.55, ease: "power3.inOut" }, "+=1.8")
          .fromTo(point3, { opacity: 0, scale: 0.88, filter: "blur(12px)", y: 30 }, { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 0.6, ease: "back.out(1.3)" }, "-=0.2");

        settingItems.forEach((item, index) => {
          tl.to(item, {
            opacity: 1, duration: 0.25, ease: "power1.out",
            onStart: () => {
              const icon = item.querySelector('.check-icon');
              icon.className = "fa-solid fa-square-check text-lg check-icon text-emerald-500";
            }
          }, `+=0.${index === 0 ? '3' : '15'}`);
        });

        tl.to(point3, { opacity: 0, scale: 0.88, filter: "blur(12px)", y: -30, duration: 0.55, ease: "power3.inOut" }, "+=1.0")
          .to(logoLock, { opacity: 1, duration: 0.2 }, "-=0.2")
          .to(medallionBox, { opacity: 1, scale: 1, duration: 0.75, ease: "power3.out" }, "-=0.2")
          .to(medallionBox, { scale: 0.9, duration: 0.35, ease: "power2.in" }, "+=0.2")
          .to(stageLogo, { rotateY: 90, opacity: 0, duration: 0.35, ease: "power2.in" }, "-=0.35")
          .to(stageLock, { rotateY: 0, opacity: 1, duration: 0.35, ease: "power2.out" })
          .to(shackle, { y: 0, duration: 0.45, ease: "back.out(3)" })
          .to(lockBody, { fill: "#064e3b", stroke: "#10b981", duration: 0.3 }, "-=0.3")
          .to(shackle, { stroke: "#10b981", duration: 0.3 }, "-=0.3")
          .to([lockKeyhole, lockStem], { fill: "#10b981", stroke: "#10b981", duration: 0.3 }, "-=0.3")
          .to(unlockText, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.5)" }, "-=0.2")
          .to([medallionBox, unlockText], { y: -30, scale: 0.85, opacity: 0, filter: "blur(12px)", duration: 0.6, delay: 0.7, ease: "power3.in" })
          .to(logoLock, { opacity: 0, duration: 0.1 })
          .to(finalCard, { opacity: 1, y: 0, duration: 0.75, ease: "power4.out" }, "-=0.25")
          .fromTo(pillars, { opacity: 0, y: 35, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.15, ease: "back.out(1.2)" }, "-=0.4");
      }

      new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasPrivacyPlayedOnce) {
            hasPrivacyPlayedOnce = true;
            runPrivacySequence();
          }
        });
      }, { threshold: 0.35 }).observe(document.getElementById('privacy'));

      const replayPrivacyBtn = document.getElementById('replay-privacy-btn');
      if (replayPrivacyBtn) replayPrivacyBtn.addEventListener('click', runPrivacySequence);


      // =========================================================
      // 10B. 3D FLIPPING WAITLIST BUTTON & COUNT-UP CONTROLLER
      // =========================================================
      const WAITLIST_REGISTRATION_COUNT = 5;
      window.WAITLIST_REGISTRATION_COUNT = WAITLIST_REGISTRATION_COUNT;

      function initWaitlist3DFlip() {
        const flipCard = document.getElementById('waitlist-flip-card');
        const counterEl = document.getElementById('waitlist-counter-number');
        const frontBtn = document.getElementById('download-trigger-btn');
        const backBtn = document.getElementById('waitlist-reverse-btn');

        if (!flipCard || !counterEl) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
          counterEl.textContent = WAITLIST_REGISTRATION_COUNT.toLocaleString();
          return;
        }

        let isFlipped = false;
        let isModalOpen = false;
        let cycleTimer = null;
        let countTween = null;
        const countObj = { val: 0 };

        function animateCounter() {
          countObj.val = 0;
          counterEl.textContent = '0';
          if (countTween) countTween.kill();

          countTween = gsap.to(countObj, {
            val: WAITLIST_REGISTRATION_COUNT,
            duration: 1.25,
            ease: "power2.out",
            onUpdate: () => {
              counterEl.textContent = Math.round(countObj.val).toLocaleString();
            }
          });
        }

        function flipToBack() {
          if (isModalOpen) return;
          isFlipped = true;

          gsap.to(flipCard, {
            rotationY: 180,
            duration: 0.95,
            ease: "power2.inOut",
            onStart: () => {
              if (backBtn) backBtn.style.pointerEvents = 'auto';
            },
            onComplete: () => {
              if (frontBtn) {
                frontBtn.style.pointerEvents = 'none';
                frontBtn.tabIndex = -1;
              }
              if (backBtn) backBtn.tabIndex = 0;

              if (isModalOpen) return;

              // Animate count-up after reverse face becomes visible
              animateCounter();

              // Remain on reverse face for ~3s after count completes (1.25s + 3.0s = 4.25s)
              cycleTimer = setTimeout(flipToFront, 4250);
            }
          });
        }

        function flipToFront() {
          if (isModalOpen) return;
          isFlipped = false;

          gsap.to(flipCard, {
            rotationY: 0,
            duration: 0.95,
            ease: "power2.inOut",
            onStart: () => {
              if (frontBtn) frontBtn.style.pointerEvents = 'auto';
            },
            onComplete: () => {
              if (backBtn) {
                backBtn.style.pointerEvents = 'none';
                backBtn.tabIndex = -1;
              }
              if (frontBtn) frontBtn.tabIndex = 0;

              // Reset counter display for next reveal
              countObj.val = 0;
              counterEl.textContent = '0';

              if (isModalOpen) return;

              // Keep front face visible for 4 seconds before flipping again
              cycleTimer = setTimeout(flipToBack, 4000);
            }
          });
        }

        // Start cycle: 4 seconds on front face
        cycleTimer = setTimeout(flipToBack, 4000);

        // Suspend flip when registration modal is open; resume on close
        window.setWaitlistModalActiveState = function(isOpen) {
          isModalOpen = isOpen;
          if (isOpen) {
            if (cycleTimer) clearTimeout(cycleTimer);
            if (countTween) countTween.pause();
          } else {
            if (isFlipped) {
              cycleTimer = setTimeout(flipToFront, 2500);
            } else {
              cycleTimer = setTimeout(flipToBack, 3500);
            }
          }
        };
      }
      initWaitlist3DFlip();


      // =========================================================
// =========================================================
// 11. WAITLIST MODAL & DIRECT EMAIL SUBMISSION
// =========================================================
const waitlistModal = document.getElementById('waitlist-modal');
const closeWaitlistBtn = document.getElementById('close-waitlist-modal');
const waitlistPlanTag = document.getElementById('waitlist-plan-tag');
const waitlistForm = document.getElementById('waitlist-form');
const waitlistSuccess = document.getElementById('waitlist-success');
const waitlistTierInput = document.getElementById('waitlist-tier-input');
const waitlistSubmitBtn = document.getElementById('waitlist-submit-btn');
const waitlistError = document.getElementById('waitlist-error');

const WEB3FORMS_ACCESS_KEY = "52fee982-1561-47fe-bb14-2725b4e386ca";

window.triggerWaitlistFlow = function(planName, actionName) {
  if (window.setWaitlistModalActiveState) window.setWaitlistModalActiveState(true);
  if (!waitlistModal) return;
  if (waitlistPlanTag) waitlistPlanTag.textContent = `${planName} Tier — ${actionName}`;
  if (waitlistTierInput) waitlistTierInput.value = `${planName} (${actionName})`;
  if (waitlistError) waitlistError.classList.add('hidden');

  if (waitlistForm) {
    waitlistForm.classList.remove('hidden');
    waitlistForm.reset();
  }
  if (waitlistSuccess) waitlistSuccess.classList.add('hidden');

  waitlistModal.classList.add('is-active');
  if (typeof lenis !== 'undefined') lenis.stop();
  const input = document.getElementById('waitlist-email');
  if (input) setTimeout(() => input.focus(), 200);
};

function closeWaitlistModal() {
  if (window.setWaitlistModalActiveState) window.setWaitlistModalActiveState(false);
  if (!waitlistModal) return;
  waitlistModal.classList.remove('is-active');
  if (typeof lenis !== 'undefined') lenis.start();
}

if (closeWaitlistBtn) closeWaitlistBtn.addEventListener('click', closeWaitlistModal);
if (waitlistModal) {
  waitlistModal.addEventListener('click', (e) => {
    if (e.target === waitlistModal) closeWaitlistModal();
  });
}

window.handleWaitlistSubmit = async function(e) {
  e.preventDefault();
  
  const emailInput = document.getElementById('waitlist-email');
  const platformInput = document.getElementById('waitlist-device');
  const tierValue = waitlistTierInput ? waitlistTierInput.value : 'General Early Access';

  if (!emailInput || !emailInput.value.trim()) return;

  if (waitlistSubmitBtn) {
    waitlistSubmitBtn.disabled = true;
    waitlistSubmitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Registering...</span>';
  }
  if (waitlistError) waitlistError.classList.add('hidden');

  try {
    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      email: emailInput.value.trim(),
      platform: platformInput ? platformInput.value : 'Not specified',
      plan_tier: tierValue,
      from_name: "TypeMind Spark Waitlist",
      subject: `New Early Access Request: ${emailInput.value.trim()}`
    };

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      waitlistForm.classList.add('hidden');
      waitlistSuccess.classList.remove('hidden');
      setTimeout(() => {
        closeWaitlistModal();
      }, 2600);
    } else {
      throw new Error(result.message || "Failed to submit. Please try again.");
    }
  } catch (err) {
    if (waitlistError) {
      waitlistError.textContent = err.message || "Something went wrong. Please try again.";
      waitlistError.classList.remove('hidden');
    }
  } finally {
    if (waitlistSubmitBtn) {
      waitlistSubmitBtn.disabled = false;
      waitlistSubmitBtn.innerHTML = '<span>Submit Waitlist Registration</span>';
    }
  }
};

      // =========================================================
      // 12. LEGAL MODAL LOGIC (PRIVACY POLICY & TERMS)
      // =========================================================
      const legalModal = document.getElementById('legal-modal');
      const legalTitle = document.getElementById('legal-title');
      const privacyContent = document.getElementById('privacy-content');
      const termsContent = document.getElementById('terms-content');
      const tabPrivBtn = document.getElementById('legal-tab-privacy');
      const tabTermsBtn = document.getElementById('legal-tab-terms');

      window.openLegalModal = function(type) {
        if (!legalModal) return;
        if (type === 'privacy') {
          if (legalTitle) legalTitle.textContent = 'Privacy Policy';
          if (privacyContent) privacyContent.classList.remove('hidden');
          if (termsContent) termsContent.classList.add('hidden');
          if (tabPrivBtn) tabPrivBtn.className = 'px-3 py-1 rounded-full text-white bg-cyan-500 font-bold';
          if (tabTermsBtn) tabTermsBtn.className = 'px-3 py-1 rounded-full text-slate-600 hover:text-slate-900';
        } else {
          if (legalTitle) legalTitle.textContent = 'Terms & Conditions';
          if (privacyContent) privacyContent.classList.add('hidden');
          if (termsContent) termsContent.classList.remove('hidden');
          if (tabTermsBtn) tabTermsBtn.className = 'px-3 py-1 rounded-full text-white bg-cyan-500 font-bold';
          if (tabPrivBtn) tabPrivBtn.className = 'px-3 py-1 rounded-full text-slate-600 hover:text-slate-900';
        }
        legalModal.classList.add('is-active');
        if (typeof lenis !== 'undefined') lenis.stop();
      };

      window.closeLegalModal = function() {
        if (!legalModal) return;
        legalModal.classList.remove('is-active');
        if (typeof lenis !== 'undefined') lenis.start();
      };

      if (legalModal) {
        legalModal.addEventListener('click', (e) => {
          if (e.target === legalModal) closeLegalModal();
        });
      }

      // =========================================================
      // 12B. LABS SPARK ECOSYSTEM STATUS MODAL
      // =========================================================
      const labsEcosystemModal = document.getElementById('labs-ecosystem-modal');
      const labsItemBadge = document.getElementById('labs-modal-item-badge');

      window.openLabsEcosystemModal = function(itemName) {
        if (!labsEcosystemModal) return;
        if (labsItemBadge && itemName) {
          labsItemBadge.textContent = `${itemName} — In Development`;
        }
        labsEcosystemModal.classList.add('is-active');
        if (typeof lenis !== 'undefined') lenis.stop();
      };

      window.closeLabsEcosystemModal = function() {
        if (!labsEcosystemModal) return;
        labsEcosystemModal.classList.remove('is-active');
        if (typeof lenis !== 'undefined') lenis.start();
      };

      if (labsEcosystemModal) {
        labsEcosystemModal.addEventListener('click', (e) => {
          if (e.target === labsEcosystemModal) closeLabsEcosystemModal();
        });
      }

      // Escape key listener for all open dialogs
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeTestFeatureModal();
          closeWaitlistModal();
          closeLegalModal();
          closeLabsEcosystemModal();
        }
      });


      // =========================================================
      // 13. GENERAL SPOTLIGHT CURSOR TRACKING & REVEAL OBSERVER
      // =========================================================
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal-node').forEach(node => revealObserver.observe(node));

      let isMouseMoving = false;
      document.addEventListener('mousemove', (e) => {
        if (!isMouseMoving) {
          window.requestAnimationFrame(() => {
            document.querySelectorAll('.spotlight-card').forEach(card => {
              const rect = card.getBoundingClientRect();
              card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
              card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            });
            isMouseMoving = false;
          });
          isMouseMoving = true;
        }
      }, { passive: true });

      // =========================================================
      // 14. CAPABILITY ANIMATION VIEWPORTS (RESPONSIVE CAMERA FRAMING)
      // =========================================================
      function initCapabilityViewports() {
        const viewports = document.querySelectorAll('.capability-animation-viewport');
        if (!viewports.length) return;

        function updateViewport(vp) {
          const iframe = vp.querySelector('.capability-animation-iframe');
          if (!iframe) return;

          const Wc = vp.clientWidth;
          const Hc = vp.clientHeight;
          if (!Wc || !Hc) return;

          const cx = parseFloat(vp.dataset.cropCenterX || '960');
          const cy = parseFloat(vp.dataset.cropCenterY || '540');
          const cw = parseFloat(vp.dataset.cropWidth || '840');
          const ch = parseFloat(vp.dataset.cropHeight || '720');

          const scale = Math.min(Wc / cw, Hc / ch);
          const tx = (Wc / 2) - (cx * scale);
          const ty = (Hc / 2) - (cy * scale);

          iframe.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${scale.toFixed(4)})`;
        }

        function updateAll() {
          viewports.forEach(updateViewport);
        }

        if (window.ResizeObserver) {
          const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
              updateViewport(entry.target);
            }
          });
          viewports.forEach(vp => ro.observe(vp));
        }

        window.addEventListener('resize', updateAll, { passive: true });
        updateAll();
        requestAnimationFrame(updateAll);
      }
      initCapabilityViewports();
    });
