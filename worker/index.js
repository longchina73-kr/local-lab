// Local Lab Worker
// - /api/nearby : 한국관광공사 TourAPI(KorService2)로 숙소 주변 명소·맛집을 찾아 줌 (서비스 키는 서버에만 보관)
// - 그 밖의 요청 : 정적 파일(assets) 그대로
//
// 키 설정(한 번만):  npx wrangler secret put TOURAPI_KEY   ← data.go.kr 에서 받은 "일반 인증키(Decoding)"

const TOUR = 'https://apis.data.go.kr/B551011/KorService2/locationBasedList2';
const TYPES = new Set(['12', '14', '28', '38', '39']); // 관광지, 문화시설, 레포츠, 쇼핑, 음식점
const CACHE_SEC = 6 * 3600;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/nearby') return nearby(request, url, env, ctx);
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },
};

async function nearby(request, url, env, ctx) {
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  const type = url.searchParams.get('type') || '12';
  const radius = Math.min(Math.max(Number(url.searchParams.get('radius')) || 2000, 300), 5000);

  // 한국 안의 좌표만 받음
  if (!(lat > 33 && lat < 39 && lng > 124 && lng < 132)) return json({ error: 'bad_location' }, 400);
  if (!TYPES.has(type)) return json({ error: 'bad_type' }, 400);
  if (!env.TOURAPI_KEY) return json({ error: 'no_key' }, 503);

  // 같은 질문은 6시간 동안 캐시 (하루 호출 한도 아끼기)
  const key = new Request(`https://cache.local-lab.app/nearby?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}&type=${type}&r=${radius}`);
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return hit;

  const q = new URLSearchParams({
    MobileOS: 'WEB', MobileApp: 'LocalLab', _type: 'json',
    mapX: String(lng), mapY: String(lat), radius: String(radius),
    contentTypeId: type, arrange: 'E', numOfRows: '30', pageNo: '1',
  });
  let data;
  try {
    // serviceKey 는 인코딩 문제를 피하려고 따로 붙임
    const res = await fetch(`${TOUR}?serviceKey=${encodeURIComponent(env.TOURAPI_KEY)}&${q}`, {
      headers: { accept: 'application/json' },
    });
    const text = await res.text();
    data = JSON.parse(text);
  } catch {
    return json({ error: 'upstream' }, 502);
  }

  const header = data?.response?.header;
  if (header && header.resultCode !== '0000') return json({ error: 'upstream', detail: header.resultMsg }, 502);
  let items = data?.response?.body?.items?.item || [];
  if (!Array.isArray(items)) items = [items];

  const out = items.map((it) => ({
    id: it.contentid,
    type: it.contenttypeid,
    title: it.title,
    addr: [it.addr1, it.addr2].filter(Boolean).join(' '),
    lat: Number(it.mapy),
    lng: Number(it.mapx),
    dist: Math.round(Number(it.dist) || 0),
    img: (it.firstimage2 || it.firstimage || '').replace(/^http:/, 'https:'),
    tel: it.tel || '',
  })).filter((x) => x.lat && x.lng);

  const res = json({ source: 'tourapi', items: out }, 200, { 'cache-control': `public, max-age=${CACHE_SEC}` });
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}
