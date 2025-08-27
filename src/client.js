import fetch from 'node-fetch';
import chalk from 'chalk';

/**
 * GitHub에서 메뉴 데이터를 가져옵니다.
 * @param {string} date - 날짜 (YYMMDD 형식, 선택사항)
 * @returns {Promise<Object>} 메뉴 데이터
 */
export async function fetchMenuData(date = null) {
  try {
    const targetDate = date || new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const fileName = `starvalley_food_${targetDate}.json`;
    const baseUrl = 'https://raw.githubusercontent.com/Kuneosu/Starvalley_food/main/data';
    const fileUrl = `${baseUrl}/${fileName}`;
    
    console.log(`📡 데이터 조회 중: ${fileName}`);
    
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        // 오늘 날짜 데이터가 없으면 최근 파일 찾기
        if (!date) {
          console.log('🔍 오늘 데이터가 없습니다. 최근 데이터를 찾는 중...');
          return await findRecentMenuData();
        }
        throw new Error(`${targetDate} 날짜의 메뉴 데이터를 찾을 수 없습니다.`);
      }
      throw new Error(`데이터 조회 실패: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ 데이터 로드 완료: ${data.menu.length}개 메뉴`);
    
    return data;
    
  } catch (error) {
    console.error('❌ 데이터 조회 실패:', error.message);
    throw error;
  }
}

/**
 * 최근 메뉴 데이터를 찾습니다 (GitHub API 사용)
 * @returns {Promise<Object>} 최근 메뉴 데이터
 */
export async function findRecentMenuData() {
  try {
    const apiUrl = 'https://api.github.com/repos/Kuneosu/Starvalley_food/contents/data';
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('GitHub API 조회 실패');
    }
    
    const files = await response.json();
    
    // starvalley_food_*.json 파일들만 필터링하고 날짜순 정렬
    const menuFiles = files
      .filter(file => file.name.match(/^starvalley_food_\d{6}\.json$/))
      .sort((a, b) => b.name.localeCompare(a.name)); // 최신 날짜 순
    
    if (menuFiles.length === 0) {
      throw new Error('메뉴 데이터 파일이 없습니다.');
    }
    
    const latestFile = menuFiles[0];
    console.log(`📅 최근 데이터: ${latestFile.name}`);
    
    // 최근 파일 내용 가져오기
    const fileResponse = await fetch(latestFile.download_url);
    if (!fileResponse.ok) {
      throw new Error('최근 파일 조회 실패');
    }
    
    const data = await fileResponse.json();
    return data;
    
  } catch (error) {
    console.error('❌ 최근 데이터 조회 실패:', error.message);
    throw error;
  }
}

/**
 * 메뉴 데이터를 포맷팅하여 출력합니다.
 * @param {Object} menuData - 메뉴 데이터
 * @param {boolean} showDetails - 상세 정보 표시 여부
 */
export function displayMenu(menuData, showDetails = true) {
  if (!menuData || !menuData.menu) {
    console.log(chalk.red('❌ 유효하지 않은 메뉴 데이터입니다.'));
    return;
  }
  
  // 헤더
  console.log('\n' + chalk.blue('='.repeat(50)));
  console.log(chalk.blue.bold('🍽️  Star Valley 구내식당 메뉴'));
  console.log(chalk.blue('='.repeat(50)));
  
  // 날짜 정보
  if (menuData.date) {
    const date = new Date(menuData.date);
    const koreanDate = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    console.log(chalk.cyan(`📅 ${koreanDate}`));
  }
  
  // 메뉴 목록
  console.log(chalk.green('\n📋 오늘의 메뉴:'));
  menuData.menu.forEach((item, index) => {
    const emoji = getMenuEmoji(item);
    console.log(chalk.white(`   ${emoji} ${item}`));
  });
  
  // 상세 정보
  if (showDetails) {
    console.log(chalk.gray(`\n📊 총 ${menuData.total_items || menuData.menu.length}개 메뉴`));
    
    if (menuData.updated_at) {
      const updateTime = new Date(menuData.updated_at);
      const koreanTime = updateTime.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul'
      });
      console.log(chalk.gray(`🕐 업데이트: ${koreanTime}`));
    }
  }
  
  console.log(chalk.blue('='.repeat(50)) + '\n');
}

/**
 * 메뉴 항목에 맞는 이모지를 반환합니다.
 * @param {string} menuItem - 메뉴 항목
 * @returns {string} 이모지
 */
function getMenuEmoji(menuItem) {
  const item = menuItem.toLowerCase();
  
  if (item.includes('밥')) return '🍚';
  if (item.includes('국') || item.includes('탕') || item.includes('찌개')) return '🍲';
  if (item.includes('김치')) return '🥬';
  if (item.includes('샐러드')) return '🥗';
  if (item.includes('치킨') || item.includes('닭')) return '🍗';
  if (item.includes('고기') || item.includes('불고기')) return '🥩';
  if (item.includes('전') || item.includes('볶음')) return '🍳';
  if (item.includes('나물') || item.includes('야채')) return '🥬';
  if (item.includes('마늘')) return '🧄';
  if (item.includes('면') || item.includes('파스타')) return '🍝';
  
  return '🍽️';
}

/**
 * 사용 가능한 날짜 목록을 조회합니다.
 * @returns {Promise<Array<string>>} 날짜 목록 (YYMMDD 형식)
 */
export async function getAvailableDates() {
  try {
    const apiUrl = 'https://api.github.com/repos/Kuneosu/Starvalley_food/contents/data';
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('GitHub API 조회 실패');
    }
    
    const files = await response.json();
    
    // 날짜 추출 및 정렬
    const dates = files
      .filter(file => file.name.match(/^starvalley_food_(\d{6})\.json$/))
      .map(file => file.name.match(/starvalley_food_(\d{6})\.json/)[1])
      .sort((a, b) => b.localeCompare(a)); // 최신 날짜 순
    
    return dates;
    
  } catch (error) {
    console.error('❌ 날짜 목록 조회 실패:', error.message);
    return [];
  }
}

/**
 * 연결 상태를 확인합니다.
 * @returns {Promise<boolean>} 연결 상태
 */
export async function checkConnection() {
  try {
    const response = await fetch('https://api.github.com/repos/Kuneosu/Starvalley_food', {
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}