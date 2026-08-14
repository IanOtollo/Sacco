import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
  return `${amount < 0 ? "-" : ""}KES ${formatted}`
}

export function formatDate(
  isoDate: string | number,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
): string {
  return new Intl.DateTimeFormat("en-KE", options).format(new Date(isoDate))
}

export function formatDateTime(isoDate: string | number): string {
  return formatDate(isoDate, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
