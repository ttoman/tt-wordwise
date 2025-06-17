import { serverDocumentService } from '@/lib/documentService.server';
import { NextRequest, NextResponse } from 'next/server';

console.log('🔄 Documents API route loaded');

/**
 * GET /api/documents - Get all documents for authenticated user
 */
export async function GET() {
  console.log('📥 GET /api/documents - Fetching all documents');

  try {
    const result = await serverDocumentService.getDocuments();

    if (!result.success) {
      console.error('❌ GET /api/documents - Error:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'User not authenticated' ? 401 : 500 }
      );
    }

    console.log('✅ GET /api/documents - Success:', result.data?.length, 'documents');
    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ GET /api/documents - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents - Create a new document
 */
export async function POST(request: NextRequest) {
  console.log('📥 POST /api/documents - Creating new document');

  try {
    const body = await request.json();
    console.log('📄 POST /api/documents - Request body:', body);

    const { title, content } = body;

    const result = await serverDocumentService.createDoc({ title, content });

    if (!result.success) {
      console.error('❌ POST /api/documents - Error:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'User not authenticated' ? 401 : 500 }
      );
    }

    console.log('✅ POST /api/documents - Document created:', result.data?.id);
    return NextResponse.json({
      success: true,
      data: result.data
    }, { status: 201 });

  } catch (error) {
    console.error('❌ POST /api/documents - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}