import { createCrudService } from "./createCrudService";

export const HDD_STATUSES = [
  { value: "IN USE", badge: "use" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const hddAssetService = createCrudService("Storage Management", "HDD", { subSubEmpty: true });
