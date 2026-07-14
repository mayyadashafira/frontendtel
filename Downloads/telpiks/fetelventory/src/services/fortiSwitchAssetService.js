import { createCrudService } from "./createCrudService";

export const FORTISWITCH_MANUFACTURERS = ["DELL", "Cisco", "Fortinet", "Huawei", "Other"];

export const FORTISWITCH_STATUSES = [
  { value: "IN USE", badge: "good" },
  { value: "IN STORE", badge: "store" },
  { value: "BROKEN", badge: "broken" },
];

export const fortiSwitchAssetService = createCrudService("Network Infrastructure", "Fortiswitch");
