import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
<<<<<<< HEAD
} 
=======
} 


export const isIframe = window.self !== window.top;
>>>>>>> 9de21d4d2f6ac33c914ab8fc7c4a8a81454b6d63
