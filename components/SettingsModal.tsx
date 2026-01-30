import React, { useState, useEffect } from 'react';
import { X, Save, Link, Plus, Trash2, Check, Layers, RefreshCw, CloudUpload } from 'lucide-react';
import { ZONE_LABELS, FIELDS_BY_ZONE, FIELD_LABELS, StandardDataMap, ZoneId, ProductPreset } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleSheetUrl: string;
  setGoogleSheetUrl: (url: string) => void;
  presets: ProductPreset[];
  currentPresetId: string | null;
  setCurrentPresetId: (id: string | null) => void;
  onRefreshPresets: () => Promise<void>; // New prop to trigger fetch
  isRefreshing: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  googleSheetUrl,
  setGoogleSheetUrl,
  presets,
  currentPresetId,
  setCurrentPresetId,
  onRefreshPresets,
  isRefreshing
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'manage' | 'url'>('select');
  const [localUrl, setLocalUrl] = useState(googleSheetUrl);
  
  // Form state for creating new preset
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newStructure, setNewStructure] = useState('');
  const [newData, setNewData] = useState<StandardDataMap>({});

  useEffect(() => {
    setLocalUrl(googleSheetUrl);
  }, [googleSheetUrl, isOpen]);

  // Save URL
  const handleSaveUrl = () => {
    setGoogleSheetUrl(localUrl);
    alert("Đã lưu URL kết nối!");
  };

  // Handle Preset Creation (Send to Cloud)
  const handleCreatePreset = async () => {
    if (!newProductName.trim() || !newStructure.trim()) {
      alert("Vui lòng nhập Tên sản phẩm và Cấu trúc");
      return;
    }
    if (!googleSheetUrl) {
      alert("Chưa cấu hình URL Google Sheet!");
      return;
    }

    setIsSavingCloud(true);

    try {
      // Prepare payload for "save_standard" action
      const payload = {
        action: "save_standard",
        productName: newProductName.trim(),
        structure: newStructure.trim(),
        data: newData
      };

      const response = await fetch(googleSheetUrl, {
        method: 'POST',
        mode: 'no-cors', // Assuming standard Web App deployment
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Note: with no-cors we can't read the response content easily to check for duplicates in UI immediately
      // But we can assume if it works, we refresh.
      
      // Artificial delay to allow Sheet to process before we re-fetch
      await new Promise(r => setTimeout(r, 2000));
      
      await onRefreshPresets();
      
      setIsCreating(false);
      setNewProductName('');
      setNewStructure('');
      setNewData({});
      alert("Đã gửi yêu cầu tạo chuẩn mới lên Sheet! (Nếu không thấy, hãy kiểm tra lại kết nối)");

    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối khi lưu chuẩn.");
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleNewDataChange = (key: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setNewData(prev => ({ ...prev, [key]: numValue }));
  };

  const currentPreset = presets.find(p => p.id === currentPresetId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon tab={activeTab} />
            {activeTab === 'select' && "Chọn Sản Phẩm"}
            {activeTab === 'manage' && "Quản lý / Thêm Mới"}
            {activeTab === 'url' && "Kết nối"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 overflow-x-auto">
           <TabButton id="select" label="Chọn Sản Phẩm" active={activeTab} onClick={setActiveTab} />
           <TabButton id="manage" label="Thêm Mới & Đồng bộ" active={activeTab} onClick={setActiveTab} />
           <TabButton id="url" label="Kết nối Sheet" active={activeTab} onClick={setActiveTab} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950/30">
          
          {/* TAB 1: SELECT */}
          {activeTab === 'select' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                   <label className="block text-sm font-medium text-slate-300">Đơn hàng đang chạy</label>
                   <button 
                     onClick={onRefreshPresets}
                     disabled={isRefreshing}
                     className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                   >
                     <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                     {isRefreshing ? "Đang tải..." : "Cập nhật từ Sheet"}
                   </button>
                </div>

                {presets.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
                    <p className="mb-2">Chưa có dữ liệu từ Google Sheet.</p>
                    {googleSheetUrl ? (
                         <button onClick={onRefreshPresets} className="text-blue-400 font-bold hover:underline">
                           Nhấn để tải dữ liệu về
                         </button>
                    ) : (
                        <p className="text-xs text-red-400">Vui lòng nhập URL kết nối trước.</p>
                    )}
                  </div>
                ) : (
                  <select 
                    value={currentPresetId || ''} 
                    onChange={(e) => setCurrentPresetId(e.target.value || null)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Chọn Sản Phẩm & Cấu Trúc --</option>
                    {presets.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.productName} - {p.structure}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {currentPreset && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-bold text-slate-400 uppercase">Thông số chuẩn:</h3>
                     <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
                        Đang áp dụng
                     </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 opacity-75">
                     {Object.entries(currentPreset.data).map(([key, val]) => (
                        val !== undefined && (
                          <div key={key} className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                             <span className="text-xs text-slate-500 truncate mr-2">{FIELD_LABELS[key]}</span>
                             <span className="text-sm font-mono font-bold text-white">{val}</span>
                          </div>
                        )
                     ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANAGE */}
          {activeTab === 'manage' && (
            <div className="space-y-6">
              
              {!isCreating ? (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                      <h3 className="text-blue-400 font-bold text-sm mb-1 flex items-center gap-2">
                        <CloudUpload size={16}/> Đồng bộ với Google Sheet
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">
                        Dữ liệu chuẩn được lưu trữ trên Sheet "Standards". Bạn có thể nhập trực tiếp trên Sheet hoặc dùng Form dưới đây để thêm mới.
                      </p>
                      <button 
                        onClick={onRefreshPresets}
                        disabled={isRefreshing}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all"
                      >
                         <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                         {isRefreshing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu mới nhất về App"}
                      </button>
                  </div>

                  <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-900 px-2 text-slate-500">Hoặc</span>
                      </div>
                  </div>

                  <button 
                    onClick={() => setIsCreating(true)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <Plus size={20} /> Tạo Bộ Chuẩn Mới (Gửi lên Sheet)
                  </button>
                  
                  <div className="space-y-2 mt-4">
                    <h3 className="text-sm font-semibold text-slate-400">Danh sách trên máy ({presets.length})</h3>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar bg-slate-900 rounded border border-slate-800">
                        {presets.map(p => (
                        <div key={p.id} className="p-3 border-b border-slate-800 last:border-0">
                            <div className="font-bold text-white text-sm">{p.productName}</div>
                            <div className="text-xs text-slate-500">{p.structure}</div>
                        </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Thêm mới lên Sheet</h3>
                    <button onClick={() => setIsCreating(false)} className="text-sm text-slate-400 hover:text-white">Hủy</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tên Sản Phẩm <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={newProductName}
                        onChange={e => setNewProductName(e.target.value)}
                        placeholder="VD: Bao Bì ABC"
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Cấu Trúc <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={newStructure}
                        onChange={e => setNewStructure(e.target.value)}
                        placeholder="VD: PET/AL/PE"
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-800 pt-4">
                    <p className="text-xs text-slate-400 italic">Nhập các thông số chuẩn:</p>
                    {(Object.keys(ZONE_LABELS) as ZoneId[]).map(zoneId => (
                      <div key={zoneId} className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                        <h4 className="text-xs font-bold text-blue-400 mb-2 uppercase">{ZONE_LABELS[zoneId]}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {FIELDS_BY_ZONE[zoneId].map(fieldKey => (
                            <div key={fieldKey}>
                              <label className="text-[10px] text-slate-500 block truncate">{FIELD_LABELS[fieldKey]}</label>
                              <input
                                type="number"
                                step="0.1"
                                value={newData[fieldKey] ?? ''}
                                onChange={(e) => handleNewDataChange(fieldKey, e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleCreatePreset}
                    disabled={isSavingCloud}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center gap-2"
                  >
                    {isSavingCloud ? "Đang gửi..." : "Lưu lên Google Sheet"}
                  </button>
                  <p className="text-[10px] text-center text-slate-500 mt-2">
                    Lưu ý: Dữ liệu sẽ được gửi lên tab "Standards" trong Google Sheet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                Google Apps Script Web App URL
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-slate-500">
                 Script sẽ tự động tạo Sheet "Standards" nếu chưa có khi bạn nhấn "Lưu lên Sheet" ở tab Quản lý.
              </p>
              <button 
                onClick={handleSaveUrl}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow transition-all"
              >
                Lưu URL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ id, label, active, onClick }: any) => (
  <button 
    onClick={() => onClick(id)}
    className={`flex-1 py-3 px-4 text-sm font-semibold whitespace-nowrap transition-colors ${active === id ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/30' : 'text-slate-400 hover:text-slate-200'}`}
  >
    {label}
  </button>
);

const SettingsIcon = ({ tab }: { tab: string }) => {
  if (tab === 'select') return <Check size={20} className="text-blue-400" />;
  if (tab === 'manage') return <Layers size={20} className="text-blue-400" />;
  return <Link size={20} className="text-blue-400" />;
};