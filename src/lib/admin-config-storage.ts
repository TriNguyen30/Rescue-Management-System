/**
 * Client-side admin configuration (categories + system parameters).
 * Persisted in localStorage until a backend settings API exists.
 */

const PREFIX = "rescue_admin_";

export const STORAGE_KEYS = {
  inventoryCategories: `${PREFIX}inventory_categories`,
  systemParams: `${PREFIX}system_params`,
} as const;

export type SystemParameters = {
  organizationName: string;
  supportEmail: string;
  supportPhone: string;
  defaultMapZoom: number;
  itemsPerPage: number;
  reportDefaultDays: number;
  enablePublicRescueMap: boolean;
  reliefHotline: string;
};

export const DEFAULT_SYSTEM_PARAMS: SystemParameters = {
  organizationName: "Rescue AID",
  supportEmail: "",
  supportPhone: "",
  defaultMapZoom: 12,
  itemsPerPage: 10,
  reportDefaultDays: 30,
  enablePublicRescueMap: true,
  reliefHotline: "",
};

export const DEFAULT_INVENTORY_CATEGORIES = [
  "Lương thực",
  "Nước uống & thiết yếu",
  "Y tế & thuốc",
  "Chăn màn & quần áo",
  "Khác",
];

export function loadCategories(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.inventoryCategories);
    if (!raw) return [...DEFAULT_INVENTORY_CATEGORIES];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed.filter((s) => s.trim().length > 0);
    }
  } catch {
    /* ignore */
  }
  return [...DEFAULT_INVENTORY_CATEGORIES];
}

export function saveCategories(categories: string[]): void {
  const unique = Array.from(new Set(categories.map((c) => c.trim()).filter(Boolean)));
  localStorage.setItem(STORAGE_KEYS.inventoryCategories, JSON.stringify(unique));
}

export function loadSystemParams(): SystemParameters {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.systemParams);
    if (!raw) return { ...DEFAULT_SYSTEM_PARAMS };
    const parsed = JSON.parse(raw) as Partial<SystemParameters>;
    return { ...DEFAULT_SYSTEM_PARAMS, ...parsed };
  } catch {
    return { ...DEFAULT_SYSTEM_PARAMS };
  }
}

export function saveSystemParams(params: SystemParameters): void {
  localStorage.setItem(STORAGE_KEYS.systemParams, JSON.stringify(params));
}
