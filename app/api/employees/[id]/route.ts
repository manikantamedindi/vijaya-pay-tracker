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

    // Get a specific employee by ID
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error fetching employee:', error);
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching employee:', error);
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

    // Update a specific employee by ID
    const { data, error } = await supabase
      .from('employees')
      .update({
        name: body.name,
        role: body.role,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error updating employee:', error);
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

    // Delete a specific employee by ID
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Employee deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
