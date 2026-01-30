import React, { useState, useEffect, useCallback } from 'react';
import { ZoneView } from './components/ZoneView';
import { SettingsModal } from './components/SettingsModal';
import { ZoneId, ProcessingState, AnyZoneData, ZONE_LABELS, StandardDataMap, ProductPreset } from './types';
import { Save, LayoutDashboard, Database, Zap, Activity, Cpu, Settings, Send } from 'lucide-react';

const ICONS = {
  zone1: LayoutDashboard,
  zone2: Database,
  zone3: Zap,
  zone4: Activity
};

const MODELS = [
  { id: 'gemini-flash-lite-latest', name: 'Flash Lite (Fast)' },
  { id: 'gemini-2.5-flash-latest', name: 'Flash 2.5 (Precise)' },
  { id: 'gemini-3-flash-preview', name: 'Flash 3.0 (Preview)' }
];

const App: React.FC = () => {
  const [activeZone, setActiveZone] = useState<ZoneId>('zone1');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-flash-lite-latest');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // -- New State for Presets --
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [presets, setPresets] = useState<ProductPreset[]>([]);
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to fetch presets from Google Sheet
  const fetchPresets = useCallback(async () => {
    if (!googleSheetUrl) return;
    setIsRefreshing(true);
    try {
      // FIX: Add timestamp to prevent browser caching (Cache busting)
      const separator = googleSheetUrl.includes('?') ? '&' : '?';
      const noCacheUrl = `${googleSheetUrl}${separator}t=${new Date().getTime()}`;

      const response = await fetch(noCacheUrl, {
        method: 'GET', 
        redirect: 'follow', // Important: Follow GAS redirects
        headers: { 'Content-Type': 'text/plain' }, // Use text/plain to avoid preflight issues in some cases
      });

      if (response.ok) {
        const data = await response.json();
        // Check if data is array and has items
        if (Array.isArray(data)) {
          setPresets(data);
          // Update local cache
          localStorage.setItem('productPresets', JSON.stringify(data));
          console.log("Synced presets:", data.length);
        } else {
           console.warn("Synced data is not an array:", data);
        }
      } else {
        console.error("Fetch failed with status:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch presets", error);
      alert("Không thể tải dữ liệu chuẩn. Vui lòng kiểm tra lại URL Script hoặc quyền truy cập (Anyone).");
    } finally {
      setIsRefreshing(false);
    }
  }, [googleSheetUrl]);
  
  // Derived state: current standard data based on selection
  const standardData: StandardDataMap = currentPresetId 
    ? presets.find(p => p.id === currentPresetId)?.data || {} 
    : {};

  const currentProductInfo = currentPresetId
    ? presets.find(p => p.id === currentPresetId)
    : null;

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('googleSheetUrl');
    const savedPresets = localStorage.getItem('productPresets');
    const savedCurrentId = localStorage.getItem('currentPresetId');

    if (savedUrl) setGoogleSheetUrl(savedUrl);
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) { console.error("Error parsing saved presets"); }
    }
    if (savedCurrentId) setCurrentPresetId(savedCurrentId);
  }, []);

  // Fetch presets once on mount if URL exists
  useEffect(() => {
    if (googleSheetUrl && presets.length === 0) {
      fetchPresets();
    }
  }, [googleSheetUrl]); // Intentionally restricted dependencies

  // Save to LocalStorage whenever changes happen
  useEffect(() => {
    localStorage.setItem('googleSheetUrl', googleSheetUrl);
  }, [googleSheetUrl]);

  useEffect(() => {
    if (currentPresetId) {
        localStorage.setItem('currentPresetId', currentPresetId);
    } else {
        localStorage.removeItem('currentPresetId');
    }
  }, [currentPresetId]);
  
  // Track the timestamp of the FIRST processed image
  const [firstCaptureTime, setFirstCaptureTime] = useState<string | null>(null);

  const [data, setData] = useState<Record<ZoneId, AnyZoneData | null>>({
    zone1: null,
    zone2: null,
    zone3: null,
    zone4: null,
  });

  const [uiState, setUiState] = useState<Record<ZoneId, ProcessingState>>({
    zone1: { isAnalyzing: false, error: null, imageUrl: null },
    zone2: { isAnalyzing: false, error: null, imageUrl: null },
    zone3: { isAnalyzing: false, error: null, imageUrl: null },
    zone4: { isAnalyzing: false, error: null, imageUrl: null },
  });

  const [isUploading, setIsUploading] = useState(false);

  // Helper to update zone data and set timestamp if it's the first capture
  const setZoneData = (zone: ZoneId, newData: AnyZoneData | null) => {
    setData(prev => ({ ...prev, [zone]: newData }));
    
    // Set timestamp if it's new data and no timestamp exists yet
    if (newData && !firstCaptureTime) {
      const now = new Date();
      // Format: YYYY-MM-DD HH:MM:SS
      const formatted = now.getFullYear() + "-" + 
        String(now.getMonth() + 1).padStart(2, '0') + "-" + 
        String(now.getDate()).padStart(2, '0') + " " + 
        String(now.getHours()).padStart(2, '0') + ":" + 
        String(now.getMinutes()).padStart(2, '0') + ":" + 
        String(now.getSeconds()).padStart(2, '0');
      setFirstCaptureTime(formatted);
    }
  };

  const setZoneUiState = (zone: ZoneId, newState: ProcessingState) => {
    setUiState(prev => ({ ...prev, [zone]: newState }));
  };

  const handleUploadToSheet = async () => {
    if (!googleSheetUrl) {
      alert("Vui lòng nhập URL Google Apps Script trong phần Cài đặt.");
      setIsSettingsOpen(true);
      return;
    }

    setIsUploading(true);

    try {
      // Prepare payload (action default is handled by backend if not sent, 
      // but let's be explicit: action="save_log")
      const payload: any = {
        action: "save_log", 
        timestamp: firstCaptureTime || new Date().toISOString(),
        model: selectedModel,
        productName: currentProductInfo ? currentProductInfo.productName : "",
        structure: currentProductInfo ? currentProductInfo.structure : "",
      };

      // Helper to calculate and add fields safely
      const addFields = (zoneData: any) => {
        if (!zoneData) return;
        Object.keys(zoneData).forEach(key => {
          const val = zoneData[key];
          const std = standardData[key];
          
          // Send "" instead of null/undefined to ensure JSON structure is valid for GAS
          payload[key] = (val !== null && val !== undefined) ? val : ""; // Actual
          payload[`std_${key}`] = (std !== undefined) ? std : ""; // Standard
          
          if (val !== null && val !== undefined && std !== undefined) {
            payload[`diff_${key}`] = parseFloat((val - std).toFixed(2));
          } else {
             payload[`diff_${key}`] = "";
          }
        });
      };

      addFields(data.zone1);
      addFields(data.zone2);
      addFields(data.zone3);
      addFields(data.zone4);

      console.log("Uploading Payload:", payload);

      // Using no-cors because GAS Web App usually doesn't return CORS headers for simple POSTs
      await fetch(googleSheetUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      alert("Dữ liệu đã được gửi đi! (Vui lòng kiểm tra Google Sheet)");

    } catch (error) {
      console.error("Upload error:", error);
      alert("Lỗi kết nối. Vui lòng kiểm tra lại URL Script.");
    } finally {
      setIsUploading(false);
    }
  };

  const completedZones = Object.values(data).filter(d => d !== null).length;
  const progress = (completedZones / 4) * 100;

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 font-sans selection:bg-blue-500/30">
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        googleSheetUrl={googleSheetUrl}
        setGoogleSheetUrl={setGoogleSheetUrl}
        presets={presets}
        currentPresetId={currentPresetId}
        setCurrentPresetId={setCurrentPresetId}
        onRefreshPresets={fetchPresets}
        isRefreshing={isRefreshing}
      />

      {/* Top Navbar */}
      <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:h-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Activity className="text-white" size={18} />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Smart HMI
              </h1>
            </div>
            
            <button 
               onClick={() => setIsSettingsOpen(true)}
               className="sm:hidden p-2 text-slate-400 hover:text-white"
            >
               <Settings size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 justify-between sm:justify-end w-full sm:w-auto">
             
             {/* Product Info Display (Mobile Friendly) */}
             {currentProductInfo && (
               <div className="hidden xs:flex flex-col items-end mr-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Sản phẩm</span>
                  <span className="text-xs font-semibold text-blue-400 max-w-[100px] truncate">{currentProductInfo.productName}</span>
               </div>
             )}

             {/* Model Selector */}
             <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                <Cpu size={14} className="ml-2 text-slate-400" />
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-300 py-1 px-2 focus:outline-none cursor-pointer"
                >
                  {MODELS.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-800 text-slate-200">
                      {m.name}
                    </option>
                  ))}
                </select>
             </div>

             <div className="flex items-center gap-3">
                
                <button 
                   onClick={() => setIsSettingsOpen(true)}
                   className="hidden sm:flex bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-sm font-medium transition-colors items-center gap-2"
                >
                   <Settings size={16} />
                   <span>Cài đặt</span>
                </button>

                <button 
                  onClick={handleUploadToSheet}
                  disabled={completedZones < 4 || isUploading}
                  className={`
                    bg-blue-600 hover:bg-blue-500 text-white disabled:bg-slate-800 disabled:text-slate-500
                    px-4 py-1.5 rounded-full text-sm font-bold shadow-lg transition-all flex items-center gap-2 active:scale-95
                    ${completedZones === 4 ? 'animate-pulse' : ''}
                  `}
                >
                  {isUploading ? <div className="animate-spin w-4 h-4 border-2 border-white/50 border-t-white rounded-full"></div> : <Send size={16} />}
                  <span className="hidden xs:inline">Gửi Sheet</span>
                </button>
             </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-16 sm:top-16 z-40 overflow-x-auto no-scrollbar">
         <div className="max-w-4xl mx-auto flex">
            {(Object.keys(ZONE_LABELS) as ZoneId[]).map((zone) => {
                const Icon = ICONS[zone];
                const isActive = activeZone === zone;
                const hasData = !!data[zone];
                
                return (
                    <button
                        key={zone}
                        onClick={() => setActiveZone(zone)}
                        className={`
                            flex-1 min-w-[100px] py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-b-2 transition-all duration-200
                            ${isActive 
                                ? 'border-blue-500 bg-slate-800/50 text-blue-400' 
                                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}
                        `}
                    >
                        <div className="relative">
                            <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                            {hasData && (
                                <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900"></span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide truncate max-w-full">
                            {ZONE_LABELS[zone].split(': ')[1]}
                        </span>
                    </button>
                );
            })}
         </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-4 pb-24">
         <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{ZONE_LABELS[activeZone]}</h2>
              <p className="text-sm text-slate-400">
                  Chụp ảnh rõ nét khu vực {ZONE_LABELS[activeZone].split(': ')[1].toLowerCase()} để trích xuất thông số.
              </p>
            </div>
         </div>

         <ZoneView 
            zoneId={activeZone}
            data={data[activeZone]}
            standardData={standardData}
            setData={(d) => setZoneData(activeZone, d)}
            state={uiState[activeZone]}
            setState={(s) => setZoneUiState(activeZone, s)}
            modelName={selectedModel}
         />
      </main>
      
    </div>
  );
};

export default App;