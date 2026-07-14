import { createCrudService } from "./createCrudService";

export const CAST_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const castAssetService = createCrudService("Devices & Office Output", "Cast");
