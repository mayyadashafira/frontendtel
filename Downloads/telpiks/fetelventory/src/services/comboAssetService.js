import { createCrudService } from "./createCrudService";

export const COMBO_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const comboAssetService = createCrudService("Peripherals & Accessories", "Combo");
