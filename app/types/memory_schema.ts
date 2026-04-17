export enum MemoryType {
  PLACE = "place",
  PREFERENCE = "preference",
  CONTEXTUAL = "contextual",
  TEMPORARY = "temporary",
  OTHER = "other"
}

export interface FlagOptions {
  useForRouting?: boolean;
  avoid?: boolean;
  favorite?: boolean;
  temporary?: boolean;
}

export interface MemoryEntry {
  key: string; // e.g. "home_address", "preferred_gas"
  value: string | boolean | number | object;
  type: MemoryType;
  createdAt: number; // timestamp
  updatedAt?: number;
  use_count?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  flags?: FlagOptions;
  confidence?: "confirmed" | "inferred";
  source?: "user" | "gpt" | "location_context" | "system";
  requiresConfirmation?: boolean;
}

export interface MemoryStore {
  places: MemoryEntry[];
  preferences: MemoryEntry[];
  people: MemoryEntry[];
  context: MemoryEntry[];
  temporary: MemoryEntry[];
  habits: MemoryEntry[];
  tasks: MemoryEntry[];
  routes: MemoryEntry[];
  vehicles: MemoryEntry[];
  other: MemoryEntry[];

}