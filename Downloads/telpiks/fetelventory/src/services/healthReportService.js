import { createCrudService } from "./createCrudService";

export const HEALTH_MONTHS = [
  "All Month",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const HEALTH_STATUSES = [
  { value: "Very Good", badge: "good" },
  { value: "Good", badge: "good" },
  { value: "Bad", badge: "critical" },
  { value: "Very Bad", badge: "broken" },
];

export const healthReportService = createCrudService("Storage Management", "HDD", { subSub: "HDD Health" });
