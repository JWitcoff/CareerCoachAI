import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { Clock, Eye, Trash2, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Analysis } from "@shared/schema";

interface AnalysisHistoryProps {
  onSelectAnalysis: (analysis: Analysis) => void;
}

export function AnalysisHistory({ onSelectAnalysis }: AnalysisHistoryProps) {
  const { data: analyses, isLoading, error } = useQuery({
    queryKey: ["/api/analyses"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-slate-500 mt-2">Loading your analysis history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50/80 backdrop-blur-md border-red-200/50">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-sm text-red-600">Failed to load analysis history</p>
            <p className="text-xs text-red-500 mt-1">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <Card className="bg-white/60 backdrop-blur-md border-slate-200/50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-600 mb-2">No Analysis History</h3>
            <p className="text-sm text-slate-500">
              Complete your first resume analysis to see it here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Analysis History</h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          {analyses.length} {analyses.length === 1 ? "Analysis" : "Analyses"}
        </Badge>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {analyses.map((analysis: Analysis) => (
          <Card 
            key={analysis.id} 
            className="bg-white/80 backdrop-blur-md border-slate-200/50 hover:bg-white/90 transition-all duration-200 cursor-pointer"
            onClick={() => onSelectAnalysis(analysis)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-12 h-12">
                      <ProgressCircle 
                        value={analysis.alignmentScore} 
                        size="sm"
                        showValue={true}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        Analysis #{analysis.id}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAnalysis(analysis);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Add delete functionality
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-50 rounded p-2">
                  <p className="font-medium text-green-800">Strengths</p>
                  <p className="text-green-600">{analysis.strengths.length} identified</p>
                </div>
                <div className="bg-orange-50 rounded p-2">
                  <p className="font-medium text-orange-800">Improvements</p>
                  <p className="text-orange-600">{analysis.gaps.length} suggested</p>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                <p className="truncate">
                  <span className="font-medium">Job:</span> {analysis.jobDescription.substring(0, 100)}...
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}