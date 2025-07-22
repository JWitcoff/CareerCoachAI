import { useState } from "react";
import { AnalysisForm } from "@/components/analysis-form";
import { AnalysisResults } from "@/components/analysis-results";
import { AnalysisHistory } from "@/components/analysis-history";
import { DatabaseStatus } from "@/components/database-status";
import { Bot, CheckCircle, History, Sparkles, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import type { Analysis } from "@shared/schema";

export default function Home() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleAnalysisComplete = (result: Analysis) => {
    setAnalysis(result);
    setShowHistory(false); // Hide history when showing new results
  };

  const handleSelectAnalysis = (selectedAnalysis: Analysis) => {
    setAnalysis(selectedAnalysis);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center text-white hover:bg-gray-800">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-r from-[#F41F4E] to-[#FFC2C7] rounded-lg flex items-center justify-center">
                <Bot className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Resume Analysis</h1>
                <p className="text-sm text-gray-300">Professional AI-Powered Resume Analysis</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/interview">
                <Button variant="ghost" size="sm" className="flex items-center text-white hover:bg-gray-800">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Interview Practice
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-gray-300 hover:text-[#FFC2C7] hover:bg-gray-800"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <DatabaseStatus />
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-[#FFC2C7] border border-gray-700">
                <Sparkles className="h-3 w-3 text-[#F41F4E] mr-2" />
                AI Powered
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <AnalysisForm
                onAnalysisComplete={handleAnalysisComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
              
              {/* Mobile History Toggle */}
              <div className="md:hidden">
                <Button 
                  variant="outline" 
                  className="w-full bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History className="h-4 w-4 mr-2" />
                  {showHistory ? 'Hide History' : 'View History'}
                </Button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7">
            {showHistory ? (
              <Card className="bg-gray-900/80 backdrop-blur-md border-gray-700/50 shadow-lg">
                <CardContent className="pt-6">
                  <AnalysisHistory onSelectAnalysis={handleSelectAnalysis} />
                </CardContent>
              </Card>
            ) : analysis ? (
              <AnalysisResults analysis={analysis} />
            ) : (
              <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-12 border border-gray-700/50 shadow-lg text-center">
                <Bot className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Ready to Analyze</h3>
                <p className="text-gray-300 mb-6">
                  Fill out the form and click "Start AI Analysis" to begin your professional resume evaluation and interview preparation.
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <CheckCircle className="h-8 w-8 text-[#F41F4E] mx-auto mb-2" />
                    <p className="text-sm font-medium text-white">Smart Analysis</p>
                    <p className="text-xs text-gray-300">AI-powered resume evaluation</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <Sparkles className="h-8 w-8 text-[#FFC2C7] mx-auto mb-2" />
                    <p className="text-sm font-medium text-white">Interview Prep</p>
                    <p className="text-xs text-gray-300">Role-specific question generation</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <History className="h-8 w-8 text-[#F41F4E] mx-auto mb-2" />
                    <p className="text-sm font-medium text-white">Persistent Storage</p>
                    <p className="text-xs text-gray-300">Access your analysis history</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-md border-t border-gray-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-[#F41F4E] to-[#FFC2C7] rounded-lg flex items-center justify-center">
                  <Bot className="text-white h-4 w-4" />
                </div>
                <span className="font-bold text-white">AI Career Assistant</span>
              </div>
              <p className="text-sm text-gray-300">
                Professional resume analysis and interview coaching powered by advanced AI technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-[#F41F4E]" />
                  <span>Resume-Job Match Analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-[#F41F4E]" />
                  <span>AI-Powered Recommendations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-[#F41F4E]" />
                  <span>Interview Question Generation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-[#F41F4E]" />
                  <span>Professional Formatting Tips</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-[#FFC2C7] transition-colors duration-200">Documentation</a></li>
                <li><a href="#" className="hover:text-[#FFC2C7] transition-colors duration-200">Best Practices</a></li>
                <li><a href="#" className="hover:text-[#FFC2C7] transition-colors duration-200">Contact Support</a></li>
                <li><a href="#" className="hover:text-[#FFC2C7] transition-colors duration-200">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700/50 flex items-center justify-between">
            <p className="text-sm text-gray-400">© 2024 AI Career Assistant. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-800 text-[#FFC2C7] border border-gray-700">
                <CheckCircle className="h-3 w-3 text-[#F41F4E] mr-1" />
                Secure & Private
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
