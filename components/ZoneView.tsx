import React from 'react';
import { ImageUploader } from './ImageUploader';
import { DataCard } from './DataCard';
import { ProcessingState, AnyZoneData, ZoneId, StandardDataMap } from '../types';
import { analyzeImage } from '../services/geminiService';
import { Trash2 } from 'lucide-react';

interface ZoneViewProps {
  zoneId: ZoneId;
  data: AnyZoneData | null;
  standardData: StandardDataMap;
  setData: (data: AnyZoneData | null) => void;
  state: ProcessingState;
  setState: (state: ProcessingState) => void;
  modelName: string;
}

export const ZoneView: React.FC<ZoneViewProps> = ({ 
  zoneId, 
  data, 
  standardData,
  setData, 
  state, 
  setState,
  modelName
}) => {

  const handleImageSelected = async (base64: string) => {
    setState({
      isAnalyzing: true,
      error: null,
      imageUrl: `data:image/jpeg;base64,${base64}`,
    });
    setData(null);

    try {
      const result = await analyzeImage(base64, zoneId, modelName);
      setData(result);
      setState({ ...state, isAnalyzing: false, imageUrl: `data:image/jpeg;base64,${base64}` });
    } catch (err) {
      setState({ 
        ...state, 
        isAnalyzing: false, 
        error: "Không thể đọc dữ liệu. Vui lòng thử lại với ảnh rõ nét hơn hoặc đổi Model." 
      });
    }
  };

  const handleDataChange = (key: string, value: number) => {
    if (data) {
      setData({ ...data, [key]: value });
    }
  };

  const handleClear = () => {
    setData(null);
    setState({ isAnalyzing: false, error: null, imageUrl: null });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Image Section */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
        {state.error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-lg text-sm flex items-center gap-2">
                <span>⚠️</span> {state.error}
            </div>
        )}

        {state.imageUrl ? (
          <div className="relative group">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-black border border-slate-700 shadow-inner">
              <img 
                src={state.imageUrl} 
                alt="Capture" 
                className={`w-full h-full object-contain ${state.isAnalyzing ? 'opacity-50 blur-sm' : ''}`} 
              />
              {state.isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-blue-400 font-medium text-sm animate-pulse">Gemini đang phân tích...</span>
                </div>
              )}
            </div>
            {!state.isAnalyzing && (
                <button 
                    onClick={handleClear}
                    className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-600/90 text-white p-2 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    title="Chụp lại"
                >
                    <Trash2 size={16} />
                </button>
            )}
          </div>
        ) : (
           <ImageUploader 
             onImageSelected={handleImageSelected} 
             isProcessing={state.isAnalyzing} 
           />
        )}
      </div>

      {/* Data Section */}
      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="text-white font-semibold flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                Kết quả đọc
             </h3>
             <span className="text-xs text-slate-500 uppercase font-mono">Auto-Filled via {modelName}</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(data).map(([key, value]) => (
              <DataCard 
                key={key} 
                dataKey={key} 
                value={value as number} 
                standardValue={standardData[key]}
                onChange={handleDataChange} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};