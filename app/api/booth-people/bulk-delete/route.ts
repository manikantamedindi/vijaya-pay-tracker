import { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return Response.json({ 
        error: 'IDs array is required for bulk deletion',
        details: 'Please provide an array of IDs to delete'
      }, { status: 400 });
    }

    if (ids.length > 1000) {
      return Response.json({ 
        error: 'Too many records',
        details: 'Maximum 1000 records allowed per bulk delete'
      }, { status: 400 });
    }

    // Check if all IDs exist
    const { data: existingRecords, error: checkError } = await supabase
      .from('booth_people')
      .select('id')
      .in('id', ids);

    if (checkError) {
      return Response.json({ 
        error: 'Failed to check existing records',
        details: checkError.message
      }, { status: 500 });
    }

    if (existingRecords.length !== ids.length) {
      const existingIds = existingRecords.map(record => record.id);
      const missingIds = ids.filter(id => !existingIds.includes(id));
      return Response.json({ 
        error: 'Some records not found',
        details: `The following IDs were not found: ${missingIds.join(', ')}`
      }, { status: 404 });
    }

    // Perform bulk delete
    const { error: deleteError } = await supabase
      .from('booth_people')
      .delete()
      .in('id', ids);

    if (deleteError) {
      return Response.json({ 
        error: 'Failed to delete records',
        details: deleteError.message
      }, { status: 500 });
    }

    return Response.json({ 
      message: `Successfully deleted ${ids.length} records`,
      count: ids.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error in bulk delete:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}