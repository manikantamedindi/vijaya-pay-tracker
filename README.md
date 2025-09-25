# Vijaya Pay Tracker

## Supabase Integration

This project uses Supabase for database management and authentication.

### Environment Setup

1. Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. To get these values:
   - Go to your [Supabase dashboard](https://supabase.com/dashboard/)
   - Select your project
   - Go to Project Settings → API
   - Copy the "URL" as your NEXT_PUBLIC_SUPABASE_URL
   - Copy the "anon public" key as your NEXT_PUBLIC_SUPABASE_ANON_KEY

### Database Schema Setup

To use the users API, you need to create the following table in your Supabase database:

1. Go to your [Supabase dashboard](https://supabase.com/dashboard/)
2. Select your project
3. Navigate to Database → SQL Editor
4. Run the following SQL command:

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  booth_id VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Alternatively, you can use the Table Editor:
1. Go to Database → Tables
2. Click "New Table"
3. Name it "users"
4. Add the following columns:
   - id: UUID, Primary Key, Default: gen_random_uuid()
   - name: TEXT, Not Null
   - email: TEXT, Unique
   - phone: TEXT
   - booth_id: TEXT
   - role: TEXT, Default: 'user'
   - status: TEXT, Default: 'active'
   - created_at: TIMESTAMP, Default: NOW()
   - updated_at: TIMESTAMP, Default: NOW()

### API Endpoints

The following API endpoints are available for managing booth people users:

#### GET /api/booth-people
Fetch all booth people users

#### POST /api/booth-people
Create a new booth person
- Request body: `{ name: string, email?: string, phone?: string, booth_id?: string, role?: string, status?: string }`
- Response: Created booth person object

#### PUT /api/booth-people
Update an existing booth person
- Request body: `{ id: string, name?: string, email?: string, phone?: string, booth_id?: string, role?: string, status?: string }`
- Response: Updated booth person object

#### DELETE /api/booth-people?id=ID
Delete a booth person by ID

#### GET /api/booth-people/[id]
Fetch a specific booth person by ID

#### PUT /api/booth-people/[id]
Update a specific booth person by ID

#### DELETE /api/booth-people/[id]
Delete a specific booth person by ID

### Running the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000