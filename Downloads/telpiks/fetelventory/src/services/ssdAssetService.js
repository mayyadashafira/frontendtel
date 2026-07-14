import { createCrudService } from "./createCrudService";

export const SSD_YEARS = ["2022", "2023", "2024", "2025", "2026"];

export const SSD_STATUSES = [
  { value: "IN USE", badge: "use" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const ssdAssetService = createCrudService("Storage Management", "SSD");
