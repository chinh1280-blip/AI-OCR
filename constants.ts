import { Type, Schema } from "@google/genai";
import { ZoneId } from "./types";

// --- PROMPTS ---

const PROMPT_ZONE_1 = `
Analyze the Machine HMI Screen with strict spatial row selection:

1. TOP-LEFT GRID (Unwind/Rewind Section):
   - Structure: Columns are [Unwind 2], [Rewind], [Unwind 1]. 
   - Row Labels: The rows are labeled vertically as [Dan.], [Stea], [Kg].
   - **CRITICAL INSTRUCTION**: Do NOT read the values from the "Stea" row (2nd row). 
   - **TARGET**: Read ONLY the values from the row labeled "Kg" (the 3rd row).
   - Extract:
     * 'unwind2': value under 'Unwind 2' column, inside 'Kg' row.
     * 'rewind': value under 'Rewind' column, inside 'Kg' row.
     * 'unwind1': value under 'Unwind 1' column, inside 'Kg' row.

2. TOP-RIGHT GRID (Tension Section):
   - Structure: Columns are [Infeed], [Oven].
   - Row Labels: [I.V], [PV. Kg], [Set Kg].
   - **TARGET**: Read ONLY the bottom row labeled "Set Kg".
   - Extract:
     * 'infeed': value under 'Infeed' column, row "Set Kg".
     * 'oven': value under 'Oven' column, row "Set Kg".

3. CENTER:
   - 'speed': The large digital number labeled "Speed" (M/Min) (usually white text on blue/black background).

Rules: Return 0 if the value is 0.0. Return null if unreadable/obscured.
`;

const PROMPT_ZONE_2 = `
You are reading an "AIR DRYER SYSTEM" panel. 
There are three controllers labeled #1 UNIT, #2 UNIT, and #3 UNIT.
For each unit, extract the GREEN LED number (usually the top number in the display).
- dryer1: Green value for #1 UNIT.
- dryer2: Green value for #2 UNIT.
- dryer3: Green value for #3 UNIT.
Ignore the red numbers below the green ones.
`;

const PROMPT_ZONE_3 = `
You are reading a "WATER CHILLER" control panel.
Locate the Red LED display. It is typically under a label like "TEMP. SWITCH" or similar on the left side.
Extract the numeric value shown in the Red LED.
- chillerTemp: The value.
`;

const PROMPT_ZONE_4 = `
You are reading a Temperature Controller panel with a vertical stack of Red LED displays.
Look for the bottom-most large Red LED display.
This corresponds to the "Outlet Temp" or "Set Temp".
Extract this value.
- axisTemp: The value.
`;

// --- SCHEMAS ---

const SCHEMA_ZONE_1: Schema = {
  type: Type.OBJECT,
  properties: {
    unwind2: { type: Type.NUMBER },
    rewind: { type: Type.NUMBER },
    unwind1: { type: Type.NUMBER },
    infeed: { type: Type.NUMBER },
    oven: { type: Type.NUMBER },
    speed: { type: Type.NUMBER },
  },
  required: ["unwind2", "rewind", "unwind1", "infeed", "oven", "speed"],
};

const SCHEMA_ZONE_2: Schema = {
  type: Type.OBJECT,
  properties: {
    dryer1: { type: Type.NUMBER, description: "Green number for Unit 1" },
    dryer2: { type: Type.NUMBER, description: "Green number for Unit 2" },
    dryer3: { type: Type.NUMBER, description: "Green number for Unit 3" },
  },
  required: ["dryer1", "dryer2", "dryer3"],
};

const SCHEMA_ZONE_3: Schema = {
  type: Type.OBJECT,
  properties: {
    chillerTemp: { type: Type.NUMBER, description: "Red LED value" },
  },
  required: ["chillerTemp"],
};

const SCHEMA_ZONE_4: Schema = {
  type: Type.OBJECT,
  properties: {
    axisTemp: { type: Type.NUMBER, description: "Bottom Red LED value" },
  },
  required: ["axisTemp"],
};

// --- CONFIGURATION MAP ---

export const ZONE_CONFIGS: Record<ZoneId, { instruction: string; schema: Schema }> = {
  zone1: { instruction: PROMPT_ZONE_1, schema: SCHEMA_ZONE_1 },
  zone2: { instruction: PROMPT_ZONE_2, schema: SCHEMA_ZONE_2 },
  zone3: { instruction: PROMPT_ZONE_3, schema: SCHEMA_ZONE_3 },
  zone4: { instruction: PROMPT_ZONE_4, schema: SCHEMA_ZONE_4 },
};