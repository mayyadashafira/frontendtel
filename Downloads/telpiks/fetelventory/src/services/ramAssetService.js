import { createCrudService } from "./createCrudService";

export const RAM_YEARS = ["2022", "2023", "2024", "2025", "2026"];

export const RAM_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const ramAssetService = createCrudService("Hardware & Components", "RAM");
