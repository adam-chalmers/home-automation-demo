export const isError = (obj: unknown): obj is Error => {
  return !!obj && typeof obj === "object" && "message" in obj;
};

export const logError = (message: string, err: unknown) => {
  if (isError(err)) {
    message += `: ${err.message}`;
  }

  console.error(message);
};
