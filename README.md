# Star Valley Food CLI 2.0

Star Valley 구내식당 메뉴 조회 CLI 도구입니다. OpenAI GPT-4o-mini와 GitHub 기반 클라우드 아키텍처로 설계되었습니다.

## 🌟 주요 기능

- **☁️ 클라우드 기반**: OpenAI GPT-4o-mini로 메뉴 이미지 분석
- **📡 실시간 조회**: GitHub에서 실시간 메뉴 데이터 조회
- **🔄 자동 업데이트**: 매일 오전 8시 GitHub Actions로 자동 업데이트
- **📱 간편한 설치**: `npm install -g starvalley-food` 한 줄로 설치
- **🚀 빠른 실행**: 캐시된 데이터로 1초 이내 조회
- **🗓️ 날짜별 조회**: 과거 메뉴 데이터 조회 가능

## 📦 설치

### npm을 통한 전역 설치 (권장)
```bash
npm install -g starvalley-food
```

### 로컬 실행
```bash
git clone https://github.com/Kuneosu/Starvalley_food.git
cd Starvalley_food
npm install
```

## 🍽️ 사용법

### 기본 사용법
```bash
# 오늘의 메뉴 조회
starvalley-menu
# 또는
starvalley-menu today

# 특정 날짜 메뉴 조회 (YYMMDD 형식)
starvalley-menu date 240827

# 사용 가능한 날짜 목록 보기
starvalley-menu list

# 연결 상태 확인
starvalley-menu status
```

### 고급 옵션
```bash
# JSON 형태로 출력
starvalley-menu today --raw

# 상세 정보 없이 메뉴만 출력
starvalley-menu today --no-details

# 최근 10개 날짜만 보기
starvalley-menu list --limit 10
```

### 별칭 사용
```bash
# 짧은 명령어
sv-menu today
sv-menu date 240827
```

## 🔧 수동 실행 (관리자용)

메뉴 데이터를 수동으로 업데이트하려면:

```bash
# 저장소 클론 후
git clone https://github.com/Kuneosu/Starvalley_food.git
cd Starvalley_food
npm install

# 환경변수 설정 (.env 파일 생성)
cp .env.example .env
# .env 파일에 API 키 설정

# 수동 실행 (비밀번호: 0070)
npm run manual
```

## 🏗️ 아키텍처

### 클라우드 기반 구조
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   사용자 CLI    │───▶│  GitHub API  │───▶│   JSON 데이터   │
│  (npm 패키지)   │    │ (실시간 조회) │    │  (매일 업데이트) │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              ▲
                              │
                    ┌─────────────────┐
                    │ GitHub Actions  │
                    │ (매일 8시 실행)  │
                    │ - 이미지 스크래핑│
                    │ - GPT-4o 분석   │
                    │ - 데이터 업로드  │
                    └─────────────────┘
```

### 데이터 플로우
1. **GitHub Actions**: 매일 오전 8시 자동 실행
2. **이미지 스크래핑**: Star Valley 카카오 채널에서 메뉴 이미지 수집
3. **AI 분석**: GPT-4o-mini로 이미지에서 메뉴 텍스트 추출
4. **데이터 저장**: GitHub 저장소에 JSON 형태로 저장
5. **실시간 조회**: 사용자 CLI에서 GitHub API로 실시간 조회

## 📊 성능 및 특징

| 항목 | Legacy (v1.0) | Cloud (v2.0) |
|------|---------------|--------------|
| **설치** | 복잡 (Ollama + AI모델) | 간단 (`npm install -g`) |
| **요구사항** | 8GB+ RAM, GPU | 인터넷 연결만 |
| **실행 속도** | 4-27초 | < 1초 |
| **정확도** | 82% (하이브리드) | 90%+ (GPT-4o-mini) |
| **범용성** | 고사양 컴퓨터만 | 모든 환경 |
| **유지비용** | 무료 (로컬) | $0.01/일 미만 |

## 🔑 환경 설정 (개발자/관리자용)

GitHub 저장소를 운영하려면 다음 환경변수가 필요합니다:

### GitHub Secrets 설정
```bash
# GitHub 저장소의 Settings > Secrets and variables > Actions에 추가
OPENAI_API_KEY=your_openai_api_key
GITHUB_TOKEN=your_github_personal_access_token
```

### 로컬 개발용 환경변수
```bash
# .env 파일
OPENAI_API_KEY=your_openai_api_key
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=Kuneosu
GITHUB_REPO=Starvalley_food
GITHUB_BRANCH=main
MANUAL_PASSWORD=0070
```

## 🛠️ 개발자 가이드

### 프로젝트 구조
```
starvalley-food/
├── src/              # npm 패키지 클라이언트 코드
│   ├── cli.js        # CLI 인터페이스
│   ├── client.js     # GitHub API 클라이언트
│   └── index.js      # 패키지 엔트리포인트
├── backend/          # 백엔드 처리 로직
│   ├── scraper.js    # 이미지 스크래핑
│   ├── analyzer.js   # OpenAI 분석
│   ├── uploader.js   # GitHub 업로드
│   └── processor.js  # 전체 파이프라인
├── manual/           # 수동 실행 스크립트
├── .github/workflows/ # GitHub Actions 워크플로우
└── legacy/           # 이전 버전 코드
```

### API 사용량
- **OpenAI**: 1일 1회, 이미지 분석 (~$0.005/회)
- **GitHub API**: 무제한 (public repository)
- **총 비용**: 월 $0.15 미만

### 로컬 테스트
```bash
# 패키지 테스트
npm test

# 수동 스크립트 테스트
npm run manual

# 개발 모드 실행
npm run dev
```

## 🐛 문제 해결

### 일반적인 문제

**메뉴 데이터가 없어요**
```bash
# 연결 상태 확인
starvalley-menu status

# 사용 가능한 날짜 확인
starvalley-menu list
```

**연결 실패**
- 인터넷 연결 확인
- GitHub 서비스 상태 확인
- 방화벽 설정 확인

**명령어를 찾을 수 없어요**
```bash
# 전역 설치 확인
npm list -g starvalley-food

# 재설치
npm uninstall -g starvalley-food
npm install -g starvalley-food
```

### 관리자 문제

**GitHub Actions 실패**
- OpenAI API 키 확인
- GitHub 토큰 권한 확인 (Contents: Write)
- 저장소 접근 권한 확인

**수동 실행 실패**
- .env 파일 설정 확인
- 환경변수 로딩 확인
- API 키 유효성 확인

## 📈 로드맵

- [ ] 주간 메뉴 미리보기
- [ ] 알레르기/선호도 필터링
- [ ] 영양정보 표시
- [ ] 모바일 앱 연동
- [ ] 다른 구내식당 지원

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 📞 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/Kuneosu/Starvalley_food/issues)
- **기능 요청**: [GitHub Discussions](https://github.com/Kuneosu/Starvalley_food/discussions)
- **개발자 문의**: [GitHub](https://github.com/Kuneosu)

---

**Star Valley Food CLI 2.0** - 클라우드 기반으로 더욱 편리하게! 🍽️✨