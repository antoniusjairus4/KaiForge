KaiForge 2.0 - Table Tennis Performance Tracker

**Professional Table Tennis Performance Tracking & Analysis Platform**

## Overview
KaiForge is a comprehensive table tennis performance tracking application designed for serious players and coaches. Track your practice sessions, log match results, analyze performance metrics through interactive graphs, and monitor your improvement over time with detailed statistics and performance analytics.

Built with modern web technology and real-time database capabilities, KaiForge provides a seamless experience for managing your table tennis journey.

## Key Features

### Performance Tracking
- **Match Logging** - Record singles, doubles, and tournament matches with detailed statistics
- **Practice Session Tracking** - Log practice types, duration, and notes for structured training
- **Real-Time Analytics** - View instant performance insights and win/loss ratios
- **Tournament Management** - Organize league matches, knockout stages, and tournament progression

### Comprehensive Analytics
- **Performance Graphs** - Visualize win rates, match outcomes, and historical trends
- **Statistical Breakdown** - Win/loss distribution, opponent analysis, and performance metrics
- **Tournament Analysis** - Round-by-round performance, player progression tracking
- **League Statistics** - Points tracking, cumulative performance, league standings

### User Management
- **Secure Authentication** - Email-based authentication with password management
- **User Profiles** - Customize profile information and track personal statistics
- **Data Persistence** - All data securely stored and synchronized in real-time

### Responsive Design
- **Mobile-Optimized** - Fully responsive interface for tablet and mobile devices
- **Dark & Light Modes** - Theme toggle for comfortable usage in any environment
- **Intuitive UI** - Clean, professional design focused on usability

## Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks and functional components
- **TypeScript** - Type-safe development with enhanced IDE support
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Recharts** - Composable charting library for data visualization
- **React Router** - Client-side routing for seamless navigation
- **Shadcn/UI** - High-quality UI component library
- **date-fns** - Modern date utility library
- **Zod** - TypeScript-first schema validation

### Backend & Database
- **Supabase** - Open-source Firebase alternative
- **PostgreSQL** - Robust relational database
- **PostgREST** - Auto-generated REST API from PostgreSQL schema
- **Row Level Security (RLS)** - User-level data isolation and security

### Development & Deployment
- **Git & GitHub** - Version control and collaboration
- **Lovable** - Deployment and hosting platform
- **ESLint** - Code quality and consistency
- **PostCSS** - CSS processing and optimization

---

## Quick Start

### Prerequisites
- Node.js 16+ or Bun
- npm, yarn, pnpm, or bun package manager
- Supabase account (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AntoniusJairus/kaiforge.git
cd kaiforge
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

4. **Start the development server**
```bash
npm run dev
# or
bun run dev
---

## Usage Guide

### Authentication
1. Navigate to the login page
2. Sign up with your email and password
3. Verify your email (if required)
4. Access your personalized dashboard

### Logging Sessions

#### Practice Logging
1. Go to **Practice Hub**
2. Click **Log Practice**
3. Enter practice type, duration, date, and notes
4. Click **Save Practice Session**

#### Match Tracking
1. Go to **Matches Hub** or **Performance History**
2. Click **Log Match**
3. Enter opponent name, result, score, and date
4. Add optional notes
5. Click **Save Match**

#### Tournament Management
1. Go to **Tournaments** section
2. Create a new tournament or select existing
3. Add league matches (round-robin stage)
4. Add knockout matches (tournament progression)
5. View real-time statistics and performance graphs

### Viewing Analytics
- **Dashboard** - Overview of recent activity and key metrics
- **Analytics** - Detailed performance analysis with interactive charts
- **Performance History** - Complete match and practice log with filters
- **Upcoming Matches** - Schedule and prepare for future matches

---

## Project Structure

```
kaiforge/
├── src/
│   ├── components/
│   │   ├── Layout.tsx              # Main app shell
│   │   ├── ThemeToggle.tsx         # Dark/light mode toggle
│   │   └── ui/                     # Shadcn UI components
│   ├── hooks/
│   │   ├── useAuth.tsx             # Authentication logic
│   │   ├── useDashboardSummary.ts  # Dashboard data
│   │   └── use-toast.ts            # Toast notifications
│   ├── pages/
│   │   ├── Auth.tsx                # Login/signup page
│   │   ├── Dashboard.tsx           # Home dashboard
│   │   ├── PracticeHub.tsx         # Practice session management
│   │   ├── Tournament.tsx          # Tournament management
│   │   ├── Analytics.tsx           # Performance analytics
│   │   ├── MatchesHub.tsx          # Match history and management
│   │   └── [other pages...]        # Additional pages
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts           # Supabase client initialization
│   │       └── types.ts            # Auto-generated TypeScript types
│   ├── lib/
│   │   └── utils.ts                # Utility functions
│   ├── App.tsx                     # Main app component
│   └── main.tsx                    # Entry point
├── supabase/
│   ├── config.toml                 # Supabase configuration
│   └── migrations/                 # Database migrations
├── public/                         # Static assets
├── index.html                      # HTML entry point
├── package.json                    # Dependencies
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
└── tailwind.config.ts              # Tailwind CSS configuration
```

---

## Database Schema

### Core Tables

#### `profiles`
User profile information
```sql
- id (UUID)
- user_id (UUID) - Links to auth.users
- name (TEXT)
- email (TEXT)
- profile_picture_url (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### `performances`
Match and competition records (singles)
```sql
- id (UUID)
- user_id (UUID)
- session_type (TEXT) - 'Match' or 'Practice'
- opponent (TEXT)
- result (TEXT) - 'Win', 'Loss', 'Draw'
- score (TEXT)
- notes (TEXT)
- date (DATE)
- tournament_reference (UUID) - Links to tournaments
- round (TEXT) - Tournament round
- created_at, updated_at (TIMESTAMP)
```

#### `practice_sessions`
Structured practice tracking
```sql
- id (UUID)
- user_id (UUID)
- practice_type (TEXT)
- duration (INTEGER) - Minutes
- notes (TEXT)
- date (DATE)
- created_at, updated_at (TIMESTAMP)
```

#### `doubles_performances`
Doubles match records
```sql
- id (UUID)
- user_id (UUID)
- partner_name (TEXT)
- opponent_names (TEXT)
- result (TEXT)
- score (TEXT)
- notes (TEXT)
- date (DATE)
- created_at, updated_at (TIMESTAMP)
```

#### `tournaments`
Tournament management
```sql
- id (UUID)
- user_id (UUID)
- name (TEXT)
- location (TEXT)
- start_date (DATE)
- end_date (DATE)
- created_at, updated_at (TIMESTAMP)
```

#### `league_matches`
League stage matches within tournaments
```sql
- id (UUID)
- user_id (UUID)
- tournament_id (UUID) - Links to tournaments
- opponent_name (TEXT)
- score (TEXT)
- result (TEXT)
- points_gained (INTEGER)
- notes (TEXT)
- date (DATE)
- created_at, updated_at (TIMESTAMP)
```

#### `upcoming_matches`
Scheduled future matches
```sql
- id (UUID)
- user_id (UUID)
- date (DATE)
- opponent (TEXT)
- match_type (TEXT)
- goal (TEXT)
- created_at, updated_at (TIMESTAMP)
```

---

## Environment Variables

### Required Variables
```env
VITE_SUPABASE_PROJECT_ID      # Supabase project ID
VITE_SUPABASE_PUBLISHABLE_KEY # Supabase anon/public key
VITE_SUPABASE_URL             # Supabase project URL
```

**Important Security Notes:**
- Never commit `.env` to version control
- Use the **PUBLIC/ANON key** in frontend code, never the SERVICE key
- The SERVICE key should only be used server-side (backend, edge functions, etc.)

---

## Building & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

Output files are in `dist/` directory

### Preview Production Build
```bash
npm run preview
```

### Deployment to Lovable
1. Push changes to GitHub
2. Connect repository to Lovable dashboard
3. Set environment variables in Lovable settings
4. Deploy automatically on push or manually via dashboard

---

## Security Features

### Authentication
- Email/password authentication via Supabase Auth
- Session management with secure tokens
- Automatic token refresh

### Data Protection
- Row Level Security (RLS) policies on all tables
- User-level data isolation
- Encrypted connections (HTTPS/TLS)

### Privacy
- Personal data is user-controlled
- No third-party tracking
- Compliant with standard privacy practices

---

## API Documentation

KaiForge uses **Supabase PostgREST API** for all backend operations.

### Example Queries

**Get all performances for current user:**
```typescript
const { data, error } = await supabase
  .from('performances')
  .select('*')
  .eq('user_id', userId)
  .order('date', { ascending: false });
```

**Insert a new practice session:**
```typescript
const { data, error } = await supabase
  .from('practice_sessions')
  .insert({
    user_id: userId,
    practice_type: 'Backhand Loops',
    duration: 60,
    notes: 'Focused on consistency',
    date: new Date().toISOString().split('T')[0]
  });
```

**Get tournament with league matches:**
```typescript
const { data, error } = await supabase
  .from('tournaments')
  .select('*, league_matches(*)')
  .eq('id', tournamentId);
```

---

## Performance Optimization

- **Code Splitting** - Lazy loading of pages and components
- **Image Optimization** - Optimized favicon and assets
- **Caching** - Browser and server-side caching strategies
- **Database Indexing** - Optimized queries on frequently accessed columns

---

## Troubleshooting

### "Failed to fetch" Error
- Verify Supabase URL and API key in `.env`
- Check internet connection
- Ensure Supabase project is active
- Restart development server

### Tables Not Found (404 Error)
- Run Supabase migrations: `supabase migration up`
- Verify all tables exist in Supabase dashboard
- Check schema matches `src/integrations/supabase/types.ts`

### Authentication Issues
- Clear browser cache and cookies
- Check email verification status
- Verify authentication settings in Supabase

### Data Not Updating
- Verify RLS policies allow INSERT/UPDATE operations
- Check user_id matches current auth user
- Confirm data exists in database

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support & Contact

**Developer:** Antonius Jairus

- **Website:** [antoniusjairus.in](https://antoniusjairus.in)
- **Live Demo:** [kaiforge.antoniusjairus.in](https://kaiforge.antoniusjairus.in)
- **Issues:** [GitHub Issues](https://github.com/AntoniusJairus/kaiforge/issues)

---

## Acknowledgments

- **Supabase** - Backend infrastructure and authentication
- **Shadcn/UI** - Component library
- **Recharts** - Data visualization
- **Vite** - Build tooling
- Table tennis community for inspiration and feedback

---


Made with ❤️ for table tennis enthusiasts

[Back to Top](#kaiforge-20---table-tennis-performance-tracker)


