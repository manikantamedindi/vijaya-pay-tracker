import { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

// Ensure supabaseAdmin is available, fallback to regular supabase if not
const dbClient = supabaseAdmin || supabase;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('booth_people')
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

// Bulk upload functionality via CSV
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle CSV file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return Response.json({ 
          error: 'No file provided', 
          details: 'Please upload a CSV file' 
        }, { status: 400 });
      }

      // Read and parse CSV file
      const csvText = await file.text();
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return Response.json({ 
          error: 'Invalid CSV format', 
          details: 'CSV must have header row and at least one data row' 
        }, { status: 400 });
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['name', 'phone', 'vpa'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        return Response.json({ 
          error: 'Missing required columns', 
          details: `Missing: ${missingHeaders.join(', ')}` 
        }, { status: 400 });
      }

      const boothPeople = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const person: any = {};
        
        headers.forEach((header, i) => {
          person[header] = values[i] || '';
        });

        // Validate each record
        if (!person.name || !person.phone || !person.vpa) {
          throw new Error(`Row ${index + 2}: Name, phone, and VPA are required`);
        }

        // Validate phone format
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(person.phone)) {
          throw new Error(`Row ${index + 2}: Phone number must be 10 digits`);
        }

        // Validate VPA format
        const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
        if (!vpaRegex.test(person.vpa)) {
          throw new Error(`Row ${index + 2}: VPA must be in format like username@bank`);
        }

        return {
        name: person.name.trim(),
        phone: person.phone.trim(),
        vpa: person.vpa.trim(),
        email: person.email?.trim() || null,
        status: person.status?.trim() || 'Active'
      };
      });

      if (boothPeople.length > 1000) {
        return Response.json({ 
          error: 'File too large', 
          details: 'Maximum 1000 records allowed per bulk upload' 
        }, { status: 400 });
      }

      // Use upsert for bulk operations (insert or update)
      const { data, error } = await supabase
        .from('booth_people')
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
    }
    
    // Handle single person creation (existing functionality)
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
      .from('booth_people')
      .insert([{
        name: body.name.trim(),
        phone: body.phone.trim(),
        vpa: body.vpa.trim(),
        email: body.email?.trim() || null,
        status: body.status?.trim() || 'Active'
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
    console.error('Error in request:', error);
    return Response.json({ 
      error: 'Request failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}



export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle bulk update
    if (body.boothPeople && Array.isArray(body.boothPeople)) {
      if (body.boothPeople.length === 0) {
        return Response.json({ 
          error: 'Empty array', 
          details: 'boothPeople array cannot be empty' 
        }, { status: 400 });
      }

      if (body.boothPeople.length > 1000) {
        return Response.json({ 
          error: 'Array too large', 
          details: 'Maximum 1000 records allowed per bulk update' 
        }, { status: 400 });
      }

      const boothPeople = body.boothPeople.map((person: any, index: number) => {
        // Validate each record
        if (!person.id) {
          throw new Error(`Record ${index + 1}: ID is required for update`);
        }

        // Validate phone format if provided
        if (person.phone) {
          const phoneRegex = /^\d{10}$/;
          if (!phoneRegex.test(person.phone)) {
            throw new Error(`Record ${index + 1}: Phone number must be 10 digits`);
          }
        }

        // Validate VPA format if provided
        if (person.vpa) {
          const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
          if (!vpaRegex.test(person.vpa)) {
            throw new Error(`Record ${index + 1}: VPA must be in format like username@bank`);
          }
        }

        // Build update object with only provided fields
        const updateData: any = { id: person.id };
        if (person.name !== undefined) updateData.name = person.name.trim();
        if (person.phone !== undefined) updateData.phone = person.phone.trim();
        if (person.vpa !== undefined) updateData.vpa = person.vpa.trim();
        if (person.email !== undefined) updateData.email = person.email?.trim() || null;
        if (person.status !== undefined) updateData.status = person.status?.trim() || 'Active';

        return updateData;
      });

      // Use upsert for bulk operations (insert or update)
      const { data, error } = await supabase
        .from('booth_people')
        .upsert(boothPeople, { 
          onConflict: 'id',
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
        message: `Successfully updated ${data?.length || 0} booth people records`,
        count: data?.length || 0
      }, { status: 200 });
    }
    
    // Handle single update
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
    if (body.status !== undefined) updateData.status = body.status?.trim() || null;

    // Check if any fields are being updated
    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: 'No fields provided for update' }, { status: 400 });
    }

    console.log('Updating person with ID:', body.id, 'with data:', updateData);

    // First, check if the person exists - try with string ID first
    let personId = body.id;
    if (typeof personId === 'string') {
      personId = parseInt(personId, 10);
    }

    console.log('Using ID (converted to number if needed):', personId);

    // Let's try a simple select first to see if we can query the table
    const { data: testQuery, error: testError } = await supabase
      .from('booth_people')
      .select('*')
      .eq('id', personId)
      .single();

    console.log('Test query result:', testQuery, 'error:', testError);

    if (testError || !testQuery) {
      return Response.json({ error: 'Booth person not found' }, { status: 404 });
    }

    // Update an existing booth person
    console.log('About to update with data:', updateData, 'for ID:', personId);
    
    // Use admin client if available to bypass RLS policies, otherwise use regular client
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('booth_people')
      .update(updateData)
      .eq('id', personId)
      .select();

    console.log('Update result:', data, 'error:', error);

    if (error) {
      console.error('Update error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Check if any rows were actually updated
    if (!data || data.length === 0) {
      return Response.json({ error: 'Booth person not found or no changes made' }, { status: 404 });
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
      .from('booth_people')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return Response.json({ error: 'Booth person not found' }, { status: 404 });
    }

    // Delete a booth person
    const { error } = await supabase
      .from('booth_people')
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