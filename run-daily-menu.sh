#!/bin/bash

# Star Valley 구내식당 메뉴 자동 처리 스크립트
# 매일 08:30에 실행되도록 cron에 등록

# 스크립트 디렉토리로 이동
SCRIPT_DIR="/Users/k/Documents/home/DEPLOY/starvalley-food"
cd "$SCRIPT_DIR"

# 로그 파일 설정
LOG_FILE="$SCRIPT_DIR/logs/daily-menu-$(date +%Y%m%d).log"
mkdir -p "$SCRIPT_DIR/logs"

# 실행 시작 로그
echo "" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "  Star Valley 메뉴 처리 자동화 스크립트" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "실행 시작: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "----------------------------------------" >> "$LOG_FILE"

# Node.js 경로 확인 및 설정
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

# 환경 정보 출력
echo "" >> "$LOG_FILE"
echo "[환경 정보]" >> "$LOG_FILE"
echo "- 작업 디렉토리: $SCRIPT_DIR" >> "$LOG_FILE"
echo "- Node.js 버전: $(node --version 2>/dev/null || echo 'Node.js 없음')" >> "$LOG_FILE"
echo "- NPM 버전: $(npm --version 2>/dev/null || echo 'NPM 없음')" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 프로젝트 디렉토리 확인
if [ ! -f "$SCRIPT_DIR/daily-menu-processor-automated.js" ]; then
    echo "❌ daily-menu-processor-automated.js 파일을 찾을 수 없습니다." >> "$LOG_FILE"
    echo "   현재 디렉토리: $(pwd)" >> "$LOG_FILE"
    echo "   종료 시간: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
    exit 1
fi

# 의존성 확인
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "[의존성 관리]" >> "$LOG_FILE"
    echo "📦 node_modules 디렉토리가 없습니다. 의존성 설치 시작..." >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    npm install >> "$LOG_FILE" 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ 의존성 설치 완료" >> "$LOG_FILE"
    else
        echo "❌ 의존성 설치 실패" >> "$LOG_FILE"
        exit 1
    fi
else
    echo "✅ 의존성 확인 완료 (node_modules 존재)" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "  메뉴 처리 프로세스 시작" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# OpenAI 기반 완전 자동화 메뉴 처리 스크립트 실행
node daily-menu-processor-automated.js 2>&1 | while IFS= read -r line; do
    echo "$(date '+%H:%M:%S') | $line" >> "$LOG_FILE"
done
EXIT_CODE=${PIPESTATUS[0]}

echo "" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
if [ $EXIT_CODE -eq 0 ]; then
    echo "  ✅ 메뉴 처리 성공" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    
    # 성공 통계 출력
    echo "" >> "$LOG_FILE"
    echo "[처리 통계]" >> "$LOG_FILE"
    # 로그에서 처리된 날짜 수 추출
    PROCESSED_DATES=$(grep -c "처리 완료" "$LOG_FILE" 2>/dev/null || echo "0")
    echo "- 처리된 날짜 수: $PROCESSED_DATES개" >> "$LOG_FILE"
    
    # 성공 시 macOS 알림 (선택사항)
    if command -v osascript >/dev/null 2>&1; then
        osascript -e 'display notification "메뉴 데이터가 성공적으로 업데이트되었습니다." with title "Star Valley Menu"' 2>&1 | tee -a "$LOG_FILE" || true
    fi
else
    echo "  ❌ 메뉴 처리 실패 (종료 코드: $EXIT_CODE)" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    
    # 실패 원인 분석
    echo "" >> "$LOG_FILE"
    echo "[오류 분석]" >> "$LOG_FILE"
    if grep -q "GitHub" "$LOG_FILE"; then
        echo "- 원인: GitHub API 관련 오류" >> "$LOG_FILE"
    elif grep -q "OpenAI" "$LOG_FILE"; then
        echo "- 원인: OpenAI API 관련 오류" >> "$LOG_FILE"
    elif grep -q "스크래핑" "$LOG_FILE"; then
        echo "- 원인: 웹 스크래핑 오류" >> "$LOG_FILE"
    else
        echo "- 원인: 알 수 없는 오류" >> "$LOG_FILE"
    fi
    
    # 실패 시 macOS 알림 (선택사항)
    if command -v osascript >/dev/null 2>&1; then
        osascript -e 'display notification "메뉴 처리 중 오류가 발생했습니다. 로그를 확인하세요." with title "Star Valley Menu Error"' 2>&1 | tee -a "$LOG_FILE" || true
    fi
fi

echo "" >> "$LOG_FILE"
echo "----------------------------------------" >> "$LOG_FILE"
echo "실행 완료: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"

# 실행 시간 계산 (bash에서 지원하는 경우)
if [ -n "$SECONDS" ]; then
    DURATION=$SECONDS
    echo "총 실행 시간: $((DURATION / 60))분 $((DURATION % 60))초" >> "$LOG_FILE"
fi
echo "========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 오래된 로그 파일 정리 (30일 이전)
echo "[로그 파일 관리]" >> "$LOG_FILE"
OLD_LOGS=$(find "$SCRIPT_DIR/logs" -name "daily-menu-*.log" -mtime +30 2>/dev/null | wc -l)
if [ "$OLD_LOGS" -gt 0 ]; then
    echo "- 30일 이상 된 로그 파일 $OLD_LOGS개 삭제" >> "$LOG_FILE"
    find "$SCRIPT_DIR/logs" -name "daily-menu-*.log" -mtime +30 -delete 2>/dev/null || true
else
    echo "- 삭제할 오래된 로그 파일 없음" >> "$LOG_FILE"
fi
echo "" >> "$LOG_FILE"

exit $EXIT_CODE
