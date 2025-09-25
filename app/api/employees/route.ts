import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get all employees
    const { data, error, count } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .order('inserted_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('Fetched data:', { data, count });
    return Response.json({ data, count }, { status: 200 });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return Response.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Insert a new employee
    const { data, error } = await supabase
      .from('employees')
      .insert([{
        name: body.name,
        role: body.role,
      }])
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
