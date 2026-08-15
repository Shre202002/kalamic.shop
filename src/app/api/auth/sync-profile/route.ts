import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthenticatedSession } from '@/lib/server-auth';

/**
 * @fileOverview API to reconcile auth profile data with MongoDB.
 * Expanded to handle detailed registration metadata.
 */

export async function POST(req: NextRequest) {
  try {
    const {
      email, name, firstName, lastName, photoURL, phone
    } = await req.json();

    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const firebaseId = session.uid;
    const normalizedEmail = email?.trim().toLowerCase();
    if (normalizedEmail && session.email && normalizedEmail !== session.email.toLowerCase()) {
      return NextResponse.json({ message: 'Email does not match authenticated account' }, { status: 403 });
    }

    await dbConnect();
    
    const existingByEmail: any = normalizedEmail ? await User.findOne({ email: normalizedEmail }).lean() : null;
    if (existingByEmail && existingByEmail.firebaseId !== firebaseId) {
      return NextResponse.json({ message: 'Email is already linked to another account' }, { status: 409 });
    }

    const fullName = name || (firstName && lastName ? `${firstName} ${lastName}` : '');
    const [derivedFirst, ...lastNameParts] = fullName.split(' ');
    const derivedLast = lastNameParts.join(' ');

    await User.findOneAndUpdate(
      { 
        $or: [
          { firebaseId },
          { email: email?.toLowerCase() }
        ]
      },
      { 
        $set: { 
          firebaseId,
          firstName: firstName || derivedFirst || 'Collector',
          lastName: lastName || derivedLast || '',
          ...(normalizedEmail && { email: normalizedEmail }),
          ...(photoURL && { photoURL }),
          ...(phone && { phone }),
          emailVerified: session.email_verified === true,
          // Phone verification is temporarily disabled for the editable contact phone flow.
          // phoneVerified: Boolean(session.phone_number),
          lastLogin: new Date()
        },
        $setOnInsert: {
          role: 'buyer',
          status: 'active',
        }
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[SYNC_PROFILE_ERROR]:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
