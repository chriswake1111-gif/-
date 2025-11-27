
import React from 'react';
import { ProcessingStats } from '../types';
import { Filter, Database, Trash2, ArrowRight, Tag } from 'lucide-react';

interface StatsBoardProps {
  stats: ProcessingStats;
}

const StatItem = ({ label, value, colorClass, icon: Icon }: { label: string; value: number; colorClass: string; icon: any }) => (
  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-md ${colorClass} bg-opacity-10`}>
        <Icon size={16} className={colorClass.replace('bg-', 'text-')} />
      </div>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
    <span className="text-lg font-bold text-slate-800">{value.toLocaleString()}</span>
  </div>
);

const StatsBoard: React.FC<StatsBoardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Summary Cards */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-4 flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Database size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">原始資料筆數</p>
                <p className="text-2xl font-bold text-slate-900">{stats.originalCount.toLocaleString()}</p>
            </div>
        </div>
        
        <ArrowRight className="hidden sm:block text-slate-300" />

        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
             <div className="p-3 bg-red-100 rounded-full text-red-600">
                <Trash2 size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">共移除筆數</p>
                <p className="text-2xl font-bold text-red-600">{stats.removedCount.toLocaleString()}</p>
            </div>
        </div>

        <ArrowRight className="hidden sm:block text-slate-300" />

        <div className="flex items-center space-x-4">
             <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                <Filter size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">有效保留筆數</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.finalCount.toLocaleString()}</p>
            </div>
        </div>
      </div>

      {/* Detail Breakdown */}
      <div className="lg:col-span-4 mt-2">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-1">刪除原因分析</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <StatItem 
                label="沒有客戶編號" 
                value={stats.missingCustomerIdCount} 
                colorClass="text-orange-600 bg-orange-600"
                icon={Trash2}
            />
             <StatItem 
                label="欠款 > 0" 
                value={stats.positiveDebtCount} 
                colorClass="text-orange-600 bg-orange-600"
                icon={Trash2}
            />
             <StatItem 
                label="點數 = 0" 
                value={stats.zeroPointsCount} 
                colorClass="text-orange-600 bg-orange-600"
                icon={Trash2}
            />
             <StatItem 
                label="單價 = 0" 
                value={stats.zeroPriceCount} 
                colorClass="text-orange-600 bg-orange-600"
                icon={Trash2}
            />
             <StatItem 
                label="特定品類排除" 
                value={stats.excludedCategoryCount} 
                colorClass="text-orange-600 bg-orange-600"
                icon={Trash2}
            />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="lg:col-span-4 mt-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-1">新分類統計</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {Object.entries(stats.categoryCounts).map(([cat, count]) => (
             <div key={cat} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm transition-transform hover:scale-105">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-full ${cat === '其他' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
                    <Tag size={14} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 truncate" title={cat}>{cat}</span>
                </div>
                <span className="text-lg font-bold text-slate-800">{count.toLocaleString()}</span>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsBoard;
