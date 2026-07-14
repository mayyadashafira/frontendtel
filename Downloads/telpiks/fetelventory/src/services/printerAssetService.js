import { createCrudService } from "./createCrudService";

export const PRINTER_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const printerAssetService = createCrudService("Devices & Office Output", "Printer");
