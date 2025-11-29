
import React, { useState, useMemo } from 'react';
import { SalesRow, CheckStatus } from '../types';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calculator } from 'lucide-react';

interface DataTableProps {
  data: SalesRow[];
  onStatusChange: (id: string, newStatus: CheckStatus) => void;
  visibleColumns?: string[];
  variant?: 'default' | 'popup';
}

const ITEMS_PER_PAGE = 50;

const DataTable: React.FC<DataTableProps> = ({ 
    data, 
    onStatusChange, 
    visibleColumns,
    variant = 'default'
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  }, [data, currentPage]);

  const totalPoints = useMemo(() => {
    return data.reduce((sum, row) => sum + (row['點數'] || 0), 0);
  }, [data]);

  const allColumns = ['分類', '日期', '客戶編號', '品項編號', '品名', '單價', '數量', '點數'];
  const displayColumns = visibleColumns 
    ? allColumns.filter(col => visibleColumns.includes(col)) 
    : allColumns;

  const getStatusColor = (status: CheckStatus) => {
    switch (status) {
      case '開發': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case '回購': return 'text-blue-600 bg-blue-50 border-blue-200';
      case '刪除': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600';
    }
  };

  const isPopup = variant === 'popup';
  const containerHeightClass = isPopup ? 'h-full' : 'h-[650px]';
  const headerPaddingClass = isPopup ? 'p-3' : 'p-4';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${containerHeightClass}`}>
      <div className={`${headerPaddingClass} border-b border-slate-200 bg-slate-50 flex flex-wrap gap-x-3 gap-y-2 justify-between items-center shrink-0`}>
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
            <h3 className="font-semibold text-slate-700 whitespace-nowrap truncate">
                {isPopup ? '快速檢查' : '資料預覽與編輯'}
            </h3>
            
            <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium whitespace-nowrap border border-indigo-200">
                    {data.length} 筆
                </span>
                
                {/* Distinct styling for Total Points in Popup */}
                <span className={`
                    flex items-center font-bold whitespace-nowrap rounded-full border transition-all
                    ${isPopup 
                        ? 'px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent shadow-md ring-2 ring-amber-100' 
                        : 'px-2.5 py-1 bg-amber-100 text-amber-800 border-amber-200 text-xs shadow-sm'
                    }
                `}>
                    <Calculator size={isPopup ? 18 : 12} className={isPopup ? "mr-2 text-amber-100" : "mr-1.5"} />
                    {isPopup ? '預估點數：' : '點數: '}
                    <span className={isPopup ? "text-lg ml-1 font-mono tracking-tight" : ""}>
                        {totalPoints.toLocaleString()}
                    </span>
                </span>
            </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-auto shrink-0">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors">
                <ChevronsLeft size={18} />
            </button>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors">
                <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-slate-600 font-medium px-2 whitespace-nowrap select-none min-w-[3rem] text-center">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors">
                <ChevronRight size={18} />
            </button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors">
                <ChevronsRight size={18} />
            </button>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 w-full">
        <table className="w-full text-sm text-left text-slate-600 relative">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-4 py-3 font-semibold border-b border-slate-200 w-12 text-center">#</th>
              <th className="px-4 py-3 font-semibold border-b border-slate-200 w-32">檢查狀態</th>
              {displayColumns.map((col) => (
                <th key={col} className={`px-4 py-3 font-semibold border-b border-slate-200 whitespace-nowrap ${col === '分類' ? 'text-indigo-700 bg-indigo-50/50' : ''}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => {
                const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                return (
                    <tr key={row._id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400 text-xs text-center">{globalIndex}</td>
                        <td className="px-4 py-3">
                            <select 
                                value={row['檢查']} 
                                onChange={(e) => onStatusChange(row._id, e.target.value as CheckStatus)}
                                className={`block w-full py-1 px-2 border rounded-md text-xs font-medium focus:ring-indigo-500 focus:border-indigo-500 shadow-sm cursor-pointer outline-none ${getStatusColor(row['檢查'])}`}
                            >
                                <option value="開發">開發</option>
                                <option value="回購">回購</option>
                                <option value="刪除">刪除</option>
                            </select>
                        </td>
                        {displayColumns.map((col) => (
                            <td key={`${row._id}-${col}`} className={`px-4 py-3 whitespace-nowrap ${col === '分類' ? 'font-medium text-indigo-600 bg-indigo-50/20' : ''}`}>
                                {col === '點數' ? (
                                    <div className="flex items-center space-x-2">
                                        <span className={row['檢查'] === '刪除' ? 'text-slate-300 line-through' : row['檢查'] === '回購' ? 'text-orange-600 font-bold' : ''}>
                                            {row['點數']}
                                        </span>
                                        {row['檢查'] !== '開發' && (
                                            <span className="text-[10px] text-slate-400">(原:{row._originalPoints})</span>
                                        )}
                                    </div>
                                ) : ( row[col] )}
                            </td>
                        ))}
                    </tr>
                );
            })}
            {data.length === 0 && (
                <tr>
                    <td colSpan={displayColumns.length + 2} className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">無資料顯示</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
