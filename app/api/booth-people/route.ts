import { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

// Ensure supabaseAdmin is available, fallback to regular supabase if not
const dbClient = supabaseAdmin || supabase;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search');
    
    // If limit is 'all', fetch all records without pagination
    const limit = limitParam === 'all' ? 1000000 : parseInt(limitParam || '50');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('booth_people')
      .select('*', { count: 'exact' });

    // Add search functionality
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,customerVPAs.ilike.%${search}%`);
    }

    let data, error, count;
    
    if (limit === 1000000) {
      // For 'all' records, fetch in batches of 1000 to avoid Supabase limit
      const batchSize = 1000;
      let allData: any[] = [];
      let totalCount = 0;
      let batchOffset = 0;
      
      // First, get the total count
      const { count: totalRecords } = await query;
      totalCount = totalRecords || 0;
      
      // Fetch all records in batches
      while (batchOffset < totalCount) {
        const batchQuery = supabase
          .from('booth_people')
          .select('*')
          .order('inserted_at', { ascending: false })
          .range(batchOffset, Math.min(batchOffset + batchSize - 1, totalCount - 1));
        
        // Add search to batch query if provided
        if (search) {
          batchQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%,customerVPAs.ilike.%${search}%`);
        }
        
        const batchResult = await batchQuery;
        
        if (batchResult.error) {
          throw batchResult.error;
        }
        
        allData = allData.concat(batchResult.data || []);
        batchOffset += batchSize;
      }
      
      data = allData;
      error = null;
      count = totalCount;
    } else {
      // For paginated requests, use range
      const queryResult = await query
        .order('inserted_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      data = queryResult.data;
      error = queryResult.error;
      count = queryResult.count;
    }

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('Fetched booth people:', { data, count });
    
    return Response.json({ 
      data: data, 
      count,
      pagination: limit === 1000000 ? null : {
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

      const headers = lines[0].split(',').map(h => h.trim());
      
      // Map common header variations to standard names (case-insensitive)
      const headerMapping: { [key: string]: string } = {
        'name': 'name',
        'Name': 'name',
        'NAME': 'name',
        'phone': 'phone',
        'Phone': 'phone',
        'PHONE': 'phone',
        'customerVPAs': 'customerVPAs',
        'CustomerVPAs': 'customerVPAs',
        'CUSTOMERVPAS': 'customerVPAs',
        'customer_vpas': 'customerVPAs',
        'Customer_VPAs': 'customerVPAs',
        'vpa': 'customerVPAs',
        'VPA': 'customerVPAs',
        'vpas': 'customerVPAs',
        'VPAs': 'customerVPAs',
        'email': 'email',
        'Email': 'email',
        'EMAIL': 'email',
        'status': 'status',
        'Status': 'status',
        'STATUS': 'status'
      };
      
      // Normalize headers using the mapping (handle case variations)
      const normalizedHeaders = headers.map(header => {
        // Try exact match first
        if (headerMapping[header]) {
          return headerMapping[header];
        }
        // Try lowercase match
        const lowerHeader = header.toLowerCase();
        if (headerMapping[lowerHeader]) {
          return headerMapping[lowerHeader];
        }
        // Try without spaces and lowercase
        const cleanHeader = header.toLowerCase().replace(/\s+/g, '');
        if (headerMapping[cleanHeader]) {
          return headerMapping[cleanHeader];
        }
        return header;
      });
      
      const requiredHeaders = ['name', 'phone', 'customerVPAs'];
      const missingHeaders = requiredHeaders.filter(h => !normalizedHeaders.includes(h));
      
      if (missingHeaders.length > 0) {
        return Response.json({ 
          error: 'Missing required columns', 
          details: `Missing: ${missingHeaders.join(', ')}. Expected columns: name, phone, customerVPAs (or variations like vpa, customer_vpas)` 
        }, { status: 400 });
      }

      const boothPeople = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const person: any = {};
        
        normalizedHeaders.forEach((header, i) => {
          person[header] = values[i] || '';
        });

        // Validate each record
        if (!person.name || !person.phone || !person.customerVPAs) {
          throw new Error(`Row ${index + 2}: Name, phone, and customerVPAs are required`);
        }

        // Validate phone format
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(person.phone)) {
          throw new Error(`Row ${index + 2}: Phone number must be 10 digits`);
        }

        // Validate VPA format
        const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
        if (!vpaRegex.test(person.customerVPAs)) {
          throw new Error(`Row ${index + 2}: VPA must be in format like username@bank`);
        }

        return {
        name: person.name.trim(),
        phone: person.phone.trim(),
        customerVPAs: person.customerVPAs.trim(),
        email: person.email?.trim() || null,
        status: person.status?.trim() || 'Active'
      };
      });

      if (boothPeople.length > 3000) {
        return Response.json({ 
          error: 'File too large', 
          details: 'Maximum 3000 records allowed per bulk upload' 
        }, { status: 400 });
      }

      // Use simple insert for bulk operations (no upsert due to missing unique constraints)
      const { data, error } = await supabase
        .from('booth_people')
        .insert(boothPeople)
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
        data: data, 
        message: `Successfully uploaded ${data?.length || 0} booth people records`,
        count: data?.length || 0
      }, { status: 200 });
    }
    
    // Handle single person creation (existing functionality)
    const body = await request.json();
    
    // Validate required fields - accept both 'vpa' and 'customerVPAs'
    const vpaValue = body.vpa || body.customerVPAs;
    if (!body.name || !body.phone || !vpaValue) {
      return Response.json({ 
        error: 'Missing required fields', 
        details: 'Name, phone, and VPA (or customerVPAs) are required' 
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
    if (!vpaRegex.test(vpaValue)) {
      return Response.json({ 
        error: 'Invalid VPA format', 
        details: 'VPA must be in format like username@bank' 
      }, { status: 400 });
    }
    
    // Try inserting with all required fields based on the error
    let insertData = {
      name: body.name.trim(),
      phone: body.phone.trim(),
      cc_no: body.cc_no?.trim() || '', // cc_no is required based on the error
      route_no: body.route_no?.trim() || '' // route_no might also be required
    };

    // Try different VPA column names in order of likelihood
    const possibleVpaColumns = ['vpa', 'vpas', 'customer_vpas', 'customerVPAs'];
    let insertError = null;
    let insertResult = null;

    for (const vpaColumn of possibleVpaColumns) {
      try {
        let testData = { ...insertData, [vpaColumn]: vpaValue.trim() };
        
        let { data, error } = await supabase
          .from('booth_people')
          .insert([testData])
          .select()
          .single();
        
        if (!error) {
          insertResult = { data, error: null };
          break;
        } else if (error.message.includes("column") && error.message.includes("does not exist")) {
          insertError = error;
          continue;
        } else {
          insertError = error;
          break;
        }
      } catch (err) {
        insertError = err;
        continue;
      }
    }

    const { data, error } = insertResult || { data: null, error: insertError };

    if (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') { // Unique constraint violation
        return Response.json({ 
          error: 'Duplicate entry', 
          details: 'Phone number or VPA already exists' 
        }, { status: 409 });
      }
      return Response.json({ 
        error: typeof error === 'object' && error !== null && 'message' in error ? error.message : 'Database error',
        details: error
      }, { status: 500 });
    }

    return Response.json({ data: data, message: 'Booth person created successfully' }, { status: 201 });
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

      if (body.boothPeople.length > 3000) {
        return Response.json({ 
          error: 'Array too large', 
          details: 'Maximum 3000 records allowed per bulk update' 
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
        if (person.vpa !== undefined) updateData.customerVPAs = person.vpa.trim();
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
        data: data, 
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
    if (body.vpa !== undefined) updateData.customerVPAs = body.vpa.trim();
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

    return Response.json({ data: data, message: 'Booth person updated successfully' }, { status: 200 });
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