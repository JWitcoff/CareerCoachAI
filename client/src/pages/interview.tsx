/// <reference path="../types/elevenlabs.d.ts" />
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";
import { useEffect } from "react";

export default function Interview() {
  useEffect(() => {
    // Load the ElevenLabs script if not already loaded
    if (!document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="outline" className="flex items-center bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/analyze">
            <Button variant="outline" className="flex items-center bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
              <FileText className="mr-2 h-4 w-4" />
              Resume Analysis
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            AI Interview Simulation
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Practice your interview skills with our AI interviewer. Get personalized questions 
            and real-time feedback to boost your confidence.
          </p>
        </div>

        {/* Voice Agent Container - Centered */}
        <div className="flex justify-center items-center min-h-[60vh]">
          <elevenlabs-convai agent-id="agent_01k0qwhtepe4ha6jfe2kyt00wq"></elevenlabs-convai>
        </div>

        {/* Tips Section */}
        <div className="max-w-3xl mx-auto mt-12">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Interview Tips</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <h4 className="font-medium text-[#FFC2C7] mb-2">Before You Start:</h4>
                <ul className="space-y-1">
                  <li>• Find a quiet environment</li>
                  <li>• Test your microphone</li>
                  <li>• Have your resume ready</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-[#FFC2C7] mb-2">During the Interview:</h4>
                <ul className="space-y-1">
                  <li>• Speak clearly and confidently</li>
                  <li>• Take your time to think</li>
                  <li>• Ask clarifying questions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}