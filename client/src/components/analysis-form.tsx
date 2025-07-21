import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { analyzeRequestSchema, type AnalyzeRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Link, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface AnalysisFormProps {
  onAnalysisComplete: (analysis: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function AnalysisForm({ onAnalysisComplete, isLoading, setIsLoading }: AnalysisFormProps) {
  const [inputMode, setInputMode] = useState<"text" | "url">("text");
  const [isUrlFetching, setIsUrlFetching] = useState(false);
  const { toast } = useToast();

  const form = useForm<AnalyzeRequest>({
    resolver: zodResolver(analyzeRequestSchema),
    defaultValues: {
      resumeText: "",
      jobDescription: "",
      additionalContext: "",
    },
  });

  const handleFileContent = (content: string) => {
    form.setValue("resumeText", content);
  };

  const handleUrlFetch = async (url: string) => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsUrlFetching(true);
    try {
      const response = await fetch("/api/fetch-job-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch job description");
      }

      const result = await response.json();
      form.setValue("jobDescription", result.jobDescription);
      
      toast({
        title: "Success",
        description: "Job description fetched successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch job description",
        variant: "destructive",
      });
    } finally {
      setIsUrlFetching(false);
    }
  };

  const onSubmit = async (data: AnalyzeRequest) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Analysis failed");
      }

      const analysis = await response.json();
      onAnalysisComplete(analysis);
      
      toast({
        title: "Analysis Complete",
        description: "Your resume has been analyzed successfully",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze resume",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card className="bg-white/80 backdrop-blur-md border-slate-200/50 shadow-lg shadow-slate-200/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Analysis Setup</h2>
            <span className="text-sm text-slate-500">Step 1 of 3</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">1</div>
              <span className="ml-2 text-sm font-medium text-slate-700">Input</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-sm font-medium">2</div>
              <span className="ml-2 text-sm text-slate-500">Analysis</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-sm font-medium">3</div>
              <span className="ml-2 text-sm text-slate-500">Results</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card className="bg-white/80 backdrop-blur-md border-slate-200/50 shadow-lg shadow-slate-200/20">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Resume Input */}
              <FormField
                control={form.control}
                name="resumeText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Resume Content</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <FileUpload 
                          onFileContent={handleFileContent}
                          disabled={isLoading}
                        />
                        <Textarea
                          placeholder="Or paste your resume text here..."
                          rows={6}
                          className="bg-white/70 backdrop-blur-sm resize-none"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Job Description Input */}
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Job Description</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant={inputMode === "text" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setInputMode("text")}
                            disabled={isLoading}
                            className="flex-1"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Paste Text
                          </Button>
                          <Button
                            type="button"
                            variant={inputMode === "url" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setInputMode("url")}
                            disabled={isLoading}
                            className="flex-1"
                          >
                            <Link className="h-4 w-4 mr-2" />
                            From URL
                          </Button>
                        </div>
                        
                        {inputMode === "url" ? (
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Enter job posting URL..."
                              disabled={isLoading || isUrlFetching}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleUrlFetch(e.currentTarget.value);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={(e) => {
                                const input = e.currentTarget.parentElement?.querySelector('input');
                                if (input) handleUrlFetch(input.value);
                              }}
                              disabled={isLoading || isUrlFetching}
                            >
                              {isUrlFetching ? "Fetching..." : "Fetch"}
                            </Button>
                          </div>
                        ) : null}
                        
                        <Textarea
                          placeholder="Paste job description here..."
                          rows={5}
                          className="bg-white/70 backdrop-blur-sm resize-none"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Additional Context */}
              <FormField
                control={form.control}
                name="additionalContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Additional Context (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Industry focus, experience level, career goals, specific concerns..."
                        rows={3}
                        className="bg-white/70 backdrop-blur-sm resize-none"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
                size="lg"
              >
                <Brain className="h-5 w-5 mr-2" />
                {isLoading ? "Analyzing..." : "Start AI Analysis"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
