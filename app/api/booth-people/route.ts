import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get all users
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('Fetched data:', { data, count });
    return Response.json({ data, count }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Insert a new user
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name: body.name,
        email: body.email,
        phone: body.phone,
        booth_id: body.booth_id,
        role: body.role || 'user',
        status: body.status || 'active'
      }])
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating booth person:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return Response.json({ error: 'ID is required for updating' }, { status: 400 });
    }

    // Update an existing user
    const { data, error } = await supabase
      .from('users')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        booth_id: body.booth_id,
        role: body.role,
        status: body.status
      })
      .eq('id', body.id)
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

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return Response.json({ error: 'ID is required for deletion' }, { status: 400 });
    }

    // Delete a user
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