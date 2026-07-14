import { createCrudService } from "./createCrudService";

export const FLASHDISK_STATUSES = [
  { value: "IN USE", badge: "use" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const flashdiskAssetService = createCrudService("Storage Management", "Flashdisk");
