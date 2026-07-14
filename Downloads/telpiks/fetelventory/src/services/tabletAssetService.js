import { createCrudService } from "./createCrudService";

export const TABLET_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const tabletAssetService = createCrudService("Devices & Office Output", "Tablet");
