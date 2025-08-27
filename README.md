# Star Valley Food CLI 3.0

Star Valley 구내식당 메뉴 조회 CLI 도구입니다. Claude Code 기반 로컬 실행 아키텍처로 전환하여 더욱 효율적이고 경제적인 솔루션을 제공합니다.

## 🌟 주요 기능

- **🤖 Claude Code 기반**: Claude의 우수한 이미지 분석 성능 활용
- **📡 실시간 조회**: GitHub에서 실시간 메뉴 데이터 조회
- **🔄 로컬 자동화**: Cron을 이용한 매일 오전 08:30 자동 실행
- **📱 간편한 설치**: `npm install -g starvalley-food` 한 줄로 설치
- **🚀 빠른 실행**: 캐시된 데이터로 1초 이내 조회
- **🗓️ 날짜별 조회**: 과거 메뉴 데이터 조회 가능
- **💰 비용 효율적**: OpenAI API 비용 없이 Claude Max 요금제 활용

## 📦 설치

### npm을 통한 전역 설치 (권장)
```bash
npm install -g starvalley-food
```

## 🍽️ 사용법

### 기본 사용법
```bash
# 오늘의 메뉴 조회
st-food
# 또는
st-food today

# 특정 날짜 메뉴 조회 (YYMMDD 형식)
st-food date 240827

# 사용 가능한 날짜 목록 보기
st-food list

# 연결 상태 확인
st-food status
```

### 고급 옵션
```bash
# JSON 형태로 출력
st-food today --raw

# 상세 정보 없이 메뉴만 출력
st-food today --no-details

# 최근 10개 날짜만 보기
st-food list --limit 10
```

### 별칭 사용
```bash
# 긴 명령어도 지원
starvalley-menu today
```

## 🏗️ 아키텍처

### 로컬 실행 기반 구조
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   사용자 CLI    │───▶│  GitHub API  │───▶│   JSON 데이터   │
│  (npm 패키지)   │    │ (실시간 조회) │    │  (매일 업데이트) │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              ▲
                              │
                    ┌─────────────────┐
                    │  로컬 자동화     │
                    │  (Cron 08:30)   │
                    │ - 이미지 스크래핑│
                    │ - Claude 분석    │
                    │ - 데이터 업로드   │
                    └─────────────────┘
```

### 데이터 플로우
1. **로컬 Cron**: 매일 오전 08:30 자동 실행
2. **이미지 스크래핑**: Star Valley 카카오 채널에서 메뉴 이미지 수집
3. **Claude Code 분석**: 사용자가 Claude Code로 이미지에서 메뉴 텍스트 추출
4. **데이터 저장**: GitHub 저장소에 JSON 형태로 저장
5. **실시간 조회**: 사용자 CLI에서 GitHub API로 실시간 조회

## 🔧 관리자용 설정

### 로컬 환경 설정

1. **환경변수 설정**
```bash
# .env 파일 생성
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=Kuneosu
GITHUB_REPO=Starvalley_food
GITHUB_BRANCH=main
```

2. **Cron 작업 설정**
```bash
# 자동화 스크립트 설정
./setup-cron.sh
```

3. **수동 실행**
```bash
# 메뉴 처리 수동 실행
node daily-menu-processor.js

# 또는 쉘 스크립트로 실행
./run-daily-menu.sh
```

### 주의사항
- 컴퓨터가 매일 오전 08:30에 켜져 있어야 합니다
- macOS에서는 터미널 앱에 자동화 권한이 필요할 수 있습니다
- 시스템 환경설정 > 보안 및 개인 정보 보호 > 개인 정보 보호 > 자동화에서 확인하세요

### 로그 확인
```bash
# 오늘의 로그 확인
tail -f logs/daily-menu-$(date +%Y%m%d).log

# Cron 작업 확인
crontab -l
```

## 📊 성능 및 특징

| 항목 | v2.0 (GitHub Actions) | v3.0 (Local + Claude) |
|------|----------------------|----------------------|
| **설치** | 간단 (`npm install -g`) | 간단 (`npm install -g`) |
| **요구사항** | 인터넷 연결 | 인터넷 + Claude Max |
| **실행 속도** | < 1초 | < 1초 |
| **정확도** | 90%+ (GPT-4o-mini) | 95%+ (Claude) |
| **안정성** | GitHub Actions 의존 | 로컬 환경 제어 |
| **비용** | $0.01/일 | $0 (Claude Max 활용) |

## 🛠️ 개발자 가이드

### 프로젝트 구조
```
starvalley-food/
├── src/                    # npm 패키지 클라이언트 코드
│   ├── cli.js             # CLI 인터페이스
│   ├── client.js          # GitHub API 클라이언트
│   └── index.js           # 패키지 엔트리포인트
├── backend/               # 백엔드 처리 로직
│   ├── scraper.js         # 이미지 스크래핑
│   └── uploader.js        # GitHub 업로드
├── daily-menu-processor.js # 메인 처리 스크립트
├── run-daily-menu.sh      # 자동화 실행 스크립트
├── setup-cron.sh          # Cron 설정 스크립트
├── logs/                  # 실행 로그 디렉토리
└── legacy/                # 이전 버전 코드
```

### 기술 특징
- **Claude Code 활용**: 우수한 이미지 분석 성능과 무료 사용
- **로컬 자동화**: Cron을 이용한 안정적인 스케줄링
- **실시간 조회**: GitHub에서 실시간 데이터 조회

## 🐛 문제 해결

### 일반적인 문제

**메뉴 데이터가 없어요**
```bash
# 연결 상태 확인
st-food status

# 사용 가능한 날짜 확인
st-food list
```

**연결 실패**
- 인터넷 연결 확인
- GitHub 서비스 상태 확인
- 방화벽 설정 확인

**자동화가 작동하지 않아요**
- Cron 작업 확인: `crontab -l`
- 로그 파일 확인: `tail -f logs/daily-menu-$(date +%Y%m%d).log`
- 시스템 권한 확인 (macOS)

**명령어를 찾을 수 없어요**
```bash
# 전역 설치 확인
npm list -g starvalley-food

# 재설치
npm uninstall -g starvalley-food
npm install -g starvalley-food
```

## 📈 로드맵

- [ ] 주간 메뉴 미리보기
- [ ] 알레르기/선호도 필터링
- [ ] 영양정보 표시
- [ ] 모바일 앱 연동
- [ ] 다른 구내식당 지원
- [ ] Claude Code API 자동화 개선

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

**Star Valley Food CLI 3.0** - Claude Code로 더욱 스마트하게! 🍽️🤖