import { createCrudService } from "./createCrudService";

export const DONGLEWIFI_YEARS = ["2022", "2023", "2024", "2025", "2026"];

export const DONGLEWIFI_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const dongleWifiAssetService = createCrudService("Network Infrastructure", "Dogle Wi-Fi");
