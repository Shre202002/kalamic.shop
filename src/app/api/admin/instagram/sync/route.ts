import { NextResponse } from 'next/server';
import { syncInstagramMediaAsAdmin } from '@/lib/actions/instagram-actions';
export async function POST() { try { return NextResponse.json({ success: true, ...(await syncInstagramMediaAsAdmin()) }); } catch (error: any) { return NextResponse.json({ message: error.message }, { status: 400 }); } }
