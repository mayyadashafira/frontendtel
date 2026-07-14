import { createCrudService } from "./createCrudService";

export const KEYBOARD_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const keyboardAssetService = createCrudService("Peripherals & Accessories", "Keyboard");
