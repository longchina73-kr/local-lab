// ───────── 숙소로 찾기 ─────────
// 숙소를 고르면 → /api/nearby (TourAPI) 로 주변 명소·맛집을 가져와 지도와 목록에 표시.
// API 를 못 쓰면(키 없음·로컬 미리보기) data.js 의 큐레이션 장소로 대신 보여줘요.
(function () {
  const $ = (id) => document.getElementById(id);
  const escH = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const KINDS = {
    sight: { label: '명소', types: ['12', '14'], color: '#2f7fd8', icon: '🏞️' },
    food:  { label: '맛집', types: ['39'], color: '#e2583e', icon: '🍽️' },
  };
  const TYPE_LABEL = { 12: '관광지', 14: '문화시설', 28: '레포츠', 38: '쇼핑', 39: '음식점' };
  const STAY_COLOR = '#5b1236';

  const state = { stay: null, kind: 'sight', radius: 1000, items: [], selected: null, req: 0 };
  let mk = null;
  let layer = [];           // 지도 위 주변 장소 마커들
  let stayLayer = [];       // 숙소 마커 + 반경 원
  const cache = new Map();

  // ── 거리 ──
  function distM(a, b, c, d) {
    const R = 6371000, r = Math.PI / 180;
    const x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(x)));
  }
  const fmtDist = (m) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);
  const walkMin = (m) => Math.max(1, Math.round(m / 67)); // 걷는 속도 약 4km/h

  // ── 주변 장소 가져오기 ──
  async function fetchNearby(stay, kind, radius) {
    const key = `${stay.id}|${kind}|${radius}`;
    if (cache.has(key)) return cache.get(key);
    let result;
    try {
      const lists = await Promise.all(KINDS[kind].types.map(async (t) => {
        const r = await fetch(`/api/nearby?lat=${stay.lat}&lng=${stay.lng}&type=${t}&radius=${radius}`);
        if (!r.ok) throw new Error(String(r.status));
        return (await r.json()).items;
      }));
      const seen = new Set();
      const items = lists.flat().filter((x) => !seen.has(x.id) && seen.add(x.id))
        .map((x) => ({ ...x, cat: TYPE_LABEL[x.type] || KINDS[kind].label }))
        .sort((a, b) => a.dist - b.dist);
      result = { source: 'tourapi', items };
    } catch {
      result = { source: 'local', items: localNearby(stay, kind, radius) };
    }
    cache.set(key, result);
    return result;
  }

  // 큐레이션 데이터(data.js)로 대신 찾기
  function localNearby(stay, kind, radius) {
    return PLACES
      .filter((p) => (kind === 'food' ? p.themes.includes('food') : p.themes.some((t) => t !== 'food')))
      .map((p) => ({
        id: p.name, title: p.name, lat: p.lat, lng: p.lng, desc: p.desc,
        addr: AREAS[p.area], cat: THEMES[kind === 'food' ? 'food' : p.themes.find((t) => t !== 'food')].label,
        dist: distM(stay.lat, stay.lng, p.lat, p.lng), img: '',
      }))
      .filter((p) => p.dist <= radius)
      .sort((a, b) => a.dist - b.dist);
  }

  // ── 숙소 목록 ──
  const stayList = $('stay-list');
  stayList.innerHTML = STAYS.map((s) => `
    <li><button type="button" class="stay-btn" data-stay="${escH(s.id)}" aria-pressed="false">
      <span class="sb-kind">${escH(s.kind)}</span>
      <b>${escH(s.name)}</b>
      <span class="sb-area">${escH(AREAS[s.area] || '')}</span>
    </button></li>`).join('');
  stayList.addEventListener('click', (e) => {
    const b = e.target.closest('.stay-btn');
    if (!b) return;
    selectStay(b.dataset.stay, { scroll: true });
  });

  function selectStay(id, { scroll = false } = {}) {
    const s = STAYS.find((x) => x.id === id) || STAYS[0];
    state.stay = s;
    stayList.querySelectorAll('.stay-btn').forEach((b) => {
      const on = b.dataset.stay === s.id;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    // 고른 숙소 카드가 가로 목록 안에서 보이게 (페이지는 안 움직임)
    const btn = stayList.querySelector(`[data-stay="${s.id}"]`);
    if (btn) {
      const dx = btn.getBoundingClientRect().left - stayList.getBoundingClientRect().left;
      stayList.scrollTo({ left: stayList.scrollLeft + dx - 4, behavior: scroll ? 'smooth' : 'auto' });
    }
    const u = new URL(location.href);
    u.searchParams.set('stay', s.id);
    history.replaceState(null, '', u);

    $('stay-info').innerHTML = `
      <p class="si-kind">${escH(s.kind)} · ${escH(AREAS[s.area] || '')}</p>
      <h2>${escH(s.name)}</h2>
      <p class="si-desc">${escH(s.desc)}</p>
      <div class="pc-tags">${s.tags.map((t) => `<span class="pc-tag">${escH(t)}</span>`).join('')}</div>
      ${s.sample ? '<p class="si-note">예시 숙소예요. 실제 제휴 숙소로 바뀔 예정이에요.</p>' : ''}
      ${s.link ? `<a class="pill" href="${escH(s.link)}" target="_blank" rel="noopener">예약하기</a>` : ''}`;
    if (scroll && window.matchMedia('(max-width: 1023px)').matches) {
      document.querySelector('.map-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    drawStay();
    load();
  }

  // ── 탭 / 거리 ──
  document.querySelector('.nb-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('.nb-tab');
    if (!b) return;
    state.kind = b.dataset.kind;
    document.querySelectorAll('.nb-tab').forEach((t) => {
      const on = t === b;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', String(on));
    });
    load();
  });
  $('nb-radius').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state.radius = Number(b.dataset.r);
    $('nb-radius').querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c === b));
    drawStay();
    load();
  });

  // ── 지도 그리기 ──
  const pinHtml = (color, icon, label, cls = '') =>
    `<div class="pin-wrap ${cls}"><span class="pin" style="--c:${color}"><i aria-hidden="true">${icon}</i>${label ? `<b>${label}</b>` : ''}</span></div>`;

  function drawStay() {
    if (!mk || !state.stay) return;
    stayLayer.forEach((o) => o.remove());
    const s = state.stay;
    stayLayer = [
      mk.circle([s.lat, s.lng], state.radius),
      mk.marker({ lat: s.lat, lng: s.lng, title: s.name, z: 2000, anchor: [26, 48],
        html: `<div class="pin-wrap pin-stay"><span class="pin" style="--c:${STAY_COLOR}"><i aria-hidden="true">🏨</i></span><em>${escH(s.name)}</em></div>`,
        onClick: () => closePlace() }),
    ];
  }

  function drawItems() {
    layer.forEach((o) => o.remove());
    layer = [];
    if (!mk) return;
    const k = KINDS[state.kind];
    state.items.forEach((p, i) => {
      p.no = i + 1;
      p.mark = mk.marker({ lat: p.lat, lng: p.lng, title: `${p.no}. ${p.title}`, z: 100 - i,
        html: pinHtml(k.color, k.icon, p.no, `mk-${i}`), onClick: () => openPlace(p) });
      layer.push(p.mark);
    });
    const s = state.stay;
    const pts = [[s.lat, s.lng], ...state.items.slice(0, 15).map((p) => [p.lat, p.lng])];
    // 반경 원이 다 보이도록 범위 잡기
    const dLat = state.radius / 111000, dLng = state.radius / (111000 * Math.cos(s.lat * Math.PI / 180));
    pts.push([s.lat + dLat, s.lng], [s.lat - dLat, s.lng], [s.lat, s.lng + dLng], [s.lat, s.lng - dLng]);
    mk.fit(pts, 30);
  }

  // ── 목록 ──
  async function load() {
    const id = ++state.req;
    closePlace();
    $('nb-status').textContent = '찾는 중…';
    $('nb-list').innerHTML = '';
    const { source, items } = await fetchNearby(state.stay, state.kind, state.radius);
    if (id !== state.req) return; // 그 사이 다른 걸 눌렀으면 무시
    state.items = items.slice(0, 30);
    const k = KINDS[state.kind];
    $('nb-status').innerHTML = items.length
      ? `${fmtDist(state.radius)} 안에 ${k.label} <b>${items.length}곳</b>${source === 'local' ? ' <span class="nb-src">· Local Lab 추천 장소</span>' : ''}`
      : `${fmtDist(state.radius)} 안에는 아직 등록된 ${k.label}가 없어요. 거리를 늘려 보세요.`;
    $('nb-list').innerHTML = state.items.map((p, i) => `
      <li><button type="button" class="nb-item" data-i="${i}">
        <span class="ln" style="--c:${k.color}">${i + 1}</span>
        <span class="nb-main"><b>${escH(p.title)}</b><small>${escH(p.cat)}${p.addr ? ` · ${escH(shortAddr(p.addr))}` : ''}</small></span>
        <span class="nb-dist">${fmtDist(p.dist)}<small>도보 ${walkMin(p.dist)}분</small></span>
      </button></li>`).join('');
    drawItems();
  }
  const shortAddr = (a) => a.replace(/^부산광역시\s*/, '').split(' ').slice(0, 2).join(' ');

  $('nb-list').addEventListener('click', (e) => {
    const b = e.target.closest('.nb-item');
    if (!b) return;
    if (window.matchMedia('(max-width: 1023px)').matches) {
      document.querySelector('.map-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    openPlace(state.items[Number(b.dataset.i)]);
  });

  // ── 설명창 ──
  const card = $('place-card');
  function openPlace(p) {
    if (!p) return;
    if (state.selected) {
      state.selected.mark?.setZ(100 - state.selected.no);
      document.querySelector(`.mk-${state.selected.no - 1}`)?.classList.remove('is-selected');
    }
    state.selected = p;
    p.mark?.setZ(3000);
    document.querySelector(`.mk-${p.no - 1}`)?.classList.add('is-selected');
    document.querySelectorAll('.nb-item').forEach((b) => b.classList.toggle('is-on', Number(b.dataset.i) === p.no - 1));

    const k = KINDS[state.kind];
    $('pc-num').textContent = p.no;
    $('pc-num').style.setProperty('--c', k.color);
    $('pc-name').textContent = p.title;
    $('pc-area').textContent = `${p.cat}${p.addr ? ' · ' + p.addr : ''}`;
    $('pc-desc').textContent = p.desc || '';
    $('pc-desc').hidden = !p.desc;
    $('pc-meta').textContent = `🚶 ${state.stay.name}에서 ${fmtDist(p.dist)} · 걸어서 약 ${walkMin(p.dist)}분${p.tel ? ` · ☎ ${p.tel}` : ''}`;
    const img = $('pc-photo');
    img.hidden = !p.img;
    if (p.img) { img.src = p.img; img.alt = p.title; } else img.removeAttribute('src');
    $('pc-link').href = `https://map.naver.com/p/search/${encodeURIComponent(p.title)}`;
    card.hidden = false;
    mk?.flyTo(p.lat, p.lng, 15, card.offsetHeight / 2);
  }
  function closePlace() {
    card.hidden = true;
    if (state.selected) {
      state.selected.mark?.setZ(100 - state.selected.no);
      document.querySelector(`.mk-${state.selected.no - 1}`)?.classList.remove('is-selected');
    }
    document.querySelectorAll('.nb-item.is-on').forEach((b) => b.classList.remove('is-on'));
    state.selected = null;
  }
  card.querySelector('.pc-close').addEventListener('click', closePlace);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePlace(); });
  $('map-reset').addEventListener('click', () => { closePlace(); drawItems(); });

  // ── 시작 ──
  async function startMap(forceOsm = false) {
    if (mk) { try { mk.destroy(); } catch { /* 무시 */ } }
    const el = $('map');
    el.innerHTML = '';
    const first = STAYS.find((s) => s.id === new URLSearchParams(location.search).get('stay')) || STAYS[0];
    mk = await MapKit.create(el, { center: [first.lat, first.lng], zoom: 15, forceOsm });
    mk.onClick(closePlace);
    $('map-credit').textContent = mk.credit;
    if (state.stay) { drawStay(); drawItems(); } else selectStay(first.id);
  }
  // 네이버 지도 인증 실패(키 오류·도메인 미등록) → OSM 으로 다시 그림
  MapKit.onAuthFail(() => { console.warn('네이버 지도 인증 실패: OSM 으로 대신 보여줘요'); startMap(true); });

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => mk?.resize(), 150); });

  startMap();
})();
