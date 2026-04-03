import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

/**
 * @fileOverview API to reconcile Google/OAuth profile data with MongoDB.
 * Ensures metadata like name and avatar are preserved in the artisan directory.
 */

export async function POST(req: NextRequest) {
  try {
    const { firebaseId, email, name, photoURL } = await req.json();
    
    if (!firebaseId) {
      return NextResponse.json({ message: 'Firebase ID required' }, { status: 400 });
    }

    await dbConnect();
    
    const fullName = name || '';
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');

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
          firstName: firstName || 'Collector',
          lastName: lastName || '',
          ...(email && { email: email.toLowerCase() }),
          lastLogin: new Date()
        },
        $setOnInsert: {
          role: 'buyer',
          emailVerified: true,
          status: 'active',
        }
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Log error but don't block the sign-in flow for the user
    console.error('[SYNC_PROFILE_ERROR]:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
