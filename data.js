// ───────── 부산 장소 데이터 (부산 가이드 · 가이드맵 공용) ─────────
// slot: 하루 중 어울리는 시간대 (am 오전 / pm 오후 / night 저녁)
// area: 동선을 묶기 위한 권역 · lat/lng: 지도 위치(대략적인 중심점)
const THEMES = {
  alley:   { label: '골목길',   color: 'bg-cream', pin: '#e0a21b', icon: '🏘️' },
  night:   { label: '야경',     color: 'bg-plum',  pin: '#5b1236', icon: '🌙' },
  food:    { label: '미식',     color: 'bg-lilac', pin: '#e2583e', icon: '🍜' },
  sea:     { label: '바다·레저', color: 'bg-sky',   pin: '#2f7fd8', icon: '🌊' },
  history: { label: '역사',     color: 'bg-white', pin: '#8a5cc9', icon: '🏛️' },
  nature:  { label: '자연·걷기', color: 'bg-cream', pin: '#2e9a6a', icon: '🌿' },
};

const AREAS = {
  old: '원도심(중구·동구)',
  west: '서부산(사하·서구)',
  yeongdo: '영도',
  south: '남구·수영',
  haeundae: '해운대·기장',
  central: '서면·전포',
  north: '동래·북구',
  gangseo: '강서·낙동강',
};

const PLACES = [
  { name: '감천문화마을', area: 'west', themes: ['alley', 'history'], slot: 'am', lat: 35.0975, lng: 129.0106, desc: '산비탈을 따라 계단처럼 쌓인 파스텔색 집들. 피란민들이 일군 마을이 예술 마을이 됐어요.' },
  { name: '보수동 책방골목', area: 'old', themes: ['alley', 'history'], slot: 'pm', lat: 35.1031, lng: 129.0262, desc: '헌책방이 줄지어 선 좁은 골목. 천장까지 쌓인 책 사이에서 시간 가는 줄 몰라요.' },
  { name: '국제시장', area: 'old', themes: ['food', 'alley', 'history'], slot: 'pm', lat: 35.1009, lng: 129.0290, desc: '피란 시절부터 이어진 시장. 골목마다 파는 물건이 달라 구경만으로도 반나절.' },
  { name: '부평깡통야시장', area: 'old', themes: ['food', 'night'], slot: 'night', lat: 35.1019, lng: 129.0253, desc: '저녁이면 노점이 펼쳐지는 야시장. 어묵, 유부주머니, 세계 각국 길거리 음식.' },
  { name: '용두산공원과 부산타워', area: 'old', themes: ['night', 'history'], slot: 'night', lat: 35.1007, lng: 129.0325, desc: '광복동 한가운데 언덕 공원. 타워 전망대에서 원도심과 항구가 한눈에.' },
  { name: '조선통신사역사관', area: 'old', themes: ['history'], slot: 'am', lat: 35.1345, lng: 129.0632, desc: '조선과 일본을 오간 외교 사절단의 기록을 모은 작은 전시관.' },
  { name: '범일동 포차거리', area: 'old', themes: ['food', 'night'], slot: 'night', lat: 35.1397, lng: 129.0597, desc: '퇴근길 부산 사람들이 모이는 포장마차 골목. 해산물 안주가 강해요.' },
  { name: '태종대', area: 'yeongdo', themes: ['nature', 'sea'], slot: 'am', lat: 35.0533, lng: 129.0858, desc: '영도 끝 절벽과 등대. 순환 열차를 타거나 해안 산책로를 걸어요.' },
  { name: '영도 봉산마을', area: 'yeongdo', themes: ['alley'], slot: 'pm', lat: 35.0876, lng: 129.0538, desc: '조용한 언덕 동네에 작은 공방과 카페가 하나둘 들어선 곳.' },
  { name: '흰여울문화마을', area: 'yeongdo', themes: ['alley', 'sea'], slot: 'pm', lat: 35.0785, lng: 129.0437, desc: '바다 절벽 위 좁은 골목. 계단을 내려가면 해안 산책로와 이어져요.' },
  { name: '봉래산 야간 트레킹', area: 'yeongdo', themes: ['nature', 'night'], slot: 'night', lat: 35.0818, lng: 129.0577, desc: '해 질 무렵 올라 북항과 남항 불빛을 동시에 내려다보는 코스.' },
  { name: '동삼동패총전시관', area: 'yeongdo', themes: ['history'], slot: 'am', lat: 35.0770, lng: 129.0705, desc: '신석기 시대 조개더미 유적. 수천 년 전 영도 사람들의 생활이 남아 있어요.' },
  { name: '이기대 해안산책로', area: 'south', themes: ['nature', 'sea'], slot: 'am', lat: 35.1218, lng: 129.1262, desc: '오륙도까지 이어지는 약 5km 해안길. 바위 절벽 너머로 광안대교가 보여요.' },
  { name: '오륙도 스카이워크', area: 'south', themes: ['sea'], slot: 'am', lat: 35.1007, lng: 129.1243, desc: '절벽 끝 유리 바닥 전망대. 이기대 산책로의 출발점이자 도착점.' },
  { name: '광안리 해변', area: 'south', themes: ['sea', 'night'], slot: 'night', lat: 35.1532, lng: 129.1187, desc: '밤마다 조명이 켜지는 광안대교를 정면으로 보는 해변.' },
  { name: '광안리 SUP 요가', area: 'south', themes: ['sea'], slot: 'am', lat: 35.1555, lng: 129.1215, desc: '잔잔한 아침 바다 위 패들보드에서 하는 요가 체험.' },
  { name: '해리단길', area: 'haeundae', themes: ['food', 'alley'], slot: 'pm', lat: 35.1650, lng: 129.1588, desc: '옛 해운대역 뒤편 주택가 골목. 작은 식당과 카페가 모여 있어요.' },
  { name: '동백섬', area: 'haeundae', themes: ['nature', 'sea'], slot: 'am', lat: 35.1530, lng: 129.1522, desc: '해운대 해변 끝의 숲길 산책로. 등대와 누리마루 하우스를 지나요.' },
  { name: '청사포 다릿돌전망대', area: 'haeundae', themes: ['sea'], slot: 'pm', lat: 35.1602, lng: 129.1925, desc: '바다 위로 뻗은 전망대. 해변열차, 스카이캡슐과 묶기 좋아요.' },
  { name: '해운대 블루라인파크 해변열차', area: 'haeundae', themes: ['sea'], slot: 'pm', lat: 35.1585, lng: 129.1720, desc: '미포에서 송정까지 옛 철길을 따라 바다 옆을 달리는 관광 열차.' },
  { name: '더베이101 야경', area: 'haeundae', themes: ['night'], slot: 'night', lat: 35.1563, lng: 129.1520, desc: '마린시티 고층 빌딩 불빛이 바다에 비치는 해운대의 대표 야경.' },
  { name: '전포카페거리', area: 'central', themes: ['food', 'alley'], slot: 'pm', lat: 35.1545, lng: 129.0645, desc: '공구 상가 사이로 카페와 디저트 가게가 들어선 동네.' },
  { name: '부산시민공원', area: 'central', themes: ['nature', 'history'], slot: 'am', lat: 35.1683, lng: 129.0573, desc: '옛 미군 기지 하야리아 부지를 공원으로. 역사관에서 그 시절 이야기를 볼 수 있어요.' },
  { name: '서면 돼지국밥 골목', area: 'central', themes: ['food'], slot: 'night', lat: 35.1575, lng: 129.0598, desc: '부산 사람들의 소울푸드. 늦은 밤까지 문을 여는 가게가 많아요.' },
  { name: '복천박물관·고분군', area: 'north', themes: ['history'], slot: 'am', lat: 35.2063, lng: 129.0905, desc: '가야 시대 무덤과 철제 갑옷, 토기를 볼 수 있는 동래의 박물관.' },
  { name: '동래읍성과 동래시장', area: 'north', themes: ['history', 'food'], slot: 'pm', lat: 35.2092, lng: 129.0838, desc: '옛 성곽길을 걷고 내려와 시장에서 동래파전 한 장.' },
  { name: '구포시장', area: 'north', themes: ['food'], slot: 'pm', lat: 35.2108, lng: 129.0040, desc: '백 년 넘게 이어진 오일장 전통의 큰 시장. 장날에 가면 더 북적여요.' },
  { name: '화명수상레포츠타운', area: 'north', themes: ['sea'], slot: 'pm', lat: 35.2335, lng: 129.0045, desc: '낙동강에서 수상스키, 웨이크보드 같은 수상 레포츠를 즐겨요.' },
  { name: '송도 스카이워크', area: 'west', themes: ['sea'], slot: 'pm', lat: 35.0757, lng: 129.0170, desc: '송도해수욕장의 바다 위 산책로. 해상 케이블카와 함께 둘러봐요.' },
  { name: '다대포 해변 노을', area: 'west', themes: ['sea', 'night', 'nature'], slot: 'night', lat: 35.0468, lng: 128.9664, desc: '넓은 모래사장 너머로 지는 해. 부산에서 손꼽히는 노을 명소.' },
  { name: '다대포해양레포츠센터', area: 'west', themes: ['sea'], slot: 'pm', lat: 35.0498, lng: 128.9612, desc: '카이트서핑, 윈드서핑 등 바람을 타는 수상 레포츠 체험.' },
  { name: '대저생태공원', area: 'gangseo', themes: ['nature'], slot: 'pm', lat: 35.2085, lng: 128.9890, desc: '낙동강변 넓은 들판. 봄엔 유채, 가을엔 억새와 팜파스.' },
];

// 가이드맵 추천 코스 (거리·시간은 걷기 기준 대략값)
const COURSES = [
  { id: 'old', name: '원도심 골목 산책', color: '#e0a21b', dist: '약 2km', time: '반나절',
    desc: '책방골목에서 시작해 시장 두 곳을 지나 용두산공원 야경으로 마무리하는 코스.',
    stops: ['보수동 책방골목', '국제시장', '부평깡통야시장', '용두산공원과 부산타워'] },
  { id: 'yeongdo', name: '영도 바다 둘레길', color: '#2f7fd8', dist: '약 8km', time: '하루',
    desc: '절벽 위 마을과 섬 끝 등대, 해 질 무렵 봉래산까지 영도를 한 바퀴.',
    stops: ['흰여울문화마을', '동삼동패총전시관', '태종대', '봉래산 야간 트레킹'] },
  { id: 'south', name: '남구 해안 절벽길', color: '#2e9a6a', dist: '약 6km', time: '3~4시간',
    desc: '오륙도에서 출발해 이기대 해안길을 걷고 광안리 해변에서 야경을 보는 코스.',
    stops: ['오륙도 스카이워크', '이기대 해안산책로', '광안리 해변'] },
  { id: 'haeundae', name: '해운대 바다 열차길', color: '#e2583e', dist: '약 7km', time: '하루',
    desc: '동백섬 숲길과 해변열차, 청사포 전망대를 잇는 동쪽 바다 코스.',
    stops: ['동백섬', '더베이101 야경', '해운대 블루라인파크 해변열차', '청사포 다릿돌전망대'] },
  { id: 'west', name: '서부산 노을 코스', color: '#8a5cc9', dist: '버스 이동', time: '반나절',
    desc: '언덕 마을에서 바다 위 산책로를 지나 다대포에서 해 지는 걸 보는 코스.',
    stops: ['감천문화마을', '송도 스카이워크', '다대포 해변 노을'] },
];
