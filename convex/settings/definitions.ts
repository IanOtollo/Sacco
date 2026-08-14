export const SETTINGS_DEFINITIONS = {
  "sacco.name": { description: "Sacco name", default: "Client Sacco" },
  "sacco.registrationNumber": { description: "Registration number", default: "" },
  "sacco.address": {
    description: "Physical/postal address",
    default: "Nairobi, Kenya",
  },
  "sacco.phone": {
    description: "Contact phone number",
    default: "+254 700 000 000",
  },
  "sacco.email": {
    description: "Contact email",
    default: "info@clientsacco.co.ke",
  },
  "financial.minMonthlySavings": {
    description: "Minimum monthly savings contribution (KES)",
    default: "500",
  },
  "financial.minMonthlyShares": {
    description: "Minimum monthly shares contribution (KES)",
    default: "200",
  },
  "financial.registrationFee": {
    description: "One-off registration fee (KES)",
    default: "1000",
  },
  "financial.fyStartMonth": {
    description: "Financial year start month (1-12)",
    default: "1",
  },
  "loan.defaultGracePeriodDays": {
    description: "Default grace period before first repayment (days)",
    default: "30",
  },
  "loan.maxActiveLoansPerMember": {
    description: "Maximum active loans per member",
    default: "1",
  },
  "loan.latePenaltyGraceDays": {
    description: "Days late before a penalty applies",
    default: "5",
  },
} as const;

export type SettingsKey = keyof typeof SETTINGS_DEFINITIONS;
