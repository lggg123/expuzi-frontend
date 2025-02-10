import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auditToken } from '@/services/auditToken';
import { validateRequest } from '@/middleware/validateRequest';
import { rateLimit } from '@/middleware/rateLimit';
import { handleAPIError } from '@/lib/errors';
import type { TokenAuditRequest, TokenAuditResponse } from '@/types/api';

const auditSchema = z.object({
  tokenSymbol: z.string().min(1).max(10),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    // Input validation
    const { data, error } = await validateRequest(auditSchema)(request);
    if (error) return error;

    // Process request
    const result: TokenAuditResponse = await auditToken(data.tokenSymbol);
    return NextResponse.json(result);

  } catch (error) {
    return handleAPIError(error);
  }
} 