# travel-guide (Local Lab)

정적 여행 가이드 사이트. Cloudflare Workers(`local-lab`)로 https://local-lab.app 에 배포된다.

## "푸시" = 홈페이지 배포 + git 기록
사용자가 "푸시해줘"라고 하면 묻지 말고 아래 스크립트 하나로 처리한다. 커밋 메시지는 이번 변경 내용을 한 줄로 쓴다.

```
powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1 -Message "변경 내용 한 줄"
```

스크립트가 하는 일: 변경사항 git 커밋 → `wrangler deploy` → 새 버전 ID를 `DEPLOYS.md` 맨 위에 기록하고 커밋 → 원격 저장소가 있으면 `git push`.
배포 후 https://local-lab.app 이 200으로 열리는지 확인하고 알린다.

## "직전으로 돌려줘" = 롤백
`DEPLOYS.md` 표의 맨 위 줄이 현재 버전, 바로 아래 줄이 직전 빌드다. 사용자가 되돌리라고 하면:

```
powershell -ExecutionPolicy Bypass -File scripts/rollback.ps1
```

(특정 버전으로: `-Version <버전ID>`). Cloudflare를 직전 버전으로 돌리고 롤백 기록을 커밋한다.
롤백은 사이트만 되돌린다. 소스 코드는 그대로이므로, 그 상태에서 다시 "푸시"하면 롤백 전 내용이 다시 올라간다. 소스도 되돌려야 하면 사용자에게 확인 후 `git revert`로 처리한다.

## 환경
- wrangler는 로그인돼 있다. Node: `C:\Program Files\nodejs`, Git: `C:\Program Files\Git\cmd\git.exe` (PATH에 없을 수 있음).
- 스크립트(.ps1)는 PowerShell 5.1용이라 UTF-8 **BOM** 으로 저장해야 한글이 안 깨진다.

## 구조
- `index.html`, `busan.html`, `map.html`, `styles.css`, `script.js`, `busan.js`, `map.js`, `data.js`(장소·코스 데이터 공용), `assets/`
- 사이트 핵심 컨셉: **제휴 숙소를 고르면 그 주변 명소·맛집을 지도에 보여준다** → `stay.html` + `stay.js`, 숙소 목록은 `stays.js`
- 지도: `mapkit.js` 어댑터. `config.js`의 `naverMapKeyId`(네이버 클라우드 Maps Client ID, 공개값)가 있으면 네이버 지도, 없거나 인증 실패면 OSM(Leaflet)
- 주변 장소: `worker/index.js`의 `/api/nearby`가 한국관광공사 TourAPI(KorService2 locationBasedList2)를 대신 호출. 키는 Worker secret `TOURAPI_KEY`(사용자가 직접 `npx wrangler secret put TOURAPI_KEY`). API 실패 시 `data.js` 큐레이션 장소로 대체
- `wrangler dev`는 이 노트북에서 workerd가 안 떠서(VC++ 런타임) 못 씀 → Worker는 Node로 따로 시험, 페이지는 serve.ps1로 확인
- `wrangler.jsonc`: 배포 설정(`main` Worker + assets, `/api/*`만 Worker 먼저), `.assetsignore`: 업로드 제외 목록
- 로컬 미리보기: `.claude/serve.ps1 -Port 5174`
