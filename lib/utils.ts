import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EDITED_TOLERANCE_MS = 1000;

export function isMessageEdited(createdAt: Date | string, updatedAt: Date | string) {
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > EDITED_TOLERANCE_MS;
}
