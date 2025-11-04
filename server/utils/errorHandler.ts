import { Response } from 'express';

/**
 * Send a standardized error response
 */
export function sendErrorResponse(
  res: Response,
  statusCode: number,
  error: string,
  details?: string | Error
): void {
  const response: { error: string; message?: string } = { error };
  
  if (details) {
    response.message = details instanceof Error ? details.message : details;
  }
  
  res.status(statusCode).json(response);
}

/**
 * Handle async route errors consistently
 */
export function handleRouteError(
  res: Response,
  error: unknown,
  operation: string
): void {
  console.error(`Error in ${operation}:`, error);
  sendErrorResponse(
    res,
    500,
    'Internal server error',
    error instanceof Error ? error.message : undefined
  );
}
