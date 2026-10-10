/** Human-readable message from anything thrown (API errors are normalised in services/api/client.ts). */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong'): string =>
  error instanceof Error && error.message ? error.message : fallback;
