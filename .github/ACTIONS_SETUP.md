# GitHub Actions 자동화 설정 가이드

## 개요
매일 한국 시간 오전 8시에 자동으로 메뉴를 스크래핑하여 GitHub에 업데이트합니다.

## GitHub Secrets 설정

GitHub Actions가 작동하려면 다음 Secrets를 설정해야 합니다:

### 1. OPENAI_API_KEY 설정

1. GitHub 저장소 페이지로 이동
2. `Settings` → `Secrets and variables` → `Actions` 클릭
3. `New repository secret` 버튼 클릭
4. 다음 정보 입력:
   - **Name**: `OPENAI_API_KEY`
   - **Secret**: 현재 `.env` 파일의 `OPENAI_API_KEY` 값 복사해서 붙여넣기

### 2. GITHUB_TOKEN (자동 제공)

`GITHUB_TOKEN`은 GitHub Actions가 자동으로 제공하므로 별도 설정이 필요 없습니다.

## 실행 스케줄

- **자동 실행**: 월~목요일 한국 시간 오전 8시 (금,토,일 제외)
- **수동 실행**: GitHub 저장소 → `Actions` → `Daily Menu Update` → `Run workflow`

> 주말(금,토,일)에는 자동 실행되지 않습니다. 필요시 수동으로 실행할 수 있습니다.

## 작동 방식

1. **스크래핑**: Puppeteer로 카카오 채널 접속
2. **이미지 분석**: OpenAI Vision API로 메뉴 추출
3. **데이터 저장**: `data/` 폴더에 JSON 파일 생성
4. **자동 커밋**: GitHub Actions가 자동으로 커밋 및 푸시

## 로그 확인

GitHub 저장소 → `Actions` → 실행된 workflow 클릭 → 각 step 로그 확인

## 문제 해결

### Workflow가 실행되지 않는 경우
- Secrets가 올바르게 설정되었는지 확인
- 저장소에 push 권한이 있는지 확인

### 스크래핑 실패
- Actions 로그에서 에러 메시지 확인
- OpenAI API 키가 유효한지 확인
- 카카오 채널 URL이 변경되지 않았는지 확인

## 비용 관리

- **GitHub Actions**: 공개 저장소는 무료
- **OpenAI API**: 사용량에 따른 비용 발생 (gpt-4o-mini 사용)
- **저장소 용량**: 매일 작은 JSON 파일만 추가되므로 문제 없음

## 로컬 실행과의 차이

- **로컬**: macOS Chrome 사용
- **GitHub Actions**: Ubuntu + Puppeteer 번들 Chromium 사용
- 코드가 자동으로 환경을 감지하여 적절한 브라우저를 사용합니다
