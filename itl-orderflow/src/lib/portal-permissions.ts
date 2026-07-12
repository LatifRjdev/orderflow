export type PortalPermissionKey =
  | "canViewProjects"
  | "canViewProposals"
  | "canViewFinance"
  | "canViewDocuments"
  | "canViewTickets";

export const PORTAL_SECTIONS: { key: PortalPermissionKey; label: string }[] = [
  { key: "canViewProjects", label: "Проекты" },
  { key: "canViewProposals", label: "Предложения" },
  { key: "canViewFinance", label: "Счета" },
  { key: "canViewDocuments", label: "Документы" },
  { key: "canViewTickets", label: "Обращения" },
];
