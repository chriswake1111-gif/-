
export type CheckStatus = '開發' | '回購' | '刪除';

export interface SalesRow {
  _id: string;
  _originalPoints: number;
  _originalOrderId: string | number;
  
  '檢查': CheckStatus;
  '分類': string;
  '日期': string;
  '客戶編號': string | number;
  '品項編號': string | number;
  '品名': string;
  '數量': number;
  '點數': number;
  '單價': number;
  '業務姓名'?: string;

  [key: string]: any;
}

export interface ProcessingStats {
  originalCount: number;
  finalCount: number;
  removedCount: number;
  missingCustomerIdCount: number;
  positiveDebtCount: number;
  zeroPointsCount: number;
  zeroPriceCount: number;
  excludedCategoryCount: number;
  excludedProductIdCount: number; // New field for Pharmacist points exclusion
  categoryCounts: Record<string, number>;
}

export interface ProcessedResult {
  data: SalesRow[];
  stats: ProcessingStats;
  suggestedFileName: string;
}
