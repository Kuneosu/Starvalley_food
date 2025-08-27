#!/usr/bin/env node

import { createInterface } from 'readline';
import chalk from 'chalk';
import { processMenu, validateEnvironment } from '../backend/processor.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경변수 로드
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MANUAL_PASSWORD = process.env.MANUAL_PASSWORD || '0070';

/**
 * 비밀번호 입력을 받습니다.
 * @returns {Promise<string>} 입력된 비밀번호
 */
function askPassword() {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // 비밀번호 입력 시 화면에 표시하지 않음
    rl.stdoutMuted = true;
    
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted && stringToWrite.charCodeAt(0) !== 13) {
        rl.output.write('*');
      } else {
        rl.output.write(stringToWrite);
      }
    };
    
    rl.question(chalk.yellow('🔐 수동 실행 비밀번호를 입력하세요: '), (password) => {
      rl.close();
      console.log(); // 새 줄 추가
      resolve(password);
    });
  });
}

/**
 * 메인 함수
 */
async function main() {
  try {
    console.log(chalk.blue('🍽️ Star Valley Food - 수동 실행 모드\n'));
    
    // 환경변수 검증
    const missingEnvs = validateEnvironment();
    if (missingEnvs.length > 0) {
      console.error(chalk.red('❌ 누락된 환경변수들:'));
      missingEnvs.forEach(env => console.error(chalk.red(`   - ${env}`)));
      console.log(chalk.yellow('\n💡 .env 파일을 확인하거나 환경변수를 설정해주세요.'));
      process.exit(1);
    }
    
    // 비밀번호 확인
    const inputPassword = await askPassword();
    
    if (inputPassword !== MANUAL_PASSWORD) {
      console.log(chalk.red('❌ 비밀번호가 올바르지 않습니다.'));
      process.exit(1);
    }
    
    console.log(chalk.green('✅ 비밀번호 확인 완료\n'));
    
    // 실행 확인
    const rl2 = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const confirm = await new Promise((resolve) => {
      rl2.question(chalk.cyan('메뉴 데이터를 처리하시겠습니까? (y/N): '), (answer) => {
        rl2.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
    
    if (!confirm) {
      console.log(chalk.yellow('👋 실행이 취소되었습니다.'));
      process.exit(0);
    }
    
    console.log();
    
    // 메뉴 처리 실행
    const result = await processMenu(true);
    
    console.log('\n' + chalk.green('=' .repeat(50)));
    console.log(chalk.green.bold('🎉 수동 실행 완료!'));
    console.log(chalk.green('=' .repeat(50)));
    console.log(chalk.white(`📊 처리된 메뉴 개수: ${result.menuItems.length}`));
    console.log(chalk.white(`⏱️  총 소요시간: ${(result.duration / 1000).toFixed(2)}초`));
    console.log(chalk.white(`🔗 업로드 URL: ${result.fileUrl}`));
    
    // 처리된 메뉴 표시
    console.log('\n' + chalk.cyan('📋 처리된 메뉴 목록:'));
    result.menuItems.forEach((item, index) => {
      console.log(chalk.white(`   ${index + 1}. ${item}`));
    });
    
  } catch (error) {
    console.error(chalk.red('\n❌ 수동 실행 실패:'), error.message);
    
    // 상세 오류 정보
    if (process.argv.includes('--debug')) {
      console.error(chalk.gray('\n디버그 정보:'));
      console.error(chalk.gray(error.stack));
    } else {
      console.log(chalk.yellow('\n💡 상세한 오류 정보를 보려면 --debug 플래그를 추가하세요.'));
    }
    
    process.exit(1);
  }
}

// 도움말 표시
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(chalk.cyan('Star Valley Food - 수동 실행 스크립트'));
  console.log(chalk.white('\n사용법:'));
  console.log(chalk.white('  node manual/run.js [옵션]'));
  console.log(chalk.white('\n옵션:'));
  console.log(chalk.white('  --help, -h    이 도움말을 표시합니다'));
  console.log(chalk.white('  --debug       상세한 디버그 정보를 표시합니다'));
  console.log(chalk.white('\n설명:'));
  console.log(chalk.cyan('  • 수동으로 메뉴 데이터를 처리하고 GitHub에 업로드합니다'));
  console.log(chalk.cyan('  • 실행하려면 비밀번호(0070)가 필요합니다'));
  console.log(chalk.cyan('  • OpenAI API와 GitHub 토큰이 필요합니다'));
  process.exit(0);
}

// 스크립트 실행
main();