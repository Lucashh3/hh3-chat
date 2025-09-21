import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sanitizeCpf = (value: string) => value.replace(/\D/g, "");

export const isValidCpf = (value: string | null | undefined) => {
  if (!value) return false;
  const cpf = sanitizeCpf(value);
  if (cpf.length !== 11) return false;
  if (/^([0-9])\1+$/.test(cpf)) return false;

  const calcDigit = (factor: number) => {
    let total = 0;
    for (let i = 0; i < factor - 1; i += 1) {
      total += Number(cpf.charAt(i)) * (factor - i);
    }
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const digit1 = calcDigit(10);
  if (digit1 !== Number(cpf.charAt(9))) return false;

  const digit2 = calcDigit(11);
  if (digit2 !== Number(cpf.charAt(10))) return false;

  return true;
};
