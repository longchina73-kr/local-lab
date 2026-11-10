// ───────── 제휴 숙소 목록 ─────────
// ⚠ 지금은 화면 확인용 예시예요. 실제 제휴 숙소 정보(이름·좌표·소개·예약 링크)로 바꿔 주세요.
// id 는 주소에 쓰여요: stay.html?stay=<id>  → 숙소별 안내 링크로 나눠 줄 수 있어요.
const STAYS = [
  {
    id: 'haeundae', name: '해운대 바다 스테이', kind: '호텔', area: 'haeundae', sample: true,
    lat: 35.1600, lng: 129.1620,
    desc: '해운대 해변까지 걸어서 3분. 해변 산책, 달맞이길, 해리단길 맛집이 가까워요.',
    tags: ['바다 전망', '해변 도보 3분'], link: '',
  },
  {
    id: 'gwangan', name: '광안리 오션 게스트하우스', kind: '게스트하우스', area: 'south', sample: true,
    lat: 35.1540, lng: 129.1185,
    desc: '광안대교 야경이 보이는 루프탑. 밤에는 드론쇼, 낮에는 민락수변공원 산책.',
    tags: ['루프탑', '야경'], link: '',
  },
  {
    id: 'nampo', name: '남포 골목 하우스', kind: '게스트하우스', area: 'old', sample: true,
    lat: 35.0990, lng: 129.0300,
    desc: '국제시장, 깡통야시장, 보수동 책방골목이 모두 걸어서 10분 안이에요.',
    tags: ['원도심', '시장 도보'], link: '',
  },
  {
    id: 'seomyeon', name: '서면 시티 호텔', kind: '호텔', area: 'central', sample: true,
    lat: 35.1570, lng: 129.0595,
    desc: '지하철 1·2호선 서면역 바로 앞. 전포 카페거리와 부산시민공원이 가까워요.',
    tags: ['역세권', '카페거리'], link: '',
  },
  {
    id: 'yeongdo', name: '영도 흰여울 스테이', kind: '펜션', area: 'yeongdo', sample: true,
    lat: 35.0785, lng: 129.0450,
    desc: '흰여울문화마을 절벽 위 바다 마을. 해안 산책로와 태종대로 이어져요.',
    tags: ['바다 마을', '조용한'], link: '',
  },
];
