#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import clipboardy from 'clipboardy';
import { fetchMenuData, displayMenu, getAvailableDates, checkConnection } from './client.js';

const program = new Command();

program
  .name('st-food')
  .description('Star Valley 구내식당 메뉴 조회 CLI')
  .version('3.4.2');

program
  .command('today')
  .description('오늘의 메뉴를 조회합니다')
  .option('--no-details', '상세 정보 숨기기')
  .option('--raw', 'JSON 형태로 출력')
  .action(async (options) => {
    const spinner = ora('메뉴 데이터 조회 중...').start();
    
    try {
      const menuData = await fetchMenuData();
      spinner.stop();
      
      if (options.raw) {
        console.log(JSON.stringify(menuData, null, 2));
      } else {
        displayMenu(menuData, options.details);
      }
      
    } catch (error) {
      spinner.fail('메뉴 조회 실패');
      console.error(chalk.red(`❌ ${error.message}`));
      
      // 연결 문제인지 확인
      const isConnected = await checkConnection();
      if (!isConnected) {
        console.log(chalk.yellow('🌐 인터넷 연결을 확인해주세요.'));
      }
      
      process.exit(1);
    }
  });

program
  .command('next')
  .description('내일의 메뉴를 조회합니다')
  .option('--no-details', '상세 정보 숨기기')
  .option('--raw', 'JSON 형태로 출력')
  .action(async (options) => {
    const spinner = ora('내일 메뉴 데이터 조회 중...').start();
    
    try {
      // 내일 날짜 계산 (로컬 시간 기준)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear().toString().slice(2);
      const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
      const day = tomorrow.getDate().toString().padStart(2, '0');
      const tomorrowDate = year + month + day;
      
      const menuData = await fetchMenuData(tomorrowDate);
      spinner.stop();
      
      if (options.raw) {
        console.log(JSON.stringify(menuData, null, 2));
      } else {
        console.log(chalk.blue('📅 내일 메뉴'));
        displayMenu(menuData, options.details);
      }
      
    } catch (error) {
      spinner.fail('내일 메뉴 조회 실패');
      
      if (error.message.includes('찾을 수 없습니다')) {
        console.log(chalk.yellow('📅 아직 내일 식단표가 업데이트되지 않았습니다.'));
        console.log(chalk.gray('💡 보통 오전 4~5시경에 업데이트됩니다.'));
      } else {
        console.error(chalk.red(`❌ ${error.message}`));
      }
      
      process.exit(1);
    }
  });

program
  .command('date <date>')
  .description('특정 날짜의 메뉴를 조회합니다 (YYMMDD 형식)')
  .option('--no-details', '상세 정보 숨기기')
  .option('--raw', 'JSON 형태로 출력')
  .action(async (date, options) => {
    // 날짜 형식 검증
    if (!/^\d{6}$/.test(date)) {
      console.error(chalk.red('❌ 날짜는 YYMMDD 형식으로 입력해주세요. (예: 240827)'));
      process.exit(1);
    }
    
    const spinner = ora(`${date} 메뉴 데이터 조회 중...`).start();
    
    try {
      const menuData = await fetchMenuData(date);
      spinner.stop();
      
      if (options.raw) {
        console.log(JSON.stringify(menuData, null, 2));
      } else {
        displayMenu(menuData, options.details);
      }
      
    } catch (error) {
      spinner.fail('메뉴 조회 실패');
      console.error(chalk.red(`❌ ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('copy')
  .description('오늘의 메뉴를 클립보드에 복사합니다')
  .option('--simple', '간단한 형식으로 복사')
  .action(async (options) => {
    const spinner = ora('메뉴 데이터 조회 중...').start();
    
    try {
      const menuData = await fetchMenuData();
      spinner.stop();
      
      let copyText = '';
      
      if (options.simple) {
        // 간단한 형식
        copyText = `📅 ${menuData.date || '오늘의 메뉴'}\n\n`;
        copyText += menuData.menuItems.join('\n');
      } else {
        // 전체 형식
        copyText = `🍽️ Star Valley 구내식당 메뉴\n`;
        copyText += `${'='.repeat(40)}\n`;
        copyText += `📅 ${menuData.date || '오늘의 메뉴'}\n\n`;
        copyText += '📋 메뉴:\n';
        menuData.menuItems.forEach(item => {
          copyText += `• ${item}\n`;
        });
        copyText += `\n총 ${menuData.count || menuData.menuItems.length}개 메뉴`;
        if (menuData.timestamp) {
          copyText += `\n업데이트: ${menuData.timestamp}`;
        }
      }
      
      // 클립보드에 복사
      await clipboardy.write(copyText);
      
      console.log(chalk.green('✅ 메뉴가 클립보드에 복사되었습니다!'));
      
      // 복사된 내용 미리보기
      console.log(chalk.gray('\n📋 복사된 내용:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(copyText);
      console.log(chalk.gray('─'.repeat(40)));
      
    } catch (error) {
      spinner.fail('메뉴 조회 실패');
      console.error(chalk.red(`❌ ${error.message}`));
      
      // 연결 문제인지 확인
      const isConnected = await checkConnection();
      if (!isConnected) {
        console.log(chalk.yellow('🌐 인터넷 연결을 확인해주세요.'));
      }
      
      process.exit(1);
    }
  });

program
  .command('list')
  .description('사용 가능한 날짜 목록을 표시합니다')
  .option('--limit <number>', '표시할 개수 제한', '10')
  .action(async (options) => {
    const spinner = ora('날짜 목록 조회 중...').start();
    
    try {
      const dates = await getAvailableDates();
      spinner.stop();
      
      if (dates.length === 0) {
        console.log(chalk.yellow('📅 사용 가능한 메뉴 데이터가 없습니다.'));
        return;
      }
      
      const limit = parseInt(options.limit) || 10;
      const displayDates = dates.slice(0, limit);
      
      console.log(chalk.blue('\n📅 사용 가능한 날짜 목록:'));
      console.log(chalk.blue('='.repeat(30)));
      
      displayDates.forEach((date, index) => {
        // YYMMDD를 읽기 쉬운 형식으로 변환
        const year = `20${date.slice(0, 2)}`;
        const month = date.slice(2, 4);
        const day = date.slice(4, 6);
        const formattedDate = `${year}-${month}-${day}`;
        
        try {
          const dateObj = new Date(year, parseInt(month) - 1, parseInt(day));
          const weekday = dateObj.toLocaleDateString('ko-KR', { weekday: 'short' });
          
          console.log(chalk.white(`   ${index + 1}. ${date} (${formattedDate}, ${weekday})`));
        } catch (error) {
          console.log(chalk.white(`   ${index + 1}. ${date} (${formattedDate})`));
        }
      });
      
      if (dates.length > limit) {
        console.log(chalk.gray(`\n   ... 그리고 ${dates.length - limit}개 더`));
        console.log(chalk.gray(`   전체 목록을 보려면 --limit ${dates.length} 옵션을 사용하세요.`));
      }
      
      console.log(chalk.blue('='.repeat(30)));
      console.log(chalk.cyan(`\n💡 사용법: st-food date <YYMMDD>`));
      console.log(chalk.cyan(`   예시: st-food date ${dates[0]}`));
      
    } catch (error) {
      spinner.fail('목록 조회 실패');
      console.error(chalk.red(`❌ ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('서비스 연결 상태를 확인합니다')
  .action(async () => {
    const spinner = ora('연결 상태 확인 중...').start();
    
    try {
      const isConnected = await checkConnection();
      spinner.stop();
      
      if (isConnected) {
        console.log(chalk.green('✅ GitHub 데이터 저장소 연결 정상'));
        
        // 최근 데이터 확인
        try {
          const menuData = await fetchMenuData();
          
          console.log(chalk.green(`📊 최근 데이터: ${menuData.menuItems.length}개 메뉴`));
          if (menuData.timestamp) {
            console.log(chalk.green(`🕐 마지막 업데이트: ${menuData.timestamp}`));
          }
          
        } catch (error) {
          console.log(chalk.yellow('⚠️ 최근 메뉴 데이터 확인 실패'));
        }
        
      } else {
        console.log(chalk.red('❌ 연결 실패'));
        console.log(chalk.yellow('🌐 인터넷 연결을 확인하거나 나중에 다시 시도해주세요.'));
      }
      
    } catch (error) {
      spinner.fail('상태 확인 실패');
      console.error(chalk.red(`❌ ${error.message}`));
      process.exit(1);
    }
  });

// 기본 명령어 (today와 동일)
program
  .action(async () => {
    console.log(chalk.cyan('🍽️ Star Valley 구내식당 메뉴 CLI\n'));
    
    const spinner = ora('오늘의 메뉴 조회 중...').start();
    
    try {
      const menuData = await fetchMenuData();
      spinner.stop();
      displayMenu(menuData, true);
      
    } catch (error) {
      spinner.fail('메뉴 조회 실패');
      console.error(chalk.red(`❌ ${error.message}`));
      
      console.log(chalk.yellow('\n💡 사용 가능한 명령어:'));
      console.log(chalk.white('  st-food today     - 오늘의 메뉴'));
      console.log(chalk.white('  st-food list      - 날짜 목록'));
      console.log(chalk.white('  st-food status    - 연결 상태'));
      console.log(chalk.white('  st-food --help    - 도움말'));
      
      process.exit(1);
    }
  });

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ 예상치 못한 오류:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ 처리되지 않은 Promise 거부:'), reason);
  process.exit(1);
});

program.parse();