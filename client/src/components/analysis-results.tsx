import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertTriangle, Lightbulb, Mic, Target, ExternalLink } from "lucide-react";
import type { Analysis } from "@shared/schema";

interface AnalysisResultsProps {
  analysis: Analysis;
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="bg-gradient-to-r from-white/90 to-primary-50/80 backdrop-blur-md border-slate-200/50 shadow-lg shadow-slate-200/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Resume Analysis</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex justify-center">
              <div className="text-center">
                <ProgressCircle value={analysis.alignmentScore} />
                <p className="text-center mt-2 font-semibold text-slate-700">Alignment Score</p>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              {analysis.strengths.slice(0, 3).map((strength, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{strength}</p>
                    <p className="text-sm text-slate-500">Identified strength</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="bg-white/80 backdrop-blur-md border-slate-200/50 shadow-lg shadow-slate-200/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <h4 className="font-semibold text-slate-800">Strengths</h4>
            </div>
            <ul className="space-y-3">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{strength}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Gaps & Recommendations */}
        <Card className="bg-white/80 backdrop-blur-md border-slate-200/50 shadow-lg shadow-slate-200/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <h4 className="font-semibold text-slate-800">Gaps & Recommendations</h4>
            </div>
            <ul className="space-y-3">
              {analysis.gaps.map((gap, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{gap}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Formatting Suggestions */}
      {analysis.formattingSuggestions && analysis.formattingSuggestions.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-md border-slate-200/50 shadow-lg shadow-slate-200/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-800">Formatting & Tone Suggestions</h4>
            </div>
            <div className="space-y-4">
              {analysis.formattingSuggestions.map((suggestion, index) => (
                <div key={index} className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h5 className="font-medium text-slate-700 mb-2">Before</h5>
                    <p className="text-sm text-slate-600 italic">"{suggestion.before}"</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h5 className="font-medium text-slate-700 mb-2">After</h5>
                    <p className="text-sm text-slate-600 italic">"{suggestion.after}"</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interview Simulation */}
      <Card className="bg-gradient-to-r from-primary-50/80 to-white/90 backdrop-blur-md border-slate-200/50 shadow-lg shadow-slate-200/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <Mic className="h-4 w-4 text-primary-600" />
              </div>
              <h4 className="font-semibold text-slate-800">Interview Simulation</h4>
            </div>
            <span className="text-sm text-slate-500">Role-Specific Questions</span>
          </div>

          <div className="space-y-4">
            {analysis.interviewQuestions.map((item, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-slate-200/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium mt-0.5 flex-shrink-0">
                        Q{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{item.question}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="ml-9">
                    <div className="mb-3">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        <Target className="h-3 w-3 mr-1" />
                        Ideal Answer Traits
                      </Badge>
                    </div>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {item.idealAnswerTraits.map((trait, traitIndex) => (
                        <li key={traitIndex} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                          <span>{trait}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium text-slate-700">Pro Tip</p>
                <p className="text-sm text-slate-500">Use the STAR method (Situation, Task, Action, Result) for behavioral questions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
