import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  isLoading: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFileAccepted, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      setError(null);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        validateAndAccept(files[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndAccept(e.target.files[0]);
    }
  };

  const validateAndAccept = (file: File) => {
    // Simple validation for excel types
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    
    // Some browsers might have empty type for some excel files, so we also check extension
    const isExcelExtension = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (validTypes.includes(file.type) || isExcelExtension) {
      onFileAccepted(file);
    } else {
      setError('請上傳有效的 Excel 檔案 (.xlsx 或 .xls)');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ease-in-out cursor-pointer group
          ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-[1.01]'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          accept=".xlsx, .xls"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full ${isDragOver ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'} transition-colors`}>
            {isLoading ? (
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            ) : (
              <UploadCloud size={32} />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-slate-700">
              {isLoading ? '正在處理檔案...' : '點擊或拖曳 Excel 檔案至此'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              支援 .xlsx 格式
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center justify-center text-red-500 text-sm animate-pulse">
          <AlertCircle size={16} className="mr-2" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Dropzone;