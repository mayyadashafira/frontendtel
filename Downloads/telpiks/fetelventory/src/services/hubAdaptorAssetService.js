import { createCrudService } from "./createCrudService";

export const HUB_ADAPTOR_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const hubAdaptorAssetService = createCrudService("Peripherals & Accessories", "Hub / Adapter");
