import { NextResponse } from 'next/server';
import { getInstagramStatus } from '@/lib/actions/instagram-actions';
export async function GET() { try { return NextResponse.json(await getInstagramStatus()); } catch (error: any) { return NextResponse.json({ message: error.message }, { status: 403 }); } }
