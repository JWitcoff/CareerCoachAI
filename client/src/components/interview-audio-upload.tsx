import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileAudio, AlertCircle, CheckCircle, Download, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InterviewAnalysis } from "@shared/schema";

interface AnalysisResults {
  analysis: InterviewAnalysis;
}

export function InterviewAudioUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (audioFile: File) => {
      const formData = new FormData();
      formData.append('audio', audioFile);
      
      const response = await fetch('/api/analyze-interview', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze interview');
      }
      
      return response.json();
    },
    onSuccess: (data: InterviewAnalysis) => {
      setAnalysis(data);
      setFile(null);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const allowedTypes = ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a'];
    const allowedExtensions = ['.wav', '.mp3', '.m4a'];
    const extension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(extension)) {
      alert('Please upload an audio file (.wav, .mp3, or .m4a)');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const downloadTranscript = () => {
    if (analysis) {
      window.open(`/api/interview/${analysis.id}/transcript`, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (analysis) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-900/80 backdrop-blur-md border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-[#F41F4E]" />
              Interview Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scores */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-[#F41F4E] mb-1">{analysis.overallScore}/100</div>
                <div className="text-sm text-gray-300">Overall Score</div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-[#FFC2C7] mb-1">{analysis.communicationScore}/100</div>
                <div className="text-sm text-gray-300">Communication</div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-[#F41F4E] mb-1">{analysis.contentScore}/100</div>
                <div className="text-sm text-gray-300">Content Quality</div>
              </div>
            </div>

            {/* Strengths */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Strengths</h3>
              <div className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-[#F41F4E] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{strength}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Areas for Improvement</h3>
              <div className="space-y-2">
                {analysis.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-[#FFC2C7] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{improvement}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Insights */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Key Insights</h3>
              <div className="space-y-2">
                {analysis.keyInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <BarChart3 className="h-4 w-4 text-[#F41F4E] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-4 border-t border-gray-700">
              <Button
                onClick={downloadTranscript}
                className="bg-gradient-to-r from-[#F41F4E] to-[#FFC2C7] hover:from-[#F41F4E]/80 hover:to-[#FFC2C7]/80 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Transcript
              </Button>
              <Button
                onClick={() => setAnalysis(null)}
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                Analyze Another Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/80 backdrop-blur-md border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white">Already had your interview?</CardTitle>
          <p className="text-gray-300">Upload the audio here to receive your analysis</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-[#F41F4E] bg-[#F41F4E]/10'
                : 'border-gray-600 bg-gray-800/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".wav,.mp3,.m4a,audio/*"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadMutation.isPending}
            />
            
            <div className="space-y-4">
              <FileAudio className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-white font-medium">
                  Drop your audio file here or click to browse
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Supports .wav, .mp3, .m4a files up to 50MB
                </p>
              </div>
            </div>
          </div>

          {/* File Info */}
          {file && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileAudio className="h-8 w-8 text-[#F41F4E]" />
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setFile(null)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {file && (
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="w-full bg-gradient-to-r from-[#F41F4E] to-[#FFC2C7] hover:from-[#F41F4E]/80 hover:to-[#FFC2C7]/80 text-white"
            >
              {uploadMutation.isPending ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Interview...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Analyze Interview
                </>
              )}
            </Button>
          )}

          {/* Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Processing audio...</span>
                <span className="text-gray-400">This may take a few minutes</span>
              </div>
              <Progress value={undefined} className="bg-gray-700" />
            </div>
          )}

          {/* Error */}
          {uploadMutation.error && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Failed to analyze interview'}
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-white font-medium mb-2">What happens next?</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• Audio will be transcribed using OpenAI Whisper</li>
              <li>• AI will analyze your communication and content quality</li>
              <li>• You'll receive detailed feedback and scoring</li>
              <li>• Download your transcript for future reference</li>
              <li>• Supports files up to 50MB for longer interviews</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}