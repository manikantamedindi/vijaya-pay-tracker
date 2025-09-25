import { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get a specific booth person by ID
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error fetching user:', error);
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 });
    }

    // Update a specific booth person by ID
    const { data, error } = await supabase
      .from('users')
      .update({
        name: body.name,
        phone: body.phone,
        vpa: body.vpa,
        email: body.email,
        booth_id: body.booth_id,
        role: body.role,
        status: body.status
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error updating booth person:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 });
    }

    // Delete a specific booth person by ID
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Booth person deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting booth person:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}