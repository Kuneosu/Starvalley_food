#!/bin/bash

# Cron 작업 설정 스크립트
# 매일 오전 08:30에 메뉴 처리 스크립트 실행

SCRIPT_PATH="/Users/k/Documents/home/inbox/starvalley-food/run-daily-menu.sh"
CRON_ENTRY="30 8 * * * $SCRIPT_PATH"

echo "🕐 Cron 작업 설정 시작..."

# 현재 crontab 백업
echo "📋 현재 crontab 백업 중..."
crontab -l > crontab_backup_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null || echo "기존 crontab 없음"

# 기존 Star Valley 관련 cron 작업 제거
echo "🧹 기존 Star Valley cron 작업 정리 중..."
(crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH" | grep -v "star.*valley" | grep -v "starvalley") | crontab -

# 새 cron 작업 추가
echo "➕ 새 cron 작업 추가 중..."
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

# 설정 확인
echo "✅ Cron 작업 설정 완료!"
echo ""
echo "📋 현재 설정된 cron 작업:"
crontab -l | grep -E "(star|menu)" || echo "   Star Valley 관련 작업 없음"

echo ""
echo "🎯 설정 내용:"
echo "   • 실행 시간: 매일 오전 08:30"
echo "   • 스크립트: $SCRIPT_PATH"
echo "   • 로그 위치: /Users/k/Documents/home/inbox/starvalley-food/logs/"

echo ""
echo "💡 사용법:"
echo "   • 수동 실행: $SCRIPT_PATH"
echo "   • 로그 확인: tail -f /Users/k/Documents/home/inbox/starvalley-food/logs/daily-menu-\$(date +%Y%m%d).log"
echo "   • Cron 작업 확인: crontab -l"
echo "   • Cron 작업 제거: crontab -e (해당 라인 삭제)"

echo ""
echo "⚠️ 주의사항:"
echo "   • 컴퓨터가 08:30에 켜져 있어야 실행됩니다"
echo "   • macOS에서는 터미널 앱에 자동화 권한이 필요할 수 있습니다"
echo "   • 시스템 환경설정 > 보안 및 개인 정보 보호 > 개인 정보 보호 > 자동화에서 확인하세요"