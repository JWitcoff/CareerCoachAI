import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MessageSquare, FileText, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-5xl font-bold text-white mb-6">
              AI Career Assistant
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Enhance your career with AI-powered tools. Practice interviews or get detailed resume analysis 
              to land your dream job.
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Interview Simulation */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl p-8 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#F41F4E] to-[#FFC2C7] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-3">
                    Interview Simulation
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Practice with our AI interviewer. Get real-time feedback and improve your 
                    interview skills with realistic scenarios.
                  </p>
                </div>
                <Link href="/interview">
                  <Button className="bg-gradient-to-r from-[#F41F4E] to-[#FFC2C7] hover:from-[#F41F4E]/80 hover:to-[#FFC2C7]/80 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 group">
                    Start Interview Practice
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Resume Analysis */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl p-8 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FFC2C7] to-[#F41F4E] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-3">
                    Resume Analysis
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Get detailed AI analysis of your resume. Upload PDF or text files and receive 
                    alignment scores, gap analysis, and improvement suggestions.
                  </p>
                </div>
                <Link href="/analyze">
                  <Button className="bg-gradient-to-r from-[#FFC2C7] to-[#F41F4E] hover:from-[#FFC2C7]/80 hover:to-[#F41F4E]/80 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 group">
                    Analyze Resume
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-300 mb-4">
              Powered by Advanced AI Technology
            </h3>
            <div className="flex justify-center space-x-8 text-sm text-gray-400">
              <span>• OpenAI GPT-4o</span>
              <span>• ElevenLabs Voice AI</span>
              <span>• PDF Text Extraction</span>
              <span>• Real-time Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}