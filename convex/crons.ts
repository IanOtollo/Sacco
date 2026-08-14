import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 3 AM UTC = 6 AM EAT
crons.daily(
  "check-overdue-installments",
  { hourUTC: 3, minuteUTC: 0 },
  internal.loans.crons.checkOverdueInstallments
);

// 5 AM UTC = 8 AM EAT
crons.daily(
  "payment-due-reminders",
  { hourUTC: 5, minuteUTC: 0 },
  internal.loans.crons.sendPaymentReminders
);

crons.monthly(
  "check-dormant-accounts",
  { day: 1, hourUTC: 3, minuteUTC: 0 },
  internal.members.crons.checkDormantAccounts
);

export default crons;
