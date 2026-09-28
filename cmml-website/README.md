# CMML — Computational Materials and Manufacturing Laboratory

전북대학교 CMML 연구실 홈페이지. 순수 HTML/CSS/JS로 만들어 **GitHub Pages**에 바로 올릴 수 있습니다.
모든 문구·소식·미디어는 `data/` 폴더의 **JSON 파일만 편집**하면 갱신됩니다. HTML은 건드릴 필요가 없습니다.

## 폴더 구조
```
cmml-website/
├─ index.html              ← Home (완성)
├─ css/styles.css          ← 디자인(색·타이포·레이아웃)
├─ js/app.js               ← JSON을 읽어 화면에 렌더링 + 한/영 토글
├─ data/
│  ├─ content.json         ← 모든 텍스트(한·영), 비전, PI, 연락처
│  └─ news.json            ← 연구실 소식
└─ assets/
   ├─ logo.png / logo-nav.png / favicon.png   ← 로고(tif→png 변환본)
   └─ sim/                                     ← 히어로 모자이크용 시뮬레이션 타일(예시)
      ├─ thermal.png  grains.png  dendrite.png
      └─ spinodal.png columnar.png flow.png
```

> 히어로 오른쪽 모자이크와 연구 소개 이미지는 지금은 예시로 생성한 과학 시각화(용융풀·결정립·수지상·스피노달·유동·주상정)입니다. 연구실 실제 렌더가 준비되면 아래 방법으로 한 장씩 교체하세요.

## 콘텐츠 수정 방법

### 1) 문구 바꾸기 — `data/content.json`
모든 텍스트는 `{ "en": "...", "ko": "..." }` 쌍으로 되어 있습니다. 두 언어를 함께 수정하세요.

### 2) 소식 추가 — `data/news.json`
`items` 배열 맨 위에 객체를 하나 추가하면 됩니다(최신순 자동 정렬):
```json
{
  "date": "2026-05-01",
  "tag": { "en": "Award", "ko": "수상" },
  "title": { "en": "…", "ko": "…" },
  "body":  { "en": "…", "ko": "…" },
  "link": "https://example.com"   // 없으면 ""
}
```

### 3) 연구 소개 미디어 교체 — 사진 ↔ 동영상 ↔ 유튜브
`content.json`의 `vision.media`에서 **`type`만 바꾸면** 됩니다. 파일은 `assets/`에 넣고 경로만 지정하세요.

| 넣고 싶은 것 | 설정 |
|---|---|
| 사진 | `"type": "image"`, `"src": "assets/내사진.png"` |
| 동영상(mp4) | `"type": "video"`, `"src": "assets/내영상.mp4"`, `"poster": "assets/썸네일.png"` |
| 유튜브 | `"type": "youtube"`, `"src": "영상ID"` (예: `dQw4w9WgXcQ`) |

동영상은 16:9로 자동 맞춰지고, 사진은 원본 비율대로 표시됩니다.

### 4) 히어로 모자이크(오른쪽 시뮬레이션 이미지) 교체 — `content.json`
`hero.gallery`는 6장의 이미지 배열입니다. 순서대로 **① 좌상단 대형 · ② ③ 우측 소형 · ④ ⑤ 좌측 소형 · ⑥ 우하단 대형**에 배치됩니다.
실제 렌더 이미지를 `assets/sim/`에 넣고 각 항목의 `src`와 `alt`만 바꾸면 됩니다(정사각형에 가까운 이미지가 가장 잘 맞습니다).
```json
{ "src": "assets/sim/내렌더.png", "alt": { "en": "…", "ko": "…" } }
```
`hero.gallery_caption`은 모자이크 아래 한 줄 설명입니다.

## 로컬에서 미리보기
JSON을 `fetch`로 불러오므로 **파일을 더블클릭하면 안 되고** 간단한 서버가 필요합니다:
```bash
cd cmml-website
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## GitHub Pages 배포
1. 새 저장소를 만들고 이 폴더 내용을 업로드(push).
2. 저장소 **Settings → Pages → Source**를 `main` 브랜치 `/ (root)`로 지정.
3. 몇 분 뒤 `https://<아이디>.github.io/<저장소이름>/` 에서 공개됩니다.
4. **나중에 대학 도메인 연결**: `assets` 옆에 `CNAME` 파일(내용: 도메인 한 줄)을 추가하고 Settings → Pages에서 Custom domain 지정.

## 다음에 만들 페이지
`index.html`과 같은 뼈대(네이비 nav/footer + JSON 렌더링)로 이어서 제작합니다:
`people.html · research.html · publications.html · news.html · contact.html`
각각 `data/people.json`, `data/publications.json` 등을 추가해 같은 방식으로 관리합니다.

## 확인해 주세요
- **주소**: `content.json → contact.address`에 전북대 대표 주소를 넣어두었습니다. 학과 건물·호실은 `room` 필드에 채워주세요.
- **PI 약력·대표 논문**: 추후 `content.json`(약력)과 `publications.json`(논문)에 반영하면 됩니다.
- **로고**: 원본이 `.tif`라 웹 표시용 `.png`로 변환해 사용했습니다.
