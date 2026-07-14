import { createCrudService } from "./createCrudService";

export const MSW_MANUFACTURERS = ["DELL", "Logitech", "HP", "Other"];
export const MSW_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const mswAssetService = createCrudService("Peripherals & Accessories", "MSW");
