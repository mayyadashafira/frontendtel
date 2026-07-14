import { createCrudService } from "./createCrudService";

export const WEBCAM_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const webcamAssetService = createCrudService("Peripherals & Accessories", "Webcam");
