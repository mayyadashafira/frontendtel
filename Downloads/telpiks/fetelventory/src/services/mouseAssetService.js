import { createCrudService } from "./createCrudService";

export const MOUSE_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const mouseAssetService = createCrudService("Peripherals & Accessories", "MS");
