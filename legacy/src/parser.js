import chalk from 'chalk';

export function parseMenu(text) {
  if (!text || text.trim() === '') {
    return chalk.yellow('No menu text extracted from the image');
  }
  
  // Clean up the text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split into lines and filter out empty ones
  const lines = cleanText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return chalk.yellow('No readable menu items found');
  }
  
  // Try to parse structured menu
  const menu = parseStructuredMenu(lines);
  
  if (menu) {
    return menu;
  }
  
  // Fallback: just format the raw text nicely
  return formatRawMenu(lines);
}

function parseStructuredMenu(lines) {
  const menu = {};
  let currentSection = null;
  
  for (const line of lines) {
    const cleanLine = line.replace(/[|*#~\-_=.,:]+/g, '').trim();
    
    // Check if this line is a section header
    const sectionMatch = cleanLine.match(/(조식|중식|석식|아침|점심|저녁)/i);
    
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!menu[currentSection]) {
        menu[currentSection] = [];
      }
    } else if (cleanLine.includes('메뉴') || cleanLine.includes('구내식당') || 
               cleanLine.match(/\d{4}[.\-년]\d{1,2}[.\-월]\d{1,2}/) ||
               cleanLine.match(/\d{1,2}월\s*\d{1,2}일/)) {
      // This is likely a header or date, skip
      continue;
    } else if (currentSection && cleanLine.length > 2 && !cleanLine.match(/^\d+원$/)) {
      // This looks like a menu item (not just a price)
      menu[currentSection].push(cleanLine);
    } else if (!currentSection && cleanLine.length > 3 && 
               !cleanLine.includes('구내식당') && !cleanLine.includes('메뉴')) {
      // If no section found yet, create a default one
      if (!menu['메뉴']) {
        menu['메뉴'] = [];
      }
      menu['메뉴'].push(cleanLine);
    }
  }
  
  // Only return structured format if we found actual sections
  if (Object.keys(menu).length > 1 || 
      (Object.keys(menu).length === 1 && !menu['메뉴'])) {
    
    let formatted = '';
    
    // Order sections logically
    const sectionOrder = ['조식', '아침', '중식', '점심', '석식', '저녁', '메뉴'];
    const orderedSections = sectionOrder.filter(section => 
      menu[section] && menu[section].length > 0
    );
    
    // Add any other sections not in the predefined order
    Object.keys(menu).forEach(section => {
      if (!orderedSections.includes(section) && menu[section].length > 0) {
        orderedSections.push(section);
      }
    });
    
    for (const section of orderedSections) {
      const items = menu[section];
      if (items.length > 0) {
        const sectionIcon = getSectionIcon(section);
        formatted += chalk.cyan(`\n${sectionIcon} ${section}\n`);
        
        items.forEach(item => {
          if (item.trim().length > 0) {
            formatted += chalk.white(`  • ${item}\n`);
          }
        });
      }
    }
    
    return formatted;
  }
  
  return null;
}

function getSectionIcon(section) {
  const icons = {
    '조식': '🌅',
    '아침': '🌅', 
    '중식': '☀️',
    '점심': '☀️',
    '석식': '🌙',
    '저녁': '🌙',
    '메뉴': '🍽️'
  };
  
  return icons[section] || '📋';
}

function formatRawMenu(lines) {
  let formatted = chalk.cyan('\n🍽️ 구내식당 메뉴\n');
  
  for (const line of lines) {
    if (line.length > 2) {
      formatted += chalk.white(`  • ${line}\n`);
    }
  }
  
  return formatted;
}

export function formatDateFromText(text) {
  // Try to extract date information from the text
  const dateMatch = text.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${year}년 ${month}월 ${day}일`;
  }
  
  // Try to find Korean date format
  const koreanDateMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (koreanDateMatch) {
    const [, month, day] = koreanDateMatch;
    return `${month}월 ${day}일`;
  }
  
  return null;
}