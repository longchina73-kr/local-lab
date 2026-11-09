// ───────── 부산 가이드맵 ─────────
const SLOT_TEXT = { am: '오전 추천', pm: '오후 추천', night: '저녁 추천' };
const escH = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const map = L.map('map', {
  zoomControl: false,
  scrollWheelZoom: false,     // 페이지 스크롤과 충돌 방지 (지도를 누르면 켜짐)
  tap: true,
}).setView([35.14, 129.06], 11);
L.control.zoom({ position: 'topright' }).addTo(map);
map.on('focus click', () => map.scrollWheelZoom.enable());
map.on('blur', () => map.scrollWheelZoom.disable());

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// ── 마커 ──
const byName = {};
const active = new Set(Object.keys(THEMES));
let selected = null;
let currentCourse = null;

PLACES.forEach((p, i) => {
  p.no = i + 1;
  const t = THEMES[p.themes[0]];
  const icon = L.divIcon({
    className: 'pin-wrap',
    html: `<span class="pin" style="--c:${t.pin}"><i aria-hidden="true">${t.icon}</i><b>${p.no}</b></span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 40],
  });
  p.marker = L.marker([p.lat, p.lng], { icon, title: `${p.no}. ${p.name}`, alt: p.name, riseOnHover: true })
    .addTo(map)
    .on('click', () => openPlace(p));
  byName[p.name] = p;
});

// 키보드로 핀을 열 수 있게 (Enter / Space)
map.getPane('markerPane').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const p = PLACES.find((x) => x.marker.getElement() === e.target);
  if (p) { e.preventDefault(); openPlace(p); }
});

// ── 설명창 ──
const card = document.getElementById('place-card');
const $ = (id) => document.getElementById(id);

function openPlace(p, { fly = true } = {}) {
  if (selected) selected.marker.getElement()?.classList.remove('is-selected');
  selected = p;
  p.marker.getElement()?.classList.add('is-selected');

  const t = THEMES[p.themes[0]];
  $('pc-num').textContent = p.no;
  $('pc-num').style.setProperty('--c', t.pin);
  $('pc-name').textContent = p.name;
  $('pc-area').textContent = AREAS[p.area];
  $('pc-tags').innerHTML = p.themes.map((k) =>
    `<span class="pc-tag" style="--c:${THEMES[k].pin}">${THEMES[k].icon} ${THEMES[k].label}</span>`).join('');
  $('pc-desc').textContent = p.desc;
  $('pc-meta').textContent = `🕒 ${SLOT_TEXT[p.slot]}`;
  const inCourses = COURSES.filter((c) => c.stops.includes(p.name));
  $('pc-courses').innerHTML = inCourses.length
    ? `<span>포함된 코스</span>` + inCourses.map((c) =>
        `<button type="button" data-course="${c.id}" style="--c:${c.color}">${escH(c.name)}</button>`).join('')
    : '';
  $('pc-link').href = `https://map.kakao.com/link/search/${encodeURIComponent(p.name.split(/[·과]/)[0].trim())}`;
  card.hidden = false;

  if (fly) {
    const z = Math.max(map.getZoom(), 14);
    // 설명창에 가리지 않도록 핀을 위쪽으로 조금 올려서 보여줌
    const pt = map.project([p.lat, p.lng], z).add([0, card.offsetHeight / 2]);
    map.flyTo(map.unproject(pt, z), z, { duration: 0.6 });
  }
}

function closePlace() {
  card.hidden = true;
  if (selected) selected.marker.getElement()?.classList.remove('is-selected');
  selected = null;
}
card.querySelector('.pc-close').addEventListener('click', closePlace);
map.on('click', closePlace);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePlace(); });
$('pc-courses').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-course]');
  if (b) showCourse(b.dataset.course);
});

// ── 범례 (테마 켜고 끄기) ──
const legend = $('legend');
legend.innerHTML = Object.entries(THEMES).map(([k, t]) => {
  const n = PLACES.filter((p) => p.themes.includes(k)).length;
  return `<li><button type="button" class="lg is-on" data-theme="${k}" aria-pressed="true" style="--c:${t.pin}">
    <span class="dot" aria-hidden="true">${t.icon}</span><b>${t.label}</b><small>${n}곳</small></button></li>`;
}).join('');

function applyFilter() {
  PLACES.forEach((p) => {
    const show = p.themes.some((k) => active.has(k));
    const onCourse = !currentCourse || currentCourse.stops.includes(p.name);
    const el = p.marker.getElement();
    if (!el) return;
    el.classList.toggle('is-off', !show);
    el.classList.toggle('is-dim', show && !onCourse);
  });
}
legend.addEventListener('click', (e) => {
  const b = e.target.closest('.lg');
  if (!b) return;
  const k = b.dataset.theme;
  if (active.has(k)) active.delete(k); else active.add(k);
  b.classList.toggle('is-on', active.has(k));
  b.setAttribute('aria-pressed', String(active.has(k)));
  applyFilter();
});

// ── 코스 ──
const courseLayer = L.layerGroup().addTo(map);
const list = $('course-list');
list.innerHTML = COURSES.map((c) => `
  <li>
    <button type="button" class="course" data-course="${c.id}" style="--c:${c.color}" aria-pressed="false">
      <span class="c-name">${escH(c.name)}</span>
      <span class="c-meta">${escH(c.dist)} · ${escH(c.time)}</span>
      <span class="c-desc">${escH(c.desc)}</span>
      <span class="c-stops">${c.stops.map((s) => `${byName[s].no}`).join(' → ')}</span>
    </button>
  </li>`).join('');

function showCourse(id) {
  const c = COURSES.find((x) => x.id === id);
  courseLayer.clearLayers();
  list.querySelectorAll('.course').forEach((b) => {
    const on = c && b.dataset.course === id;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  currentCourse = c || null;
  applyFilter();
  if (!c) return;
  const pts = c.stops.map((s) => [byName[s].lat, byName[s].lng]);
  L.polyline(pts, { color: '#ffffff', weight: 9, opacity: 0.9 }).addTo(courseLayer);
  L.polyline(pts, { color: c.color, weight: 5, dashArray: '2 10', lineCap: 'round' }).addTo(courseLayer);
  closePlace();
  map.flyToBounds(L.latLngBounds(pts).pad(0.35), { duration: 0.7, maxZoom: 15 });
  if (window.matchMedia('(max-width: 719px)').matches) {
    document.querySelector('.map-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
list.addEventListener('click', (e) => {
  const b = e.target.closest('.course');
  if (!b) return;
  showCourse(b.classList.contains('is-on') ? null : b.dataset.course);
});

// ── 전체 보기 ──
const allBounds = L.latLngBounds(PLACES.map((p) => [p.lat, p.lng])).pad(0.08);
function resetView() {
  showCourse(null);
  closePlace();
  map.flyToBounds(allBounds, { duration: 0.6 });
}
$('map-reset').addEventListener('click', resetView);
map.fitBounds(allBounds);

// ── 장소 목록 ──
const grid = $('area-grid');
grid.innerHTML = Object.entries(AREAS).map(([k, label]) => {
  const items = PLACES.filter((p) => p.area === k);
  if (!items.length) return '';
  return `<div class="card bg-white area-box"><h3>${escH(label)}</h3><ul>${items.map((p) =>
    `<li><button type="button" data-place="${escH(p.name)}"><span class="ln" style="--c:${THEMES[p.themes[0]].pin}">${p.no}</span>${escH(p.name)}</button></li>`).join('')}</ul></div>`;
}).join('');
grid.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-place]');
  if (!b) return;
  const p = byName[b.dataset.place];
  document.querySelector('.map-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => openPlace(p), 350);
});

// 화면 크기 바뀔 때(폴더블 펼치기/접기 등) 지도 크기 다시 계산
let rt;
window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => map.invalidateSize(), 150); });
