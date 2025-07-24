# AI Career Assistant - Resume Analysis Application

## Overview

This is a full-stack web application that provides AI-powered resume analysis and interview coaching with persistent data storage. The application analyzes resumes against job descriptions using OpenAI's API, providing alignment scores, strengths assessment, gap identification, formatting suggestions, and tailored interview questions. Built with React frontend, Express backend, and Supabase/PostgreSQL database using modern web technologies. Features include analysis history, modern glassmorphism UI, and seamless data persistence.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## System Architecture

The application follows a monorepo structure with clear separation between frontend, backend, and shared components:

- **Frontend**: React SPA with TypeScript, built with Vite
- **Backend**: Express.js REST API with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Shared**: Common schemas and types using Zod
- **UI**: shadcn/ui component library with Tailwind CSS

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **File Handling**: Multer for resume file uploads with PDF text extraction using pdf-parse
- **External APIs**: OpenAI API for AI analysis, web scraping for job descriptions
- **Development**: Hot reload with tsx, production build with esbuild

### Database Schema
**Database**: Supabase PostgreSQL with Drizzle ORM integration

Single `analyses` table storing:
- Resume text and job description content  
- AI analysis results (alignment score, strengths, gaps)
- Formatting suggestions and interview questions
- Timestamps for tracking
- Auto-incrementing ID for history management

**Features**:
- Persistent data storage across server restarts
- Analysis history with chronological ordering
- Automatic fallback to in-memory storage for development

## Data Flow

1. **Input Phase**: Users provide resume text (typed or uploaded) and job description (typed or URL scraped)
2. **Processing Phase**: Backend validates input, calls OpenAI API for analysis
3. **Storage Phase**: Analysis results stored in PostgreSQL database
4. **Display Phase**: Frontend renders comprehensive analysis results with interactive UI

## External Dependencies

### Core Services
- **OpenAI API**: GPT-4o model for resume analysis and interview question generation
- **Supabase Database**: Serverless PostgreSQL hosting with automatic scaling
- **Web Scraping**: Cheerio for extracting job descriptions from URLs

### Key Libraries
- **@neondatabase/serverless**: Database connection and query execution
- **@radix-ui/***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database ORM with migrations
- **zod**: Runtime type validation and schema definition

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR and error overlay
- **Backend**: tsx for TypeScript execution with auto-restart
- **Database**: Drizzle migrations with `db:push` command

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Static Serving**: Express serves built frontend in production
- **Environment**: NODE_ENV-based configuration switching

### Configuration
- **Database URL**: Set via DATABASE_URL environment variable for Supabase connection
- **OpenAI API key**: Required for AI analysis functionality
- **Development Environment**: Replit-specific plugins for hot reload and error handling
- **TypeScript aliases**: Clean imports using @/, @shared/ path mappings

### Database Setup Instructions
To enable persistent data storage with Supabase:

1. Visit [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Create a new project (free tier available)
3. Navigate to Settings > Database
4. Copy the Connection String from "Transaction pooler"
5. Replace `[YOUR-PASSWORD]` with your project password
6. Set the DATABASE_URL environment variable in Replit

**Example DATABASE_URL format:**
```
postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres
```

### Recent Changes (January 2025)
- ✅ Added Supabase PostgreSQL database integration
- ✅ Implemented analysis history with persistent storage
- ✅ Created modern glassmorphism UI design
- ✅ Added automatic fallback to in-memory storage for development
- ✅ Enhanced mobile responsiveness with history toggle
- ✅ Added PDF file upload support with text extraction
- ✅ Enhanced file upload UI with format indicators
- ✅ Real-time database status monitoring
- ✅ Implemented advanced speaker diarization with timestamp analysis
- ✅ Added intelligent speaker identification using conversation patterns
- ✅ Enhanced audio processing with 32kbps mono compression for faster transcription
- ✅ Fixed hybrid storage system with automatic database fallback
- ✅ Integrated embedded ChatGPT-style bot for interview follow-up questions
- ✅ Made job description optional for resume analysis - supports both targeted and general analysis
- ✅ **Fixed ElevenLabs Scribe integration with proper multipart form data handling (July 2025)**
- ✅ **Implemented advanced speaker diarization with word-level timestamps and audio event detection**
- ✅ **Secured API keys with proper environment variable management**
- ✅ **Implemented comprehensive token optimization system with chunked analysis (July 2025)**
- ✅ **Added configurable analysis depth with economy model support (gpt-4o-mini)**
- ✅ **Created intelligent transcript chunking to eliminate quota exceeded errors**

The architecture prioritizes type safety, developer experience, and scalability while maintaining simplicity for a focused resume analysis use case.