
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, RotateCcw, AlertTriangle, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExclusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentList: string[];
  onSave: (newList: string[]) => void;
  onReset: () => void;
}

const ExclusionModal: React.FC<ExclusionModalProps> = ({ 
  isOpen, 
  onClose, 
  currentList, 
  onSave, 
  onReset 
}) => {
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Convert list to string format (comma separated)
      setInputText(currentList.join(', '));
    }
  }, [isOpen, currentList]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Split by comma or newline, trim whitespace, and remove empty entries
    const rawList = inputText
      .split(/[\n,]+/)
      .map(item => item.trim())
      .filter(item => item !== '');

    // Check for duplicates
    const uniqueSet = new Set(rawList);
    
    if (uniqueSet.size !== rawList.length) {
      const seen = new Set<string>();
      const duplicates = new Set<string>();
      
      rawList.forEach(item => {
        if (seen.has(item)) {
          duplicates.add(item);
        }
        seen.add(item);
      });

      const duplicateArray = Array.from(duplicates);
      const displayLimit = 5;
      const displayString = duplicateArray.slice(0, displayLimit).join(', ') + 
        (duplicateArray.length > displayLimit ? `...以及其他 ${duplicateArray.length - displayLimit} 筆` : '');

      const shouldAutoClean = window.confirm(
        `偵測到重複的品項編號：\n${displayString}\n\n是否自動移除重複項並儲存？`
      );

      if (!shouldAutoClean) {
        return; // User cancelled, stay in modal to fix manually
      }
    }
    
    // Convert back to array from Set to ensure uniqueness
    const newList = Array.from(uniqueSet);
    
    onSave(newList);
    onClose();
  };

  const handleTriggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        let newIds: string[] = [];

        if (isExcel) {
          const workbook = XLSX.read(content, { type: 'binary' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          // Get all cells as a flat array of arrays
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          // Flatten and convert to string
          newIds = jsonData.flat().map(cell => String(cell).trim()).filter(cell => cell !== '');
        } else {
          // Text or CSV
          const text = content as string;
          newIds = text.split(/[\n,]+/).map(item => item.trim()).filter(item => item !== '');
        }

        if (newIds.length > 0) {
            const joinedIds = newIds.join(', ');
            setInputText(joinedIds);
            alert(`已成功讀取 ${newIds.length} 筆品項編號`);
        } else {
            alert('檔案中未發現有效資料');
        }

      } catch (err) {
        console.error("Import failed", err);
        alert('匯入失敗，請確認檔案格式正確');
      } finally {
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    if (isExcel) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleExportFile = () => {
    const ids = inputText
      .split(/[\n,]+/)
      .map(item => item.trim())
      .filter(item => item !== '');

    if (ids.length === 0) {
      alert('目前清單為空，無法匯出');
      return;
    }

    try {
      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(ids.map(id => [id]));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "排除清單");
      
      // Generate file
      XLSX.writeFile(wb, "排除清單_備份.xlsx");
    } catch (err) {
      console.error("Export failed", err);
      alert("匯出失敗");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-yellow-400 rounded-full text-black">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">藥師點數品項排除編輯</h3>
            <p className="text-xs text-slate-500">設定要從篩選結果中自動移除的品項編號</p>
          </div>
        </div>

        <div className="flex-1 mb-6 overflow-hidden flex flex-col">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-sm text-yellow-800">
             <p>請輸入要排除的 <strong>品項編號</strong>，支援匯入 Excel (讀取第一張表的所有內容) 或文字檔。</p>
          </div>
          
          <label className="block text-sm font-medium text-slate-700 mb-2">
            排除清單 (以逗號或換行分隔)
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full flex-1 min-h-[200px] p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 font-mono text-sm resize-none"
            placeholder="例如: 028968, 028976..."
          />
          <p className="text-right text-xs text-slate-400 mt-1">
            當前數量: {inputText.split(/[\n,]+/).filter(i => i.trim()).length} 筆
          </p>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv,.txt,.xlsx,.xls" 
            onChange={handleFileUpload}
          />
        </div>

        <div className="flex space-x-2 pt-2 border-t border-slate-100 items-center">
          <button
            onClick={() => {
              if(window.confirm('確定要回復到系統預設值嗎？目前的修改將會遺失。')) {
                onReset();
              }
            }}
            className="flex items-center px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium"
            title="回復預設值"
          >
            <RotateCcw size={16} className="mr-2 sm:mr-0 md:mr-2" />
            <span className="hidden md:inline">預設</span>
          </button>
          
          <button
            onClick={handleTriggerFileUpload}
            className="flex items-center px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium"
            title="從檔案匯入"
          >
            <Upload size={16} className="mr-2 sm:mr-0 md:mr-2" />
            <span className="hidden md:inline">匯入</span>
          </button>

          <button
            onClick={handleExportFile}
            className="flex items-center px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium"
            title="匯出至檔案"
          >
            <Download size={16} className="mr-2 sm:mr-0 md:mr-2" />
            <span className="hidden md:inline">匯出</span>
          </button>

          <div className="flex-1"></div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            <Save size={16} className="mr-2" />
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExclusionModal;
