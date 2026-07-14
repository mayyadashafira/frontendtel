import { createCrudService } from "./createCrudService";

export const HDMIPORT_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const hdmiPortAssetService = createCrudService("Peripherals & Accessories", "HDMIPort");
