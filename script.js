// 모바일 메뉴
const menuBtn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
menuBtn.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
menu.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
});

// 여행지 테마 필터
const chips = document.querySelectorAll('.chips[aria-label="테마로 거르기"] .chip');
const dests = document.querySelectorAll('.dest');
const empty = document.querySelector('.empty');
if (empty) chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.toggle('is-on', c === chip));
    const f = chip.dataset.filter;
    let shown = 0;
    dests.forEach((d) => {
      const match = f === 'all' || d.dataset.tags.split(' ').includes(f);
      d.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    empty.hidden = shown > 0;
  });
});

// 스크롤 등장 효과 + 숫자 카운트
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (n) => n.toLocaleString('ko-KR');

function countUp(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const start = performance.now();
  const dur = 1200;
  const tick = (t) => {
    const p = Math.min((t - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(target * eased)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if (!reduce && 'IntersectionObserver' in window) {
  // 첫 화면에 이미 보이는 요소는 그대로 두고, 아래쪽 요소만 스크롤 시 나타나게
  const fold = window.innerHeight;
  const targets = [...document.querySelectorAll('.card, .stat, .bar')]
    .filter((el) => el.getBoundingClientRect().top > fold);
  targets.forEach((el) => el.classList.add('reveal'));
  // 혹시 관찰이 동작하지 않는 환경에서도 내용이 숨겨진 채로 남지 않게
  setTimeout(() => targets.forEach((el) => el.classList.add('in')), 4000);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      const num = entry.target.querySelector?.('[data-count]');
      if (num) countUp(num);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  targets.forEach((el) => io.observe(el));
}

// 상담 폼 (아직 서버 연결 전: 입력 확인만 하고 안내 메시지 표시)
const form = document.getElementById('contact-form');
const msg = form?.querySelector('.form-msg');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach((input) => {
    const bad = !input.checkValidity();
    input.classList.toggle('is-bad', bad);
    if (bad) ok = false;
  });
  if (!ok) {
    msg.textContent = '가고 싶은 곳과 이메일을 확인해 주세요.';
    return;
  }
  const dest = form.dest.value.trim();
  msg.textContent = `${dest} 여행 요청을 받았어요! (지금은 미리보기라 실제로 전송되지는 않아요)`;
  form.reset();
});
