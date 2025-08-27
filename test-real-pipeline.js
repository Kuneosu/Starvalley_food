#!/usr/bin/env node

import { analyzeMenuImage } from './backend/analyzer.js';
import { uploadToGitHub } from './backend/uploader.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

async function testRealPipeline() {
  try {
    console.log(chalk.blue('🧪 실제 OpenAI 메뉴 분석 테스트\n'));
    
    // 공개적으로 접근 가능한 한국 메뉴 이미지들 테스트
    const testImages = [
      {
        name: '한국 메뉴판 1',
        url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800'
      },
      {
        name: '한국 메뉴판 2', 
        url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800'
      },
      {
        name: '한국 식당 메뉴 3',
        url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'
      }
    ];
    
    for (let i = 0; i < testImages.length; i++) {
      const { name, url } = testImages[i];
      
      console.log(chalk.cyan(`\n${i + 1}️⃣ ${name} 분석 중...`));
      console.log(chalk.gray(`URL: ${url.substring(0, 50)}...`));
      
      try {
        console.time('OpenAI Analysis');
        const menuItems = await analyzeMenuImage(url);
        console.timeEnd('OpenAI Analysis');
        
        console.log(chalk.green(`✅ 분석 완료: ${menuItems.length}개 항목`));
        console.log(chalk.white('📋 추출된 내용:'));
        menuItems.forEach((item, index) => {
          console.log(chalk.white(`   ${index + 1}. ${item}`));
        });
        
        if (menuItems.length > 0 && !menuItems[0].includes('분석할 수 없습니다')) {
          console.log(chalk.yellow(`\n📤 GitHub에 테스트 업로드 중... (test_${i + 1}_250827.json)`));
          
          // 테스트용 특별한 파일명으로 업로드
          const customDate = `test_${i + 1}_250827`;
          const fileUrl = await uploadToGitHub(menuItems, customDate);
          
          console.log(chalk.green(`✅ 업로드 성공: ${fileUrl}`));
        }
        
      } catch (error) {
        console.error(chalk.red(`❌ 분석 실패: ${error.message}`));
      }
      
      // API 레이트 리미트 방지를 위해 잠시 대기
      if (i < testImages.length - 1) {
        console.log(chalk.gray('⏳ API 레이트 리미트 방지를 위해 3초 대기...'));
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log(chalk.green('\n🎉 실제 OpenAI 파이프라인 테스트 완료!'));
    console.log(chalk.cyan('\n💡 이제 다음으로 테스트해보세요:'));
    console.log(chalk.white('   node src/cli.js list'));
    console.log(chalk.white('   node src/cli.js date test_1_250827'));
    
  } catch (error) {
    console.error(chalk.red('❌ 테스트 실패:'), error.message);
  }
}

testRealPipeline();