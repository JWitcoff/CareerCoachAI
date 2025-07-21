import { useState } from "react";
import { AnalysisForm } from "@/components/analysis-form";
import { AnalysisResults } from "@/components/analysis-results";
import { AnalysisHistory } from "@/components/analysis-history";
import { DatabaseStatus } from "@/components/database-status";
import { Bot, CheckCircle, History, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Bot className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">AI Career Assistant</h1>
                <p className="text-sm text-slate-500">Professional Resume Analysis & Interview Coaching</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-slate-600 hover:text-primary"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <DatabaseStatus />
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Sparkles className="h-3 w-3 text-green-500 mr-2" />
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
                  className="w-full"
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
              <Card className="bg-white/80 backdrop-blur-md border-slate-200/50 shadow-lg shadow-slate-200/20">
                <CardContent className="pt-6">
                  <AnalysisHistory onSelectAnalysis={handleSelectAnalysis} />
                </CardContent>
              </Card>
            ) : analysis ? (
              <AnalysisResults analysis={analysis} />
            ) : (
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-12 border border-slate-200/50 shadow-lg shadow-slate-200/20 text-center">
                <Bot className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Ready to Analyze</h3>
                <p className="text-slate-500 mb-6">
                  Fill out the form and click "Start AI Analysis" to begin your professional resume evaluation and interview preparation.
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-blue-800">Smart Analysis</p>
                    <p className="text-xs text-blue-600">AI-powered resume evaluation</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <Sparkles className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-800">Interview Prep</p>
                    <p className="text-xs text-green-600">Role-specific question generation</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <History className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-purple-800">Persistent Storage</p>
                    <p className="text-xs text-purple-600">Access your analysis history</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  <Bot className="text-white h-4 w-4" />
                </div>
                <span className="font-bold text-slate-800">AI Career Assistant</span>
              </div>
              <p className="text-sm text-slate-600">
                Professional resume analysis and interview coaching powered by advanced AI technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Resume-Job Match Analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>AI-Powered Recommendations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Interview Question Generation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Professional Formatting Tips</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Best Practices</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Contact Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200/50 flex items-center justify-between">
            <p className="text-sm text-slate-500">© 2024 AI Career Assistant. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                Secure & Private
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
