import { NextResponse } from 'next/server'

export class APIError extends Error {
    constructor(
      message: string,
      public statusCode: number = 500,
      public code: string = 'INTERNAL_SERVER_ERROR'
    ) {
      super(message);
      this.name = 'APIError';
    }
  }
  
  export function handleAPIError(error: unknown) {
    console.error('API Error:', error);
  
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
  
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }