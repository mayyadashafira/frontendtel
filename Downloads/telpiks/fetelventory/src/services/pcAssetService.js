import { createCrudService } from "./createCrudService";

export const PC_CONDITIONS = ["Good", "Broken"];

export const PC_LOCATIONS = ["Workshop", "Room 32", "Room 33"];

export const pcAssetService = createCrudService("List PC & Workstation", "PC");
