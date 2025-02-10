import { NextResponse } from 'next/server';
import { z } from 'zod';

export function validateRequest<T>(schema: z.Schema<T>) {
  return async (request: Request) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return { data: validatedData, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: NextResponse.json(
            { error: error.errors },
            { status: 400 }
          )
        };
      }
      return {
        data: null,
        error: NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        )
      };
    }
  };
} 