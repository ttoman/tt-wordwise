import { documentService } from '@/lib/documentService';
import { NextRequest, NextResponse } from 'next/server';

console.log('🔄 Individual Document API route loaded');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/[id] - Get a specific document
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  console.log('📥 GET /api/documents/[id] - Fetching document');

  try {
    const { id } = await params;
    console.log('🔍 GET /api/documents/[id] - Document ID:', id);

    const result = await documentService.getDocument(id);

    if (!result.success) {
      console.error('❌ GET /api/documents/[id] - Error:', result.error);
      const status = result.error === 'User not authenticated' ? 401 :
                    result.error === 'Document not found or access denied' ? 404 : 500;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    console.log('✅ GET /api/documents/[id] - Document retrieved:', result.data?.id);
    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ GET /api/documents/[id] - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/documents/[id] - Update a document
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  console.log('📥 PUT /api/documents/[id] - Updating document');

  try {
    const { id } = await params;
    const body = await request.json();
    console.log('🔍 PUT /api/documents/[id] - Document ID:', id);
    console.log('📄 PUT /api/documents/[id] - Request body:', body);

    const { title, content } = body;

    const result = await documentService.saveDoc(id, { title, content });

    if (!result.success) {
      console.error('❌ PUT /api/documents/[id] - Error:', result.error);
      const status = result.error === 'User not authenticated' ? 401 :
                    result.error === 'Document not found or access denied' ? 404 : 500;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    console.log('✅ PUT /api/documents/[id] - Document updated:', result.data?.id);
    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ PUT /api/documents/[id] - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id] - Delete a document
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  console.log('📥 DELETE /api/documents/[id] - Deleting document');

  try {
    const { id } = await params;
    console.log('🔍 DELETE /api/documents/[id] - Document ID:', id);

    const result = await documentService.deleteDoc(id);

    if (!result.success) {
      console.error('❌ DELETE /api/documents/[id] - Error:', result.error);
      const status = result.error === 'User not authenticated' ? 401 :
                    result.error === 'Document not found or access denied' ? 404 : 500;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    console.log('✅ DELETE /api/documents/[id] - Document deleted');
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('❌ DELETE /api/documents/[id] - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}