import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function isAdmin(request: Request): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and has admin role
  if (!session?.user?.email) {
    return false;
  }

  // Get admin emails from environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(session.user.email);
} 