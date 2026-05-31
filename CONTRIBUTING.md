# Contributing to DreamCat Marketing

> dreamcat.app 정적 사이트 (Astro) 협업 규칙.

---

## 🌳 브랜치 전략

`main` 은 production 배포 브랜치. 직접 push 금지 (보호 켜져 있음).

### 브랜치 이름

| 접두사 | 용도 |
|---|---|
| `feature/` | 새 페이지 / 섹션 |
| `fix/` | 버그 / 오타 / 깨진 링크 |
| `chore/` | 디펜던시 / 빌드 도구 |
| `docs/` | 문서 (privacy/terms 본문 등) |
| `i18n/` | 번역 추가/수정 |

---

## 💬 커밋 메시지

DreamCat 앱 repo 와 동일한 [Conventional Commits](https://www.conventionalcommits.org/) 규칙.

```
<type>: <짧은 설명>

<선택: 본문>
```

### 좋은 예

```
feat: 랜딩 페이지 App Store 다운로드 배지 추가
fix: privacy 페이지 일본어 번역 typo
docs: terms 의 환불 조항 명확화
i18n: zh-TW privacy 페이지 농력 표기 수정
```

---

## 🔄 워크플로우

```bash
git checkout main
git pull --rebase origin main
git checkout -b feature/xxx

# 작업 (npm run dev 로 localhost:4321 에서 확인)
npm run dev

# 빌드 검증
npm run build

git add . && git commit -m "feat: ..."
git push origin feature/xxx
gh pr create --fill
```

---

## 🚀 배포

PR 머지 → main → **Cloudflare Workers Builds 자동 빌드/배포** (1-3분).

수동 배포 불필요. 별도 wrangler 명령 안 써도 됨.

---

## 🧪 PR 통과 기준

- [ ] `npm run build` 통과 (빌드 에러 X)
- [ ] 로컬 `npm run dev` 에서 시각 확인
- [ ] 다국어 페이지 변경 시 4개 언어 (ko/en/ja/zh-TW) 토글 확인
- [ ] 외부 링크 깨지지 않음
- [ ] 모바일 / 데스크탑 반응형 확인

---

## ⚠️ 금기

- `main` 직접 push
- `dist/` 폴더 commit (gitignore)
- `node_modules/` commit
- API 키 / secret 을 코드에 inline (정적 사이트라 어차피 노출됨)

---

## 🔗 앱 repo 와의 연결점

마케팅 사이트가 변경되어 앱과 연결성 영향 받는 경우:

| 마케팅 변경 | 앱 영향 |
|---|---|
| privacy/terms URL 구조 변경 | 앱의 외부 링크 + App Store 메타데이터 갱신 필요 |
| 랜딩 페이지에서 가격 표기 변경 | 앱의 `pricing.ts` + `APP_STORE_METADATA.md` 동기화 필요 |
| 도메인 변경 | Supabase Auth callback URL 도 같이 변경 |

큰 변경 전 앱 담당자에게 슬랙/이슈로 사전 공유.

---

## 📚 참고

- 앱 repo: https://github.com/neouzu/DreamCat
- 배포 도메인: https://dreamcat.app (Cloudflare)
- Astro 문서: https://docs.astro.build

PR / Issue 환영.
