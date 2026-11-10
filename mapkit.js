// ───────── 지도 어댑터 ─────────
// 네이버 지도 키(config.js)가 있으면 네이버 지도, 없거나 인증에 실패하면 OpenStreetMap(Leaflet)으로 그려요.
// 페이지 코드는 아래 공통 함수만 쓰면 돼서, 지도 회사를 바꿔도 페이지는 그대로예요.
(function () {
  const loadScript = (src, timeout = 10000) => new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    const t = setTimeout(() => fail(new Error('timeout')), timeout);
    s.onload = () => { clearTimeout(t); ok(); };
    s.onerror = () => { clearTimeout(t); fail(new Error('load')); };
    document.head.appendChild(s);
  });
  const loadCss = (href) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  };

  let authFailHandler = null;
  // 네이버 지도는 키가 틀리거나 도메인이 등록 안 됐으면 이 함수를 불러요
  window.navermap_authFailure = () => { if (authFailHandler) authFailHandler(); };

  // ── 네이버 ──
  async function naverMap(el, { center, zoom }) {
    const key = window.LL_CONFIG?.naverMapKeyId;
    if (!window.naver?.maps) await loadScript(`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(key)}`);
    const N = naver.maps;
    const ll = (lat, lng) => new N.LatLng(lat, lng);
    const map = new N.Map(el, {
      center: ll(center[0], center[1]), zoom,
      scrollWheel: false,
      zoomControl: true,
      zoomControlOptions: { position: N.Position.TOP_RIGHT, style: N.ZoomControlStyle.SMALL },
      mapDataControl: false, scaleControl: true, logoControlOptions: { position: N.Position.BOTTOM_RIGHT },
    });
    N.Event.addListener(map, 'click', () => map.setOptions({ scrollWheel: true }));
    return {
      provider: 'naver',
      credit: '지도 © NAVER Corp.',
      marker({ lat, lng, html, anchor = [22, 40], title = '', onClick, z = 0 }) {
        const m = new N.Marker({
          position: ll(lat, lng), map, title, zIndex: z,
          icon: { content: html, anchor: new N.Point(anchor[0], anchor[1]) },
        });
        if (onClick) N.Event.addListener(m, 'click', onClick);
        return { remove: () => m.setMap(null), setZ: (v) => m.setZIndex(v) };
      },
      circle(c, radius) {
        const o = new N.Circle({
          map, center: ll(c[0], c[1]), radius,
          strokeColor: '#5b1236', strokeOpacity: 0.55, strokeWeight: 2, strokeStyle: 'shortdash',
          fillColor: '#e9c9ff', fillOpacity: 0.22, clickable: false,
        });
        return { remove: () => o.setMap(null) };
      },
      fit(points, pad = 40) {
        if (!points.length) return;
        const b = new N.LatLngBounds(ll(points[0][0], points[0][1]), ll(points[0][0], points[0][1]));
        points.forEach((p) => b.extend(ll(p[0], p[1])));
        map.fitBounds(b, { top: pad, right: pad, bottom: pad, left: pad });
      },
      flyTo(lat, lng, z, offsetY = 0) {
        const zz = Math.max(map.getZoom(), z);
        map.morph(ll(lat, lng), zz);
        if (offsetY) setTimeout(() => map.panBy(new N.Point(0, offsetY)), 450);
      },
      onClick(fn) { N.Event.addListener(map, 'click', fn); },
      resize() { N.Event.trigger(map, 'resize'); },
      destroy() { map.destroy(); },
    };
  }

  // ── OpenStreetMap (Leaflet) ──
  async function osmMap(el, { center, zoom }) {
    loadCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
    if (!window.L) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js');
    el.classList.add('is-osm');
    const map = L.map(el, { zoomControl: false, scrollWheelZoom: false }).setView(center, zoom);
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.on('click', () => map.scrollWheelZoom.enable());
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    return {
      provider: 'osm',
      credit: '지도 © OpenStreetMap contributors',
      marker({ lat, lng, html, anchor = [22, 40], title = '', onClick, z = 0 }) {
        const icon = L.divIcon({ className: 'mk-osm', html, iconSize: [anchor[0] * 2, anchor[1] + 4], iconAnchor: anchor });
        const m = L.marker([lat, lng], { icon, title, alt: title, zIndexOffset: z }).addTo(map);
        if (onClick) m.on('click', (e) => { L.DomEvent.stopPropagation(e); onClick(); });
        return { remove: () => m.remove(), setZ: (v) => m.setZIndexOffset(v) };
      },
      circle(c, radius) {
        const o = L.circle(c, { radius, color: '#5b1236', opacity: 0.55, weight: 2, dashArray: '6 6', fillColor: '#e9c9ff', fillOpacity: 0.22, interactive: false }).addTo(map);
        return { remove: () => o.remove() };
      },
      fit(points, pad = 40) {
        if (!points.length) return;
        map.flyToBounds(L.latLngBounds(points), { padding: [pad, pad], duration: 0.6, maxZoom: 17 });
      },
      flyTo(lat, lng, z, offsetY = 0) {
        const zz = Math.max(map.getZoom(), z);
        const pt = map.project([lat, lng], zz).add([0, offsetY]);
        map.flyTo(map.unproject(pt, zz), zz, { duration: 0.6 });
      },
      onClick(fn) { map.on('click', fn); },
      resize() { map.invalidateSize(); },
      destroy() { map.remove(); el.classList.remove('is-osm'); },
    };
  }

  window.MapKit = {
    async create(el, opts) {
      if (window.LL_CONFIG?.naverMapKeyId && !opts.forceOsm) {
        try { return await naverMap(el, opts); } catch (e) { console.warn('네이버 지도를 못 불러와서 OSM으로 바꿔요', e); }
      }
      return osmMap(el, opts);
    },
    onAuthFail(fn) { authFailHandler = fn; },
  };
})();
