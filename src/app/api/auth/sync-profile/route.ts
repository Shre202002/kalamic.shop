import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

/**
 * @fileOverview API to reconcile auth profile data with MongoDB.
 * Expanded to handle detailed registration metadata.
 */

export async function POST(req: NextRequest) {
  try {
    const { 
      firebaseId, email, name, firstName, lastName, photoURL, 
      phone, phoneVerified, emailVerified 
    } = await req.json();
    
    if (!firebaseId) {
      return NextResponse.json({ message: 'Firebase ID required' }, { status: 400 });
    }

    await dbConnect();
    
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
          ...(email && { email: email.toLowerCase() }),
          ...(photoURL && { photoURL }),
          ...(phone && { phone }),
          ...(typeof phoneVerified === 'boolean' && { phoneVerified }),
          ...(typeof emailVerified === 'boolean' && { emailVerified }),
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
