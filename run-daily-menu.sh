#!/bin/bash

# Star Valley 구내식당 메뉴 자동 처리 스크립트
# 매일 08:30에 실행되도록 cron에 등록

# 스크립트 디렉토리로 이동
SCRIPT_DIR="/Users/k/Documents/home/inbox/starvalley-food"
cd "$SCRIPT_DIR"

# 로그 파일 설정
LOG_FILE="$SCRIPT_DIR/logs/daily-menu-$(date +%Y%m%d).log"
mkdir -p "$SCRIPT_DIR/logs"

# 실행 시작 로그
echo "========================================" >> "$LOG_FILE"
echo "실행 시작: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Node.js 경로 확인 및 설정
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

# 프로젝트 디렉토리 확인
if [ ! -f "$SCRIPT_DIR/daily-menu-processor.js" ]; then
    echo "❌ daily-menu-processor.js 파일을 찾을 수 없습니다." >> "$LOG_FILE"
    echo "현재 디렉토리: $(pwd)" >> "$LOG_FILE"
    exit 1
fi

# 의존성 확인
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "📦 의존성 설치 중..." >> "$LOG_FILE"
    npm install >> "$LOG_FILE" 2>&1
fi

echo "🍽️ 메뉴 처리 시작..." >> "$LOG_FILE"

# 메뉴 처리 스크립트 실행
node daily-menu-processor.js >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ 메뉴 처리 성공" >> "$LOG_FILE"
    
    # 성공 시 macOS 알림 (선택사항)
    if command -v osascript >/dev/null 2>&1; then
        osascript -e 'display notification "메뉴 데이터가 성공적으로 업데이트되었습니다." with title "Star Valley Menu"' >> "$LOG_FILE" 2>&1 || true
    fi
else
    echo "❌ 메뉴 처리 실패 (종료 코드: $EXIT_CODE)" >> "$LOG_FILE"
    
    # 실패 시 macOS 알림 (선택사항)
    if command -v osascript >/dev/null 2>&1; then
        osascript -e 'display notification "메뉴 처리 중 오류가 발생했습니다." with title "Star Valley Menu Error"' >> "$LOG_FILE" 2>&1 || true
    fi
fi

echo "실행 완료: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 오래된 로그 파일 정리 (30일 이전)
find "$SCRIPT_DIR/logs" -name "daily-menu-*.log" -mtime +30 -delete 2>/dev/null || true

exit $EXIT_CODE