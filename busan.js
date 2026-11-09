// THEMES · AREAS · PLACES 는 data.js 에서 불러와요

const POPULAR = [
  '감천문화마을', '이기대 해안산책로', '태종대', '국제시장', '용두산공원과 부산타워',
  '오륙도 스카이워크', '동백섬', '광안리 해변', '복천박물관·고분군',
];

const byName = Object.fromEntries(PLACES.map((p) => [p.name, p]));
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ───────── 테마 탭 ─────────
const tabs = document.getElementById('theme-tabs');
const grid = document.getElementById('theme-grid');

function renderTheme(key) {
  const list = PLACES.filter((p) => p.themes.includes(key));
  grid.innerHTML = list.map((p, i) => `
    <article class="card place ${i % 5 === 0 ? 'bg-sky' : i % 5 === 2 ? 'bg-lilac' : i % 5 === 4 ? 'bg-cream' : 'bg-white'}">
      <span class="tag">${esc(AREAS[p.area])}</span>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.desc)}</p>
    </article>`).join('');
  tabs.querySelectorAll('.chip').forEach((c) => {
    const on = c.dataset.theme === key;
    c.classList.toggle('is-on', on);
    c.setAttribute('aria-selected', String(on));
  });
}

tabs.innerHTML = Object.entries(THEMES)
  .map(([k, t]) => `<button class="chip" role="tab" data-theme="${k}">${t.label}</button>`).join('');
tabs.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (b) renderTheme(b.dataset.theme);
});
renderTheme('alley');

// ───────── 인기 장소 ─────────
document.getElementById('pop-list').innerHTML = POPULAR.map((n, i) => {
  const p = byName[n];
  return `<li><span class="rank">${String(i + 1).padStart(2, '0')}</span><div><b>${esc(p.name)}</b><span>${esc(AREAS[p.area])}</span></div></li>`;
}).join('');

// ───────── 날씨 (Open-Meteo, 키 불필요) ─────────
const WMO = {
  0: ['맑음', '☀️'], 1: ['대체로 맑음', '🌤️'], 2: ['구름 조금', '⛅'], 3: ['흐림', '☁️'],
  45: ['안개', '🌫️'], 48: ['안개', '🌫️'],
  51: ['이슬비', '🌦️'], 53: ['이슬비', '🌦️'], 55: ['이슬비', '🌦️'],
  61: ['비', '🌧️'], 63: ['비', '🌧️'], 65: ['강한 비', '🌧️'],
  71: ['눈', '🌨️'], 73: ['눈', '🌨️'], 75: ['많은 눈', '❄️'],
  80: ['소나기', '🌦️'], 81: ['소나기', '🌦️'], 82: ['강한 소나기', '⛈️'],
  95: ['뇌우', '⛈️'], 96: ['뇌우', '⛈️'], 99: ['뇌우', '⛈️'],
};

async function loadWeather() {
  const box = document.getElementById('weather');
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=35.1796&longitude=129.0756'
      + '&current=temperature_2m,weather_code,wind_speed_10m'
      + '&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul&forecast_days=1';
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    const [desc, icon] = WMO[d.current.weather_code] || ['-', '🌡️'];
    box.querySelector('.w-temp').textContent = `${icon} ${Math.round(d.current.temperature_2m)}°`;
    box.querySelector('.w-desc').textContent =
      `${desc} · 최고 ${Math.round(d.daily.temperature_2m_max[0])}° / 최저 ${Math.round(d.daily.temperature_2m_min[0])}° · 바람 ${Math.round(d.current.wind_speed_10m)}km/h`;
  } catch {
    box.querySelector('.w-desc').textContent = '날씨 정보를 불러오지 못했어요.';
  }
}
loadWeather();

// ───────── 코스 추천기 ─────────
const pForm = document.getElementById('planner-form');
const pThemes = document.getElementById('planner-themes');
const pResult = document.getElementById('plan-result');

pThemes.innerHTML = Object.entries(THEMES).map(([k, t], i) =>
  `<label><input type="checkbox" name="theme" value="${k}" ${i < 2 ? 'checked' : ''}> ${t.label}</label>`).join('');

const SLOT_LABEL = { am: '오전', pm: '오후', night: '저녁' };

function buildPlan(themes, days) {
  const score = (p) => p.themes.filter((t) => themes.includes(t)).length;
  const pool = PLACES.filter((p) => score(p) > 0);
  // 권역별로 묶어서, 맞는 장소가 많은 권역부터 하루씩 배정
  const byArea = {};
  pool.forEach((p) => (byArea[p.area] ||= []).push(p));
  const areas = Object.keys(byArea).sort((a, b) =>
    byArea[b].reduce((s, p) => s + score(p), 0) - byArea[a].reduce((s, p) => s + score(p), 0));

  const used = new Set();
  const plan = [];
  for (let d = 0; d < days; d++) {
    // 하루에 권역 1~2개 (가까운 동선 유지)
    const todayAreas = areas.filter((a) => byArea[a].some((p) => !used.has(p.name))).slice(0, 2);
    if (!todayAreas.length) break;
    const cand = todayAreas.flatMap((a) => byArea[a]).filter((p) => !used.has(p.name))
      .sort((a, b) => score(b) - score(a));
    const day = {};
    for (const slot of ['am', 'pm', 'night']) {
      const pick = cand.find((p) => p.slot === slot && !used.has(p.name))
        || cand.find((p) => !used.has(p.name));
      if (pick) { day[slot] = pick; used.add(pick.name); }
    }
    // 저녁이 비면 전체에서 야경/미식 장소로 채우기
    if (!day.night) {
      const eve = PLACES.find((p) => p.slot === 'night' && !used.has(p.name));
      if (eve) { day.night = eve; used.add(eve.name); }
    }
    plan.push({ areas: todayAreas, day });
    areas.push(areas.shift()); // 다음 날은 다른 권역부터
  }
  return plan;
}

pForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const themes = [...pForm.querySelectorAll('input[name="theme"]:checked')].map((i) => i.value);
  if (!themes.length) {
    pResult.innerHTML = '<p class="form-msg">테마를 하나 이상 골라 주세요.</p>';
    return;
  }
  const days = Number(pForm.days.value);
  const plan = buildPlan(themes, days);
  pResult.innerHTML = plan.map((d, i) => `
    <div class="day card bg-white">
      <div class="day-head"><b>DAY ${i + 1}</b><span>${d.areas.map((a) => esc(AREAS[a])).join(' → ')}</span></div>
      <ol>
        ${['am', 'pm', 'night'].filter((s) => d.day[s]).map((s) => `
          <li><span class="slot">${SLOT_LABEL[s]}</span><div><b>${esc(d.day[s].name)}</b><p>${esc(d.day[s].desc)}</p></div></li>`).join('')}
      </ol>
    </div>`).join('');
  pResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// ───────── 뉴스레터 (미리보기: 전송 안 함) ─────────
const nl = document.getElementById('nl-form');
nl.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = nl.querySelector('input');
  const msg = nl.querySelector('.form-msg');
  if (!input.checkValidity()) {
    msg.textContent = '이메일 주소를 확인해 주세요.';
    return;
  }
  msg.textContent = '구독 신청을 받았어요! (지금은 미리보기라 실제로 전송되지는 않아요)';
  nl.reset();
});
