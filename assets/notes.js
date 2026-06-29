/* notes.js — design rationale content for each concept */
window.SIRIAI = window.SIRIAI || {};
window.SIRIAI.NOTES = {
  aperture: {
    idx: 'I',
    kicker: 'Concept I',
    title: 'Aperture',
    rec: false,
    mood: '어둠 속에서 조리개가 열리듯, 단 하나의 따뜻한 광원이 호흡한다. 관측·렌즈·"어둠 속에서 눈을 뜨는" 시네마틱 무드.',
    blocks: [
      ['Choreography / 모션 안무', '순수한 암전에서 시작 → <b>2.6s 동안 조리개가 부드럽게 열리며</b> 장면이 드러난다 → 광원이 9초 주기로 호흡(scale·opacity sine) → 타이포가 블러에서 풀려나며 떠오른다. 메시지 4단이 <b>천천히 순환</b>(첫 단 6.4s, 이후 4.6s 크로스페이드).'],
      ['Depth / 깊이 연출', '광원 헤일로(blur 28px, screen blend) · 미세 그레인(overlay) · 라디얼 비네팅으로 가장자리를 눌러 중앙으로 시선 유도. 포인터에 따라 코어와 타이포가 서로 다른 깊이로 패럴랙스(26px / 12px).'],
      ['Typography', 'Cormorant Garamond 디스플레이(이탤릭 강조), clamp로 48→132px. 모노 아이브로우(letter-spacing 0.42em)가 "smart/precise" 톤을 잡는다.'],
      ['Object', '핵심 오브젝트 1개 = <b>조리개 = 광원</b>. 장식 없는 단일 빛. Gemini식 절제.'],
      ['근거', '신비주의(어둠→개방) · 느림(긴 이징·호흡) · 스마트(정밀 모노·그리드). monopo의 "어둠에서 떠오름"을 렌즈/조리개 은유로 번역.'],
    ],
  },
  horizon: {
    idx: 'II',
    kicker: 'Concept II',
    title: 'Horizon',
    rec: true,
    mood: '암흑의 지평선에 한 줄기 빛이 그어진다 — 문틈의 빛, 동트기 직전. 빛이 차오르며 스크롤과 함께 흰 본문으로 "범람"한다.',
    blocks: [
      ['Choreography / 모션 안무', '얇은 빛의 선이 <b>좌우로 그어지고</b>(scaleX) → 위로 천천히 블룸 → 타이포가 그 위 어둠에서 떠오른다 → 스크롤하면 <b>지평선이 차올라 화면을 빛으로 채우고</b> 그대로 흰 본문으로 전환된다.'],
      ['Depth / 깊이 연출', '대기 그라데이션(상단 암흑 → 지평선 근처 앰버) · 빛 선의 블룸 · 미세 그레인 · 타이포와 지평선의 패럴랙스로 공간의 층위를 만든다.'],
      ['Typography', 'Cormorant Garamond 디스플레이가 지평선 위 어둠에 떠 있다. 빛이 차오를수록 텍스트는 어둠과 함께 위로 빠져나간다.'],
      ['Object', '핵심 오브젝트 1개 = <b>지평선의 광원</b>. 가장 밝은 한 점이 호흡한다. 동시에 다크→화이트 전환 장치.'],
      ['근거 / 추천 이유', '신비(문틈의 빛) · 느림(차오르는 호흡) · 스마트(절제). <b>다크 히어로 → 흰 본문</b>이라는 §6 제약을 모션 그 자체로 해결 — 그래서 추천.'],
    ],
  },
  eclipse: {
    idx: 'III',
    kicker: 'Concept III',
    title: 'Eclipse',
    rec: false,
    mood: '빛의 핵은 검은 원에 가려지고, 테두리로 코로나만 새어 나온다. 다 보여주지 않는 긴장 — 가장 신비로운 결.',
    blocks: [
      ['Choreography / 모션 안무', '가려진 코어 둘레로 <b>밝은 하이라이트가 천천히 한 바퀴 돈다</b>(conic 회전, 약 24s) → 코로나가 호흡 → 희미한 렌즈 플레어 줄기가 화면을 가로질러 흐른다. 타이포는 옆에서 조용히 페이드인.'],
      ['Depth / 깊이 연출', '가리는 원반이 빛 위에 겹쳐 강한 figure/ground 깊이를 만든다 · 코로나 블룸 · 플레어 줄기의 패럴랙스 · 그레인. 평면이 아닌 천체적 공간감.'],
      ['Typography', '좌측 정렬 디스플레이로 오브젝트와 균형. 모노 캡션이 좌표처럼 떠 있어 "관측" 메타포 강화.'],
      ['Object', '핵심 오브젝트 1개 = <b>가려진 광원(일식)</b>. 핵을 감추고 코로나만 — "즉시 다 보여주지 않는" §3 긴장.'],
      ['근거', '신비주의를 가장 직접적으로 — 핵을 숨긴다. 느림(도는 하이라이트) · 스마트(천체 좌표 캡션). 절제된 단일 오브젝트.'],
    ],
  },
  full: {
    idx: 'IV',
    kicker: 'Full Page',
    title: 'Horizon, end to end',
    rec: true,
    mood: '추천안(Horizon)을 다크 히어로 → 흰색 본문까지 이은 압축 풀페이지. §7 카피 그대로, 1~3 화면의 복합 경험.',
    blocks: [
      ['Flow / 구성', '<b>Hero(다크)</b> → 01 Stance → 02 Methodology → 03 System(다크 변주) → 05 Voice(+32%) → 04 Clients → 06 Contact → 워드마크 푸터. 긴 스크롤 대신 밀도 있는 섹션.'],
      ['Dark ↔ White', '히어로의 차오르는 빛이 그대로 흰 본문으로 전환. 03 System만 다크로 한 번 더 잠수했다가 다시 떠오르는 리듬.'],
      ['Detail points', 'pill 버튼 · 앰버 불렛 · 모노 섹션 라벨 · 워드마크(Playfair) 풀폭 푸터. 디자인 포인트는 디테일에서.'],
      ['근거', 'twelvelabs/gemini의 밝고 명료한 본문 + monopo의 다크 히어로를, 하나의 빛이 잇는다.'],
    ],
  },
};
