# monopo 홈 화면 디자인 훈련 — 핸드오프 문서

개인 디자인 훈련용 스터디 2종. 각각 **단일 HTML 파일**(의존성 없음, WebGL1 프래그먼트 셰이더 + 오프스크린 캔버스 텍스트 텍스처)로 구현.

> ⚠️ 두 파일 모두 monopo의 레이아웃·카피·워드마크를 따라간 습작이므로 **공개 배포 금지** (`noindex` 처리됨).
> main에 머지하면 siriai.co.kr에서 정적 파일로 서빙되니 이 브랜치에만 둘 것.

## 실행 방법

```
python -m http.server 5599    # 리포 루트에서 (아무 정적 서버나 OK)
# → http://localhost:5599/monopo-study.html
# → http://localhost:5599/monopo-vn-study.html
```

`.claude/launch.json`에 같은 설정(`siriai-home`, 포트 5599)이 이미 있음.

---

## 1. monopo-study.html — monopo.london 베이스

원본: https://monopo.london/ (다크 + 오렌지/블루 유체 그라디언트 + 유리 구체 렌즈)

### 진화 히스토리 (유저 지시 순서)
1. 원본 충실 복제 (다크 모노톤) → 2. **라이트 모노톤 반전** (흰 배경 + 검은 텍스트)
3. 배경을 **글라스모피즘 픽셀 타일** 그리드로 (참고 이미지: 그린 톤 유리 타일)
4. 커서를 glass-cursor.js(`C:\Users\WD\Downloads\glass-cursor.js`) 참고한 3×3 유리 슬래브로
5. 커서 **UI 전부 제거, 기능(텍스트 치환)만 유지** + 흰 배경에선 타일이 안 보이게 + **컬러 오브**(그린→옐로)가 마우스 추적

### 현재 상태
- 페이퍼 화이트 배경, 유체 램프는 밝은 회색까지만 (가장 짙은 톤 0.80)
- 타일 가시성 = `str = length(white - tileColor) * 2.4` → 순백에선 그리드 소멸, 오브/회색 유체가 지나갈 때만 표면화
- 그린→옐로 코어 오브가 커서를 관성(0.035)으로 추적, 타일 뒤에서 발광
- 보이지 않는 치환 존(관성 0.055, 속도 스트레치): "We are a brand of collective creativity" ⇄ 일본어(私たちは集合的な創造性を持つブランドです) + 회색 고스트 에코
- 헤더(monopo | london, 2열 네비, 런던/도쿄/뉴욕 라이브 시계), 하단 3열 캡션, 스크롤 화살표, 링 배지, 로더 → 리빌

### 튜닝 포인트 (셰이더 내)
| 항목 | 위치 |
|---|---|
| 타일 크기 | `uTile` 계산식: `clientWidth/14`, 64~118px 클램프 |
| 타일 가시성 감도 | `str = clamp(length(vec3(1.0)-tcol) * 2.4, ...)` |
| 오브 색/크기 | `vec3(0.46,0.80,0.22)` 외곽, `vec3(0.93,0.95,0.28)` 코어 / 가우시안 반경 `0.17`, `0.075` |
| 치환 존 크기 | `H = uLensR * 1.12` (uLensR = 화면폭 5.3%) |
| 스트레치 | JS: `0.0022` 강도, `0.16` 상한 (glass-cursor.js와 동일) |

## 2. monopo-vn-study.html — monopo.vn 베이스 + 효과 이식

원본: https://monopo.vn/ (monopo saigon)

### ⚠️ 원본 사이트 현재 깨짐
monopo.vn은 **polyfill.io**(2024년 서비스 중단된 CDN)를 블로킹 스크립트로 로드해서
요청이 영원히 pending → Nuxt 앱이 마운트 안 됨. 디자인 레퍼런스는
**Wayback Machine 2024-01-29 스냅샷**(`web.archive.org/web/20240129085054/https://monopo.vn/`)으로 확인함.

### 베이스 (원본 재현)
- 웜 블랙(#0b0a09) + 중앙 "hello sa*i*gon" ('i'만 이탤릭, Roobert → Inter Tight 대체)
- 시그니처 **오렌지→틸 크레센트 오로라** (fbm 워프, 큰 lobe − 오프셋 carve = 아크 형태, 각도 기반 색 매핑)
- 헤더: 로고 + 언어 스위처 EN VN 中文 / 하단 이중언어 캡션(United, Unbound / Hội tụ, Không giới hạn 등) / 중앙 스크롤 화살표

### 이식된 효과
- 글라스 픽셀 타일: `str = length(tcol - BASE) * 2.2` — 검은 베이스에선 소멸, 오로라 색이 닿는 곳만 표면화
- 오로라 자체가 컬러 오브 역할 (커서 추적, 관성 0.03)
- 치환 존: "hello saigon" ⇄ "xin chào sà*i* gòn" (베트남어, 이탤릭 유지)

## 공통 구현 노트

- **구조**: 전부 `<style>` + `<script>` 인라인. 셰이더 `FRAG` 문자열 안에 배경/타일/치환 로직이 모두 있음.
  텍스트는 2D 캔버스에 그려 `texEn`/`texJp(Vn)` 텍스처로 업로드 (fonts.ready 후 재업로드).
- **폰트**: Inter Tight(+ Noto Sans JP / 베트남어 서브셋). Roobert(상용)의 무료 대체.
- **리빌은 시간 기반** (`(now - revealAt)/1100`) — 프레임 카운트 기반이면 탭이 가려졌을 때 멈춰서 바꿨음.
- **숨은 탭 주의**: 크롬 창이 완전히 가려지면 rAF가 멈춤 → 애니메이션 정지처럼 보임. 버그 아님.
  디버그용 핸들 `window.__mono` (reveal 값, lens 좌표) 노출돼 있음.
- 타일 SDF: `rrect()` 라운디드 렉트, 줄눈 4.5%, 코너 20%. 렌즈 존도 같은 SDF 사용.

## 다음 작업 아이디어
- 두 스터디에 SIRIAI 팔레트/카피 적용 변주
- 치환 존에 한국어 레이어 추가 (3개 언어 로테이션)
- 타일 개별 등장 애니메이션 (오브 접근 시 스케일 팝)
- 모바일 터치 대응 (현재 pointermove만)
