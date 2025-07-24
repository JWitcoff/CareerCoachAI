# AI Career Assistant

> An advanced AI-powered career assistance platform that helps professionals optimize their resumes and prepare for job applications through intelligent analysis and personalized feedback mechanisms.

![AI Career Assistant](https://img.shields.io/badge/AI-Career%20Assistant-F41F4E?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## 🎯 Features

### 📄 AI-Powered Resume Analysis
- **Smart Resume Processing**: Upload PDF files or paste text directly
- **Job Description Matching**: Compare resumes against specific job requirements or perform general analysis
- **Comprehensive Scoring**: Alignment scores, strengths assessment, and gap identification
- **Formatting Suggestions**: Professional recommendations for resume optimization
- **Analysis History**: Persistent storage of all analyses with chronological tracking

### 🎤 Advanced Interview Simulation
- **Live Voice Practice**: Real-time AI interview agent powered by ElevenLabs
- **Audio Analysis**: Upload interview recordings for detailed post-session analysis
- **Speaker Diarization**: Advanced multi-speaker identification with word-level timestamps
- **Conversation Intelligence**: Audio event detection (clicks, background sounds, music)
- **Follow-up Coaching**: Embedded ChatGPT-style bot for personalized interview guidance
- **Downloadable Transcripts**: Professional transcription with speaker segmentation

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript and Vite
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management
- **shadcn/ui** component library built on Radix UI
- **Tailwind CSS** with modern glassmorphism design
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** with PostgreSQL
- **Multer** for file handling with PDF text extraction
- **OpenAI GPT-4o** for AI analysis
- **ElevenLabs Scribe** for advanced speech-to-text
- **Web scraping** with Cheerio for job description extraction

### Database & Storage
- **Supabase PostgreSQL** for persistent data storage
- **Automatic fallback** to in-memory storage for development
- **Real-time status monitoring** with connection health checks

## 📁 Project Architecture

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-based page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configs
│   │   └── types/          # TypeScript type definitions
├── server/                 # Express backend API
│   ├── services/           # Business logic services
│   │   ├── elevenlabs-scribe.ts    # Advanced speech-to-text
│   │   ├── enhanced-speaker-analyzer.ts  # Speaker diarization
│   │   ├── whisper.ts      # Audio processing
│   │   └── interview-chat.ts       # AI chat integration
│   ├── routes.ts           # API route definitions
│   └── storage.ts          # Database abstraction layer
├── shared/                 # Common schemas and types
│   └── schema.ts           # Zod schemas and database models
└── uploads/                # File upload storage
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- OpenAI API key
- ElevenLabs API key

### Environment Variables
Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# AI Services
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=sk_...

# Application
NODE_ENV=development
```

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-career-assistant.git
   cd ai-career-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Copy the connection string and set `DATABASE_URL`
   - Run database migrations:
   ```bash
   npm run db:push
   ```

4. **Configure API keys**
   - Get your OpenAI API key from [platform.openai.com](https://platform.openai.com)
   - Get your ElevenLabs API key from [elevenlabs.io](https://elevenlabs.io)
   - Add both to your environment variables

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## 🗄️ Database Schema

The application uses a single `analyses` table that stores:

- Resume text and job description content
- AI analysis results (scores, strengths, gaps)
- Formatting suggestions and interview questions  
- Timestamps for historical tracking
- Auto-incrementing ID for easy retrieval

## 🔧 API Endpoints

### Resume Analysis
- `POST /api/analyze` - Analyze resume against job description
- `GET /api/analyses` - Retrieve analysis history

### Interview Features
- `POST /api/analyze-interview` - Upload and analyze interview audio
- `POST /api/interview-chat` - Chat with AI coaching bot

### System
- `GET /api/status` - Health check and database status

## 🎨 Design System

The application features a modern dark theme with:
- **Primary Colors**: Black (#000000), Red (#F41F4E)
- **Accent Colors**: Pink (#FFC2C7), White (#FBFBFB)
- **Modern UI**: Glassmorphism effects and smooth animations
- **Responsive Design**: Mobile-first approach with adaptive layouts

## 🚀 Deployment

### Development
```bash
npm run dev          # Start development server
npm run db:push      # Push database schema changes
```

### Production
```bash
npm run build        # Build for production
npm start           # Start production server
```

### Deploy to Replit
1. Import this repository to Replit
2. Set environment variables in Replit Secrets
3. Click "Run" to start the application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o language model
- **ElevenLabs** for advanced speech-to-text with speaker diarization
- **Supabase** for reliable PostgreSQL hosting
- **shadcn/ui** for beautiful, accessible UI components
- **Replit** for development platform and deployment

## 📞 Support

For support, email support@yourcompany.com or join our Slack channel.

---

<div align="center">
  <sub>Built with ❤️ for career professionals everywhere</sub>
</div>
