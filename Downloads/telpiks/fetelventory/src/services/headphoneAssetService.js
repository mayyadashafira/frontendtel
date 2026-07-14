import { createCrudService } from "./createCrudService";

export const HEADPHONE_YEARS = ["2022", "2023", "2024", "2025", "2026"];

export const HEADPHONE_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const headphoneAssetService = createCrudService("Peripherals & Accessories", "Headphone");
