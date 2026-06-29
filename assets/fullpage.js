/* fullpage.js — Concept II (Horizon) carried end-to-end:
   dark sticky hero → white body slides up (light floods) → dark close → wordmark. */
(function () {
  window.SIRIAI = window.SIRIAI || {};

  window.SIRIAI.buildFullPage = function (host) {
    host.innerHTML = `
      <div class="fp-scroll" id="fpScroll">

        <!-- ===== HERO (dark, sticky) ===== -->
        <section class="fp-hero" data-screen-label="Full · Hero">
          <div class="hz-scene">
            <div class="hz-sky"></div>
            <div class="hz-stars"></div>
            <div class="hz-glow"></div>
            <div class="hz-sun-wrap"><div class="hz-sun"></div></div>
            <div class="hz-line"></div>
          </div>
          <div class="hero-stack hz-stack">
            ${SIRIAI.heroForeground()}
          </div>
          <div class="vignette" style="background:radial-gradient(130% 120% at 50% 30%, transparent 38%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.94) 100%)"></div>
          <div class="scroll-hint"><span class="line"></span></div>
        </section>

        <!-- ===== WHITE BODY ===== -->
        <div class="fp-body">

          <!-- 01 STANCE -->
          <section class="fp-sec" data-screen-label="Full · 01 Stance">
            <div class="fp-wrap fp-stance">
              <div>
                <div class="fp-label fp-rise"><span class="num">01</span> — Stance</div>
                <div class="fp-stmt fp-rise">Tools change.<br>Structure remains.<br><em>We design it.</em></div>
              </div>
              <div class="fp-bullets">
                <div class="fp-bullet fp-rise"><span class="mk"></span><span>AI 도구는 매일 새롭게 등장합니다.</span></div>
                <div class="fp-bullet fp-rise"><span class="mk"></span><span>필요한 건 도구가 아니라 창의성과 결합된 구조.</span></div>
                <div class="fp-bullet fp-rise"><span class="mk"></span><span>시리아이는 그 구조를 설계합니다.</span></div>
              </div>
            </div>
          </section>

          <!-- 02 METHODOLOGY -->
          <section class="fp-sec" style="padding-top:0" data-screen-label="Full · 02 Methodology">
            <div class="fp-wrap">
              <div class="fp-label fp-rise"><span class="num">02</span> — Three ways in. One place to begin.</div>
              <div class="fp-methhead">
                <div class="h fp-rise">Three ways in.<br>One place to begin.</div>
                <div class="kr fp-rise">세 갈래로 들어가,<br>한 자리에서 시작합니다.</div>
              </div>
              <div class="fp-cards">
                <div class="fp-card fp-rise">
                  <div class="ix">01</div>
                  <h3>Architecture</h3>
                  <div class="en">아키텍처</div>
                  <p>의사결정의 구조를 설계합니다.</p>
                </div>
                <div class="fp-card fp-rise">
                  <div class="ix">02</div>
                  <h3>Literacy</h3>
                  <div class="en">리터러시</div>
                  <p>조직이 AI로 사고하는 법을 익힙니다.</p>
                </div>
                <div class="fp-card fp-rise">
                  <div class="ix">03</div>
                  <h3>Mapping</h3>
                  <div class="en">매핑</div>
                  <p>무엇이 진짜 문제인지 함께 그립니다.</p>
                </div>
              </div>
            </div>
          </section>

          <!-- 03 SYSTEM -->
          <section class="fp-sec" data-screen-label="Full · 03 System">
            <div class="fp-wrap">
              <div class="fp-syshead">
                <div class="fp-label fp-rise" style="margin-bottom:0"><span class="num">03</span> — Decision flow. Made visible.</div>
                <div class="fp-rise" style="font-family:var(--sans);font-size:14px;color:var(--ink-3)">판단의 흐름을, 보이게.</div>
              </div>
              <div class="fp-flow fp-rise">
                <span class="fp-step">Signal</span><span class="fp-arrow">→</span>
                <span class="fp-step">Judgment</span><span class="fp-arrow">→</span>
                <span class="fp-step">Action</span><span class="fp-arrow">→</span>
                <span class="fp-step">Record</span>
              </div>
            </div>
          </section>

          <!-- ===== DARK CLOSE ===== -->
          <div class="fp-dark">
            <div class="fp-dark-glow"></div>

            <!-- 05 VOICE -->
            <section class="fp-sec" data-screen-label="Full · 05 Voice">
              <div class="fp-wrap fp-voice">
                <div>
                  <div class="fp-label on-dark fp-rise"><span class="num">05</span> — Voice</div>
                  <div class="fp-stmt fp-rise">We don't recommend tools.<br>We architect <em>what stays.</em></div>
                  <div class="fp-manifesto fp-rise">AI 리터러시적 사고를 기반으로 한 최적의 설계. — Siriai Manifesto, 2026</div>
                </div>
                <div class="fp-stat fp-rise">
                  <div class="big">+32%</div>
                  <div class="cap">이상의 의사결정 비용<br>감소를 체험해보세요.</div>
                </div>
              </div>
            </section>

            <!-- 04 CLIENTS -->
            <section class="fp-sec" style="padding-top:0" data-screen-label="Full · 04 Clients">
              <div class="fp-wrap">
                <div class="fp-clienthead fp-rise">Brands we've sat with &nbsp;·&nbsp; <span>각자 다른 결, 같은 자세</span></div>
                <div class="fp-clients fp-rise" id="fpClients"></div>
              </div>
            </section>

            <!-- 06 CONTACT -->
            <section class="fp-sec" data-screen-label="Full · 06 Contact">
              <div class="fp-wrap fp-contact">
                <div>
                  <div class="lead fp-rise">Let's start<br>with <em>coffee.</em></div>
                  <div class="kr fp-rise">가벼운 커피챗으로, 해묵은 고민을 시원하게.</div>
                  <div class="mail fp-rise">contact@siriai.io</div>
                </div>
                <button class="fp-pill-dark fp-rise"><span class="dot"></span>바로 스케줄 예약하기</button>
              </div>
            </section>

            <!-- FOOTER -->
            <footer class="fp-foot">
              <div class="rule"></div>
              <div class="meta">
                <span>© 2024 — 2026 주식회사 시리아이 (SIRIAI)</span>
                <span>All Rights Reserved</span>
              </div>
              <div class="fp-wordmark">Siriai</div>
            </footer>
          </div>
        </div>
      </div>
    `;

    // grain on hero only
    SIRIAI.attachGrain(host.querySelector('.fp-hero'));

    // clients
    const brands = ['HYBE','CJ ENM','JYP','MUSINSA','COSRX','innisfree','moev','oddtype','8DIVISION','OpenAI','Anthropic','Gemini','Vercel','Supabase','Next.js'];
    host.querySelector('#fpClients').innerHTML =
      brands.map(b => `<span class="fp-client">${b}</span>`).join('');

    const scene = host.querySelector('.hz-scene');
    const line  = host.querySelector('.hz-line');
    const sunWrap = host.querySelector('.hz-sun-wrap');
    const stack = host.querySelector('.hz-stack');
    const msgs  = [];
    const scroller = host.querySelector('#fpScroll');
    const hero = host.querySelector('.fp-hero');

    let io = null, played = false, onScroll = null;

    function start() {
      if (!played) {
        played = true;
        if (SIRIAI.reducedMotion) {
          scene.classList.add('lit');
        } else {
          void host.offsetWidth;
          setTimeout(() => {
            line.classList.add('draw');
            setTimeout(() => scene.classList.add('lit'), 1300);
          }, 40);
        }
        SIRIAI.revealIn([...host.querySelectorAll('.fp-hero .hero-kicker, .fp-hero .hero-h, .fp-hero .hero-sub, .fp-hero .cta-row, .fp-hero .hero-card')], { delay: 1300, step: 150 });
      } else {
        scene.classList.add('lit');
      }

      // scroll-driven reveals
      if (!io) {
        io = new IntersectionObserver((entries) => {
          entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
        }, { root: scroller, threshold: 0.18 });
        host.querySelectorAll('.fp-rise').forEach(el => io.observe(el));
      }

      // scroll flood: brighten sun + lift hero copy as the body rises
      if (!SIRIAI.reducedMotion) {
        onScroll = function () {
          const p = Math.min(1, scroller.scrollTop / (window.innerHeight || 800));
          sunWrap.style.setProperty('scale', (1 + p * 0.9).toFixed(3));
          stack.style.opacity = (1 - p * 1.4).toFixed(3);
          stack.style.translate = `0 ${(-p * 60).toFixed(1)}px`;
        };
        scroller.addEventListener('scroll', onScroll, { passive: true });
      }
    }
    function stop() {
      if (onScroll) { scroller.removeEventListener('scroll', onScroll); onScroll = null; }
    }
    return { start, stop };
  };
})();
