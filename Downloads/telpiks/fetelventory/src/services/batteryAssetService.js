import { createCrudService } from "./createCrudService";

export const BATTERY_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const batteryAssetService = createCrudService("Hardware & Components", "Battery NB");
