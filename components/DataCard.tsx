import React from 'react';
import { FIELD_LABELS } from '../types';

interface DataCardProps {
  dataKey: string;
  value: number | null;
  standardValue?: number;
  onChange: (key: string, value: number) => void;
}

export const DataCard: React.FC<DataCardProps> = ({ dataKey, value, standardValue, onChange }) => {
  
  // Calculate difference
  let diff = null;
  let statusColor = "text-slate-400";
  let diffDisplay = "";

  if (value !== null && standardValue !== undefined) {
    diff = value - standardValue;
    const diffAbs = Math.abs(diff);
    
    // Simple tolerance logic: warning if diff > 5% or > 2 units (customizable)
    // For now, let's just color code: Green (Exact/Close), Yellow (Small Diff), Red (Large Diff)
    if (diffAbs === 0) {
      statusColor = "text-green-400";
      diffDisplay = "✓ Chuẩn";
    } else {
      const sign = diff > 0 ? "+" : "";
      diffDisplay = `${sign}${diff.toFixed(1)}`;
      statusColor = diffAbs > 5 ? "text-red-400" : "text-yellow-400";
    }
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 shadow-lg flex flex-col transition-all hover:border-slate-500 group">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide truncate">
          {FIELD_LABELS[dataKey] || dataKey}
        </label>
        {standardValue !== undefined && (
          <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
            Std: {standardValue}
          </span>
        )}
      </div>
      
      <div className="flex items-center relative gap-2">
        <input
          type="number"
          step="0.1"
          className={`w-full bg-slate-900/50 text-white text-xl font-mono font-bold p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-slate-700/50 transition-colors ${value === null ? 'border-red-900/50' : ''}`}
          value={value ?? ''}
          onChange={(e) => onChange(dataKey, parseFloat(e.target.value))}
          placeholder="--"
        />
        
        {/* Comparison Indicator */}
        {value !== null && standardValue !== undefined && (
           <div className={`absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-sm ${statusColor}`}>
              {diffDisplay}
           </div>
        )}

        {value === null && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400">
             <span className="text-xs bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Missing</span>
          </div>
        )}
      </div>
    </div>
  );
};