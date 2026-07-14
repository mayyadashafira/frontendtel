import { createCrudService } from "./createCrudService";

export const UPS_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const upsAssetService = createCrudService("Devices & Office Output", "UPS");
