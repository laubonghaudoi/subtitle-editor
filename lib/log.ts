const isProduction = process.env.NODE_ENV === "production";

export const warnDev = (...args: unknown[]) => {
  if (!isProduction) {
    console.warn(...args);
  }
};

export const errorDev = (...args: unknown[]) => {
  if (!isProduction) {
    console.error(...args);
  }
};
