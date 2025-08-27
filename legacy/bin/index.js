#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { scrapeMenu } from '../src/scraper.js';
import { extractTextFromImage } from '../src/ocr.js';
import { extractTextWithClientOCR, extractTextWithEnhancedTesseract } from '../src/easyocr.js';
import { extractMenuWithVision, checkOllamaStatus } from '../src/vision.js';
import { hybridOCRAI, processOCRWithAI, checkAIStatus } from '../src/textProcessor.js';
import { parseMenu } from '../src/parser.js';

const program = new Command();

program
  .name('st-food')
  .description('Star Valley cafeteria menu CLI tool')
  .version('1.0.0');

program
  .command('today')
  .description('Get today\'s menu using AI-enhanced processing')
  .option('--ocr', 'Use legacy Tesseract OCR only')
  .option('--easyocr', 'Use enhanced OCR only')
  .option('--advanced-ocr', 'Use advanced client-side OCR only')
  .option('--vision', 'Use LLaVA vision model only')
  .option('--hybrid', 'Use OCR + AI text processing (recommended)')
  .option('--no-ai', 'Skip AI text processing')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🍽️  Fetching Star Valley cafeteria menu...'));
      
      const imageUrl = await scrapeMenu();
      
      let extractedText;
      
      // 하이브리드 모드 (기본 권장)
      if (options.hybrid || (!options.ocr && !options.easyocr && !options.advancedOcr && !options.vision && !options.noAi)) {
        console.log(chalk.cyan('🚀 Using Hybrid OCR + AI processing (recommended)...'));
        extractedText = await hybridOCRAI(imageUrl, extractTextFromImage);
      }
      // 명시적 옵션들
      else if (options.vision) {
        console.log(chalk.yellow('Using LLaVA vision model...'));
        extractedText = await extractMenuWithVision(imageUrl);
      } else if (options.ocr) {
        if (options.noAi) {
          console.log(chalk.yellow('Using legacy OCR only...'));
          extractedText = parseMenu(await extractTextFromImage(imageUrl));
        } else {
          console.log(chalk.cyan('Using legacy OCR + AI processing...'));
          const ocrText = await extractTextFromImage(imageUrl);
          extractedText = await processOCRWithAI(parseMenu(ocrText));
        }
      } else if (options.easyocr) {
        if (options.noAi) {
          console.log(chalk.yellow('Using enhanced OCR only...'));
          extractedText = await extractTextWithEnhancedTesseract(imageUrl);
        } else {
          console.log(chalk.cyan('Using enhanced OCR + AI processing...'));
          const ocrText = await extractTextWithEnhancedTesseract(imageUrl);
          extractedText = await processOCRWithAI(ocrText);
        }
      } else if (options.advancedOcr) {
        if (options.noAi) {
          console.log(chalk.yellow('Using advanced OCR only...'));
          extractedText = await extractTextWithClientOCR(imageUrl);
        } else {
          console.log(chalk.cyan('Using advanced OCR + AI processing...'));
          const ocrText = await extractTextWithClientOCR(imageUrl);
          extractedText = await processOCRWithAI(ocrText);
        }
      } else {
        // 자동 모드: AI 후처리 포함
        const ollamaRunning = await checkOllamaStatus();
        
        if (!ollamaRunning) {
          console.log(chalk.yellow('⚠️  Ollama server not running. Using OCR only mode...'));
          extractedText = parseMenu(await extractTextFromImage(imageUrl));
        } else {
          console.log(chalk.cyan('🚀 Using auto hybrid mode...'));
          extractedText = await hybridOCRAI(imageUrl, extractTextFromImage);
        }
      }
      
      console.log(chalk.green('\n📋 Today\'s Menu:'));
      console.log(extractedText);
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      
      // 에러 발생시 도움말 표시
      if (error.message.includes('Ollama')) {
        console.log(chalk.yellow('\n💡 Tip: Make sure Ollama is installed and running:'));
        console.log(chalk.cyan('  1. Install Ollama: https://ollama.ai'));
        console.log(chalk.cyan('  2. Start server: ollama serve'));
        console.log(chalk.cyan('  3. Pull model: ollama pull llava:7b'));
      }
      
      if (error.message.includes('OCR') || error.message.includes('AI')) {
        console.log(chalk.yellow('\n💡 Available Options:'));
        console.log(chalk.green('  (default)       Hybrid OCR + AI processing'));
        console.log(chalk.cyan('  --hybrid        Explicitly use OCR + AI'));
        console.log(chalk.cyan('  --ocr           Legacy OCR (+ AI if available)'));
        console.log(chalk.cyan('  --vision        LLaVA vision model'));
        console.log(chalk.cyan('  --no-ai         Skip AI text processing'));
      }
      
      process.exit(1);
    }
  });

program
  .command('raw')
  .description('Get raw text extraction for debugging')
  .option('--ocr', 'Force legacy Tesseract OCR')
  .option('--easyocr', 'Force enhanced Tesseract OCR')
  .option('--advanced-ocr', 'Force advanced client-side OCR')
  .option('--vision', 'Force LLaVA vision model')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Extracting raw text from menu image...'));
      
      const imageUrl = await scrapeMenu();
      let extractedText;
      
      if (options.ocr) {
        console.log(chalk.yellow('Using legacy Tesseract OCR...'));
        extractedText = await extractTextFromImage(imageUrl);
      } else if (options.easyocr) {
        console.log(chalk.yellow('Using enhanced Tesseract OCR...'));
        extractedText = await extractTextWithEnhancedTesseract(imageUrl);
      } else if (options.advancedOcr) {
        console.log(chalk.yellow('Using advanced client-side OCR...'));
        extractedText = await extractTextWithClientOCR(imageUrl);
      } else if (options.vision) {
        console.log(chalk.yellow('Using LLaVA vision model...'));
        extractedText = await extractMenuWithVision(imageUrl);
      } else {
        // 기본값: Ollama 사용 가능하면 vision, 아니면 enhanced OCR
        const ollamaRunning = await checkOllamaStatus();
        
        if (ollamaRunning) {
          console.log(chalk.yellow('Auto: Using LLaVA vision model...'));
          extractedText = await extractMenuWithVision(imageUrl);
        } else {
          console.log(chalk.yellow('Auto: Ollama not running, trying enhanced OCR...'));
          
          try {
            extractedText = await extractTextWithEnhancedTesseract(imageUrl);
          } catch (enhancedError) {
            console.log(chalk.yellow('Enhanced OCR failed, using legacy OCR...'));
            extractedText = await extractTextFromImage(imageUrl);
          }
        }
      }
      
      console.log(chalk.yellow('\n📄 Raw Extracted Text:'));
      console.log(extractedText);
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();