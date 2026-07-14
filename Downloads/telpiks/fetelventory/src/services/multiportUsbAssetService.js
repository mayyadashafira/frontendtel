import { createCrudService } from "./createCrudService";

export const MULTIPORTUSB_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const multiportUsbAssetService = createCrudService("Peripherals & Accessories", "Multiport USB");
