import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL or VITE_SUPABASE_URL environment variable');
}

// Create admin client for server-side verification
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

/**
 * Extract and parse Bearer token from authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Decode JWT payload without verification (development mode only)
 */
function decodeJWTPayload(token: string): any {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  return {
    id: payload.sub,
    email: payload.email,
    ...payload
  };
}

/**
 * Verify token and get user information
 */
async function verifyToken(token: string): Promise<{ id: string; email: string; [key: string]: any } | null> {
  if (!supabaseAdmin) {
    // Development mode - decode without verification
    console.warn('⚠️  Running without token verification - development mode only!');
    return decodeJWTPayload(token);
  }

  // Verify the token using Supabase admin client
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
    ...user.user_metadata
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const user = await verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Optional middleware - allows requests to pass through with or without auth
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (token) {
      const user = await verifyToken(token);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Silently continue even if auth fails
    next();
  }
}
