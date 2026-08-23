import { NextResponse } from 'next/server';
import { disconnectInstagram } from '@/lib/actions/instagram-actions';
export async function POST() { try { await disconnectInstagram(); return NextResponse.json({ success: true }); } catch (error: any) { return NextResponse.json({ message: error.message }, { status: 403 }); } }
