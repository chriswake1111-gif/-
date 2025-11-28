
import React, { useState, useCallback, useEffect } from 'react';
import { Download, FileSpreadsheet, RefreshCw, CheckCircle2, Monitor, ExternalLink, DownloadCloud, X, HelpCircle, Settings } from 'lucide-react';
import { parseExcel, processData, exportToExcel } from './services/excelService';
import { ProcessedResult, CheckStatus } from './types';
import Dropzone from './components/Dropzone';
import StatsBoard from './components/StatsBoard';
import DataTable from './components/DataTable';
import WindowPortal from './components/WindowPortal';
import ExclusionModal from './components/ExclusionModal';

const DEFAULT_EXCLUDED_IDS = [
  '028968', '028976', '029583', '029582', '029569', '029570', '022155', '000464', 
  '018039', '024369', '015715', '029585', '030175', '030081', '010654', '029821', 
  '032541', '009137', '023258', '029445', '014951', '031759', '032204', '032332'
];

function App() {
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  // Exclusion List State
  const [excludedIds, setExcludedIds] = useState<string[]>(DEFAULT_EXCLUDED_IDS);
  const [showExclusionModal, setShowExclusionModal] = useState(false);

  useEffect(() => {
    // Load exclusion list from localStorage
    const savedIds = localStorage.getItem('excludedProductIds');
    if (savedIds) {
      try {
        setExcludedIds(JSON.parse(savedIds));
      } catch (e) {
        console.error("Failed to parse saved excluded IDs", e);
        setExcludedIds(DEFAULT_EXCLUDED_IDS);
      }
    }

    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };
    
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const saveExcludedIds = (newIds: string[]) => {
    setExcludedIds(newIds);
    localStorage.setItem('excludedProductIds', JSON.stringify(newIds));
  };

  const resetExcludedIds = () => {
    setExcludedIds(DEFAULT_EXCLUDED_IDS);
    localStorage.removeItem('excludedProductIds'); // Or set to default string
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      // Fallback for browsers that don't support beforeinstallprompt (e.g., Safari, Firefox)
      setShowInstallHelp(true);
    }
  };

  const handleFileAccepted = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const rawData = await parseExcel(file);
      if (rawData.length === 0) throw new Error("檔案內容為空");

      // Small delay for UI feedback
      setTimeout(() => {
        try {
          // Pass the current excludedIds to the processing function
          const processedResult = processData(rawData, excludedIds);
          setResult(processedResult);
        } catch (processError) {
          console.error(processError);
          setError("資料處理發生錯誤，請檢查檔案格式。");
        } finally {
          setIsProcessing(false);
        }
      }, 500);

    } catch (err) {
      console.error(err);
      setError('讀取檔案失敗，請確保檔案未損壞且格式正確 (.xlsx/.xls)。');
      setIsProcessing(false);
    }
  };

  const handleRowUpdate = useCallback((id: string, newStatus: CheckStatus) => {
    setResult((prev) => {
      if (!prev) return null;

      const updatedData = prev.data.map((row) => {
        if (row._id !== id) return row;

        let newPoints = row._originalPoints;
        if (newStatus === '回購') newPoints = Math.floor(row._originalPoints / 2);
        else if (newStatus === '刪除') newPoints = 0;

        return { ...row, '檢查': newStatus, '點數': newPoints };
      });

      return { ...prev, data: updatedData };
    });
  }, []);

  const handleExport = () => {
    if (result) {
      const fileName = result.suggestedFileName || '點數表.xlsx';
      exportToExcel(result.data, fileName);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setShowPopup(false);
  };

  const popupColumns = ['日期', '客戶編號', '品項編號', '品名', '點數'];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 pt-16 relative">
      
      {!isStandalone && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 text-yellow-800 px-4 py-2 text-center text-xs font-medium z-40 flex justify-center items-center h-10">
          <Monitor size={14} className="mr-2" />
          此程式優化為電腦端使用，請確保使用大螢幕設備以獲得最佳體驗。
        </div>
      )}

      {/* Top Right Action Area */}
      {!isStandalone && (
        <div className="absolute top-14 right-6 z-40">
           <button
            onClick={handleInstallClick}
            className="inline-flex items-center px-4 py-2 border border-indigo-200 shadow-sm text-sm font-medium rounded-full text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            <DownloadCloud size={16} className="mr-2" />
            安裝應用程式
          </button>
        </div>
      )}

      {/* Install Help Modal */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowInstallHelp(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                <DownloadCloud size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">安裝教學</h3>
            </div>
            
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              您的瀏覽器可能需要手動安裝。請依照以下步驟將此應用程式安裝到您的電腦，獲得類似原生軟體的體驗：
            </p>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-start">
                <div className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded mr-3 text-xs mt-0.5">Chrome / Edge</div>
                <p>請點擊瀏覽器網址列右側的 <span className="inline-block border border-slate-300 rounded px-1 mx-1"><Monitor size={10} className="inline" /> 安裝</span> 圖示。</p>
              </div>
               <div className="flex items-start">
                <div className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded mr-3 text-xs mt-0.5">Safari (Mac)</div>
                <p>請點擊分享按鈕 <span className="inline-block border border-slate-300 rounded px-1 mx-1">↑</span>，然後選擇「加入 Dock」。</p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallHelp(false)}
              className="mt-6 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              了解
            </button>
          </div>
        </div>
      )}

      {/* Exclusion List Edit Modal */}
      <ExclusionModal 
        isOpen={showExclusionModal}
        onClose={() => setShowExclusionModal(false)}
        currentList={excludedIds}
        onSave={saveExcludedIds}
        onReset={resetExcludedIds}
      />

      <div className="max-w-7xl mx-auto space-y-8 mt-4">
        
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
             <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <FileSpreadsheet className="text-white h-8 w-8" />
             </div>
          </div>
          
          <div className="flex items-baseline justify-center mb-2 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">銷售明細資料清理工具</h1>
            <span className="ml-8 text-base font-light text-slate-400 tracking-wider font-serif italic whitespace-nowrap">Made BY ChrisChiu</span>
          </div>

          <p className="text-lg text-slate-600">自動化篩選欠款、點數與異常價格，智慧分類並支援手動調整狀態。</p>
        </div>

        <div className="space-y-6">
          {!result && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
               <Dropzone onFileAccepted={handleFileAccepted} isLoading={isProcessing} />
               
               <div className="mt-8 border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">處理規則說明</h4>
                  <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600">
                      <div>
                          <div className="flex items-center justify-between mb-2">
                             <p className="font-semibold text-slate-800">篩選條件 (自動移除)</p>
                             <button 
                                onClick={() => setShowExclusionModal(true)}
                                className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold rounded-md shadow-sm flex items-center transition-colors"
                             >
                                <Settings size={12} className="mr-1" />
                                藥師點數編輯
                             </button>
                          </div>
                          
                          <ul className="list-disc pl-5 space-y-1.5 marker:text-red-400">
                              <li>沒有 <span className="font-mono bg-slate-100 px-1 rounded">客戶編號</span> 的資料</li>
                              <li><span className="font-mono bg-slate-100 px-1 rounded">本次欠款</span> 大於 0</li>
                              <li><span className="font-mono bg-slate-100 px-1 rounded">點數</span> 等於 0</li>
                              <li><span className="font-mono bg-slate-100 px-1 rounded">單價</span> 等於 0</li>
                              <li>品類為 '05-2' 且 單位為 '罐'/'瓶'</li>
                              <li>
                                藥師點數品項排除 
                                <span className="ml-1 text-slate-400 text-xs">({excludedIds.length} 筆設定)</span>
                              </li>
                          </ul>
                      </div>
                      
                      <div>
                          <p className="font-semibold mb-2 text-slate-800">分類規則 (建立分類欄位)</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between"><span>04-6</span> <span className="font-medium text-indigo-600">小兒營養素</span></div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between"><span>04-7</span> <span className="font-medium text-indigo-600">成人保健品</span></div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between"><span>05-1</span> <span className="font-medium text-indigo-600">成人奶粉</span></div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between"><span>05-2</span> <span className="font-medium text-indigo-600">成人奶水</span></div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between"><span>05-3</span> <span className="font-medium text-indigo-600">現金-小兒銷售</span></div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
                        <strong className="block mb-1">手動檢查與匯出：</strong>
                        <ul>
                            <li>• 點選「回購」：點數除以 2；輸出至「回購名單」分頁。</li>
                            <li>• 點選「開發」：點數不變；輸出至「開發名單」分頁。</li>
                            <li>• 點選「刪除」：點數歸 0；<span className="text-red-600 font-bold">不匯出</span>至 Excel。</li>
                        </ul>
                    </div>
                     <div className="p-3 bg-slate-100 text-slate-700 text-xs rounded-lg border border-slate-200">
                        <strong className="block mb-1">輸出排序：</strong>
                        依照分類 (小兒營養素...現金-小兒銷售) 排序，組內依單號遞增。
                    </div>
                  </div>
               </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
              <p className="ml-3 text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-4 z-30">
                <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                    <div className="bg-emerald-100 p-2 rounded-full">
                        <CheckCircle2 className="text-emerald-600 w-5 h-5" />
                    </div>
                    <div>
                        <span className="font-semibold text-slate-800 block">處理完成</span>
                        <span className="text-xs text-slate-500">{result.suggestedFileName}</span>
                    </div>
                </div>
                <div className="flex space-x-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowPopup(!showPopup)}
                        className={`flex-1 sm:flex-none justify-center inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                            showPopup ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        <ExternalLink size={16} className="mr-2" />
                        {showPopup ? "關閉小視窗" : "開啟小視窗"}
                    </button>

                    <button
                        onClick={handleReset}
                        className="flex-1 sm:flex-none justify-center inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                    >
                        <RefreshCw size={16} className="mr-2" />
                        重新上傳
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex-1 sm:flex-none justify-center inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:shadow-md"
                    >
                        <Download size={16} className="mr-2" />
                        匯出 Excel
                    </button>
                </div>
              </div>

              <StatsBoard stats={result.stats} />

              <div className={`${showPopup ? 'opacity-50 pointer-events-none grayscale' : ''} transition-all duration-300`}>
                <DataTable data={result.data} onStatusChange={handleRowUpdate} />
              </div>
              
              {showPopup && (
                <div className="text-center text-sm text-slate-500 italic">正在獨立視窗中編輯資料... 主畫面已暫時鎖定。</div>
              )}

              {showPopup && (
                <WindowPortal closeWindowPortal={() => setShowPopup(false)} title="銷售資料快速檢查">
                    <DataTable 
                        data={result.data} 
                        onStatusChange={handleRowUpdate}
                        visibleColumns={popupColumns}
                        variant="popup"
                    />
                </WindowPortal>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
