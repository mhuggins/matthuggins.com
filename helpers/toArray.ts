export const toArray = <T>(t: T | T[]) => Array.isArray(t) ? t : [t];
