
import * as XLSX from 'xlsx';
import { SalesRow, ProcessedResult, ProcessingStats, CheckStatus } from '../types';

export const parseExcel = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

const getCategory = (code: string): string => {
  switch (code) {
    case '04-6': return '小兒營養素';
    case '04-7': return '成人保健品';
    case '05-1': return '成人奶粉';
    case '05-2': return '成人奶水';
    case '05-3': return '現金-小兒銷售';
    default: return '其他';
  }
};

const generateFileName = (data: SalesRow[]): string => {
  // 1. Find Salesperson: Scan for the first non-empty value
  const salespersonRow = data.find(row => row['業務姓名'] && String(row['業務姓名']).trim() !== '');
  const salesPerson = salespersonRow ? String(salespersonRow['業務姓名']).trim() : '未知業務';

  // 2. Find Month: Extract from the 4th and 5th digits of the original order ID
  const orderRow = data.find(row => row._originalOrderId);
  const orderIdStr = String(orderRow?._originalOrderId || '');
  const month = orderIdStr.length >= 5 ? orderIdStr.substring(3, 5) : 'XX';

  return `${salesPerson}${month}月點數表.xlsx`;
};

// Added excludedProductIds parameter
export const processData = (rawData: any[], excludedProductIds: string[] = []): ProcessedResult => {
  const stats: ProcessingStats = {
    originalCount: rawData.length,
    finalCount: 0,
    removedCount: 0,
    missingCustomerIdCount: 0,
    positiveDebtCount: 0,
    zeroPointsCount: 0,
    zeroPriceCount: 0,
    excludedCategoryCount: 0,
    excludedProductIdCount: 0,
    categoryCounts: {},
  };

  const finalData: SalesRow[] = [];
  // Create a Set for faster lookup
  const excludedIdsSet = new Set(excludedProductIds.map(id => String(id).trim()));

  for (const row of rawData) {
    // 1. Filter: Missing Customer ID
    const customerId = row['客戶編號'];
    if (customerId === undefined || customerId === null || String(customerId).trim() === '') {
      stats.missingCustomerIdCount++;
      continue;
    }

    // 2. Filter: Debt > 0
    if (Number(row['本次欠款'] || 0) > 0) {
      stats.positiveDebtCount++;
      continue;
    }

    // 3. Filter: Points == 0
    const points = Number(row['員工點數'] || row['點數'] || 0);
    if (points === 0) {
      stats.zeroPointsCount++;
      continue;
    }

    // 4. Filter: Price == 0
    const price = Number(row['單價'] || 0);
    if (price === 0) {
      stats.zeroPriceCount++;
      continue;
    }

    // 5. Filter: Category '05-2' AND Unit is '罐' or '瓶'
    const category1 = String(row['品類一'] || '').trim();
    const unit = String(row['單位'] || '').trim();
    if (category1 === '05-2' && (unit === '罐' || unit === '瓶')) {
      stats.excludedCategoryCount++;
      continue;
    }

    // 6. Filter: Specific Product IDs (Pharmacist Points Exclusion)
    const productId = String(row['品項編號'] || '').trim();
    if (excludedIdsSet.has(productId)) {
        stats.excludedProductIdCount++;
        continue;
    }

    // Transformation
    const newCategory = getCategory(category1);
    stats.categoryCounts[newCategory] = (stats.categoryCounts[newCategory] || 0) + 1;

    const orderId = row['單號'];
    const orderIdStr = String(orderId || '');
    const displayDate = orderIdStr.length >= 7 ? orderIdStr.slice(5, 7) : orderIdStr;

    // Flexible column detection for salesperson
    const salesPersonName = row['業務姓名'] || row['業務'] || row['銷售人員'] || row['業務員'] || '';

    finalData.push({
      _id: Math.random().toString(36).substring(2, 9),
      _originalPoints: points,
      _originalOrderId: orderId,
      '檢查': '開發' as CheckStatus,
      '分類': newCategory,
      '日期': displayDate,
      '客戶編號': customerId,
      '品項編號': productId, // Use the trimmed product ID
      '品名': row['品名'],
      '單價': price,
      '數量': Number(row['數量'] || 0),
      '點數': points,
      '業務姓名': salesPersonName,
    });
  }

  stats.finalCount = finalData.length;
  stats.removedCount = stats.originalCount - stats.finalCount;

  // Sorting
  const categoryOrder: Record<string, number> = {
    '小兒營養素': 1, '成人奶粉': 2, '成人奶水': 3, '其他': 4, '成人保健品': 5, '現金-小兒銷售': 6
  };

  finalData.sort((a, b) => {
    const rankA = categoryOrder[a['分類']] || 99;
    const rankB = categoryOrder[b['分類']] || 99;
    if (rankA !== rankB) return rankA - rankB;

    const idA = Number(a._originalOrderId);
    const idB = Number(b._originalOrderId);
    if (!isNaN(idA) && !isNaN(idB)) return idA - idB;
    
    return String(a._originalOrderId).localeCompare(String(b._originalOrderId));
  });

  return { 
    data: finalData, 
    stats,
    suggestedFileName: generateFileName(finalData)
  };
};

export const exportToExcel = (data: SalesRow[], fileName: string) => {
  const workbook = XLSX.utils.book_new();

  const mapToExportRow = (row: SalesRow) => ({
    '分類': row['分類'],
    '日期': row['日期'],
    '客戶編號': row['客戶編號'],
    '品項編號': row['品項編號'],
    '品名': row['品名'],
    '單價': row['單價'],
    '數量': row['數量'],
    '點數': row['點數'],
  });

  const sheets = [
    { name: '開發名單', filter: (row: SalesRow) => row['檢查'] === '開發' },
    { name: '回購名單', filter: (row: SalesRow) => row['檢查'] === '回購' }
  ];

  let hasData = false;

  sheets.forEach(sheet => {
    const sheetData = data.filter(sheet.filter).map(mapToExportRow);
    if (sheetData.length > 0) {
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
      hasData = true;
    }
  });

  if (!hasData) {
     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), '無資料');
  }

  XLSX.writeFile(workbook, fileName);
};
