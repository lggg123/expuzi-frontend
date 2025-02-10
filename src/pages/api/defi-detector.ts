import { NextApiRequest, NextApiResponse } from 'next';
import { auditToken } from '@/services/auditToken/index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokenSymbol } = req.body;

    if (!tokenSymbol) {
      return res.status(400).json({ error: 'Token symbol is required' });
    }

    const result = await auditToken(tokenSymbol);
    res.status(200).json(result);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to audit token' });
  }
} 