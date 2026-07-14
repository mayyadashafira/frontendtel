import { createCrudService } from "./createCrudService";

export const NETWORKPORT_MANUFACTURERS = ["Netviel", "Cisco", "Huawei", "TP-Link", "Mikrotik", "Other"];
export const NETWORKPORT_PORTS = [4, 8, 12, 16, 24, 48];
export const NETWORKPORT_YEARS = ["2022", "2023", "2024", "2025", "2026"];

export const networkPortAssetService = createCrudService("Network Infrastructure", "Network Part");
