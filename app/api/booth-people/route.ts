import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    // Add search functionality
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,vpa.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('inserted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('Fetched booth people:', { data, count });
    return Response.json({ 
      data, 
      count,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching booth people:', error);
    return Response.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Bulk upload functionality
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.boothPeople || !Array.isArray(body.boothPeople)) {
      return Response.json({ 
        error: 'Invalid request format', 
        details: 'boothPeople array is required' 
      }, { status: 400 });
    }

    if (body.boothPeople.length === 0) {
      return Response.json({ 
        error: 'Empty array', 
        details: 'boothPeople array cannot be empty' 
      }, { status: 400 });
    }

    if (body.boothPeople.length > 1000) {
      return Response.json({ 
        error: 'Array too large', 
        details: 'Maximum 1000 records allowed per bulk upload' 
      }, { status: 400 });
    }

    const boothPeople = body.boothPeople.map((person: any, index: number) => {
      // Validate each record
      if (!person.name || !person.phone || !person.vpa) {
        throw new Error(`Record ${index + 1}: Name, phone, and VPA are required`);
      }

      // Validate phone format
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(person.phone)) {
        throw new Error(`Record ${index + 1}: Phone number must be 10 digits`);
      }

      // Validate VPA format
      const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
      if (!vpaRegex.test(person.vpa)) {
        throw new Error(`Record ${index + 1}: VPA must be in format like username@bank`);
      }

      return {
        name: person.name.trim(),
        phone: person.phone.trim(),
        vpa: person.vpa.trim(),
        email: person.email?.trim() || null,
        booth_id: person.booth_id?.trim() || null,
        role: person.role?.trim() || 'booth_person',
        status: person.status?.trim() || 'active'
      };
    });

    // Use upsert for bulk operations (insert or update)
    const { data, error } = await supabase
      .from('users')
      .upsert(boothPeople, { 
        onConflict: 'phone,vpa',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return Response.json({ 
          error: 'Duplicate entries found', 
          details: 'Some phone numbers or VPAs already exist' 
        }, { status: 409 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ 
      data, 
      message: `Successfully uploaded ${data?.length || 0} booth people records`,
      count: data?.length || 0
    }, { status: 200 });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    return Response.json({ 
      error: 'Bulk upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.phone || !body.vpa) {
      return Response.json({ 
        error: 'Missing required fields', 
        details: 'Name, phone, and VPA are required' 
      }, { status: 400 });
    }

    // Validate phone format (should be 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(body.phone)) {
      return Response.json({ 
        error: 'Invalid phone format', 
        details: 'Phone number must be 10 digits' 
      }, { status: 400 });
    }

    // Validate VPA format (basic validation)
    const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    if (!vpaRegex.test(body.vpa)) {
      return Response.json({ 
        error: 'Invalid VPA format', 
        details: 'VPA must be in format like username@bank' 
      }, { status: 400 });
    }
    
    // Insert a new booth person
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name: body.name.trim(),
        phone: body.phone.trim(),
        vpa: body.vpa.trim(),
        email: body.email?.trim() || null,
        booth_id: body.booth_id?.trim() || null,
        role: body.role?.trim() || 'booth_person',
        status: body.status?.trim() || 'active'
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return Response.json({ 
          error: 'Duplicate entry', 
          details: 'Phone number or VPA already exists' 
        }, { status: 409 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data, message: 'Booth person created successfully' }, { status: 201 });
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

    // Validate phone format if provided
    if (body.phone) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(body.phone)) {
        return Response.json({ 
          error: 'Invalid phone format', 
          details: 'Phone number must be 10 digits' 
        }, { status: 400 });
      }
    }

    // Validate VPA format if provided
    if (body.vpa) {
      const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
      if (!vpaRegex.test(body.vpa)) {
        return Response.json({ 
          error: 'Invalid VPA format', 
          details: 'VPA must be in format like username@bank' 
        }, { status: 400 });
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.vpa !== undefined) updateData.vpa = body.vpa.trim();
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.booth_id !== undefined) updateData.booth_id = body.booth_id?.trim() || null;
    if (body.role !== undefined) updateData.role = body.role?.trim();
    if (body.status !== undefined) updateData.status = body.status?.trim();

    // Update an existing booth person
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return Response.json({ 
          error: 'Duplicate entry', 
          details: 'Phone number or VPA already exists' 
        }, { status: 409 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data, message: 'Booth person updated successfully' }, { status: 200 });
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

    // Check if booth person exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return Response.json({ error: 'Booth person not found' }, { status: 404 });
    }

    // Delete a booth person
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