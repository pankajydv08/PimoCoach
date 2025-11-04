import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

/**
 * Verify user is authenticated and return user ID
 * Returns null and sends error response if not authenticated
 */
export function verifyAuthUser(req: AuthRequest, res: Response): string | null {
  const user_id = req.user?.id;
  
  if (!user_id) {
    res.status(401).json({ error: 'User not authenticated' });
    return null;
  }
  
  return user_id;
}

/**
 * Check if user is authenticated (returns boolean without sending response)
 */
export function isAuthenticated(req: AuthRequest): boolean {
  return !!req.user?.id;
}
