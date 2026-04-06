# Next.js Login App with Supabase

A modern Next.js frontend application with email and password authentication using Supabase as the backend.

## Features

- 🔐 Secure authentication with Supabase
- 🚀 Email/password login
- 💾 Session management with Supabase sessions
- 🎨 Beautiful gradient UI with form validation
- ⚡ Built with Next.js 14 and React 18
- 📱 Fully responsive design
- 🔄 Real-time authentication state management

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier available at https://supabase.com)

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Create a new project
3. Go to **Settings** → **API** to find:
   - `NEXT_PUBLIC_SUPABASE_URL` (Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Anon Public Key)

### 2. Set Up Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Enable Email/Password Auth in Supabase

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled with **Email/Password** auth
3. Configure email templates if needed

### 4. Create Test Users (Optional)

In Supabase dashboard under **Authentication** → **Users**, you can manually create users to test with.

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and test the login with your Supabase users.

## Project Structure

```
app/
├── layout.tsx          # Root layout
├── page.tsx            # Main page with Supabase auth logic
├── globals.css         # Global styles
└── _components/
    ├── LoginForm.tsx   # Login form component (Supabase)
    └── Dashboard.tsx   # Welcome dashboard

lib/
└── supabase.ts         # Supabase client initialization
```

## How It Works

### Authentication Flow

1. **LoginForm** - Users enter their email and password
2. **Supabase Auth** - Credentials are validated against Supabase
3. **Session Management** - Supabase manages the user session
4. **Dashboard** - Upon successful login, users see a welcome page with logout option

### Key Features

- **Real-time Auth State**: Uses `onAuthStateChange` to listen for auth changes
- **Persistent Sessions**: Supabase automatically manages session persistence
- **Secure**: Uses Supabase's built-in security and doesn't store passwords locally
- **Automatic Logout**: Session logout is handled through Supabase

## Building for Production

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Security Best Practices

✅ Passwords are never stored in your application  
✅ Uses Supabase's secure authentication  
✅ Session tokens stored securely by Supabase  
✅ Real-time auth state management  
✅ Environment variables for sensitive data  

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the project root
- Check that both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Login not working
- Verify the user exists in your Supabase project
- Check that Email/Password auth is enabled in Supabase dashboard
- Check browser console for specific error messages

### Session not persisting
- Clear browser cookies/localStorage and try again
- Ensure Supabase API keys are correct

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Reference](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT
