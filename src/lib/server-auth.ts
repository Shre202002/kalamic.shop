import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { verifySession } from '@/lib/firebase-admin';

export async function getAuthenticatedSession() {
  const token = (await cookies()).get('__session')?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireAdmin(allowedRoles: string[] = ['super_admin', 'admin']) {
  const session = await getAuthenticatedSession();
  if (!session) throw new Error('Unauthorized');

  await dbConnect();
  const user: any = await User.findOne({ firebaseId: session.uid }).lean();
  if (!user || !allowedRoles.includes(user.role)) throw new Error('Unauthorized');
  return { session, user };
}

export async function requireUserId(expectedUserId: string) {
  const session = await getAuthenticatedSession();
  if (!session || session.uid !== expectedUserId) throw new Error('Unauthorized');
  return session;
}
