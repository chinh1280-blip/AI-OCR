export type ZoneId = 'zone1' | 'zone2' | 'zone3' | 'zone4';

export interface Zone1Data {
  unwind2: number | null;
  rewind: number | null;
  unwind1: number | null;
  infeed: number | null;
  oven: number | null;
  speed: number | null;
}

export interface Zone2Data {
  dryer1: number | null;
  dryer2: number | null;
  dryer3: number | null;
}

export interface Zone3Data {
  chillerTemp: number | null;
}

export interface Zone4Data {
  axisTemp: number | null;
}

// Union type for any zone data
export type AnyZoneData = Zone1Data | Zone2Data | Zone3Data | Zone4Data;

export interface ProcessingState {
  isAnalyzing: boolean;
  error: string | null;
  imageUrl: string | null;
}

// Flattened type for Standard Data (User Inputs)
export interface StandardDataMap {
  [key: string]: number | undefined;
}

// New Interface for Product Presets
export interface ProductPreset {
  id: string;
  productName: string; // Tên sản phẩm
  structure: string;   // Cấu trúc
  data: StandardDataMap;
}

export const ZONE_LABELS: Record<ZoneId, string> = {
  zone1: "Vùng 1: Máy Chính",
  zone2: "Vùng 2: Buồng Sấy",
  zone3: "Vùng 3: Máy Lạnh",
  zone4: "Vùng 4: Trục Ghép"
};

export const FIELD_LABELS: Record<string, string> = {
  // Zone 1
  unwind2: "Unwind 2 (Kg)",
  rewind: "Rewind (Kg)",
  unwind1: "Unwind 1 (Kg)",
  infeed: "Infeed (Kg)",
  oven: "Oven (Kg)",
  speed: "Speed (M/Min)",
  // Zone 2
  dryer1: "Buồng sấy 1 (#1 Unit)",
  dryer2: "Buồng sấy 2 (#2 Unit)",
  dryer3: "Buồng sấy 3 (#3 Unit)",
  // Zone 3
  chillerTemp: "Nhiệt độ Máy lạnh",
  // Zone 4
  axisTemp: "Nhiệt độ Trục ghép"
};

// Map fields to zones for the Settings UI
export const FIELDS_BY_ZONE: Record<ZoneId, string[]> = {
  zone1: ['unwind2', 'rewind', 'unwind1', 'infeed', 'oven', 'speed'],
  zone2: ['dryer1', 'dryer2', 'dryer3'],
  zone3: ['chillerTemp'],
  zone4: ['axisTemp']
};