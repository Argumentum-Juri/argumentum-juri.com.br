import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

export const textColors = {
  primary: 'text-gray-900',    // Darker primary text
  secondary: 'text-gray-700',  // Darker secondary text
  muted: 'text-gray-600',      // Darker muted text
  light: 'text-gray-500',      // More visible light text
};
