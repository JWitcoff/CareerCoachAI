import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Database } from "lucide-react";

export function DatabaseStatus() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["/api/status"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  if (isLoading) {
    return (
      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
        <Database className="h-3 w-3 mr-1 animate-pulse" />
        Checking...
      </Badge>
    );
  }

  if (status?.database) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
        Database Connected
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
      <AlertCircle className="h-3 w-3 text-orange-600 mr-1" />
      Memory Mode
    </Badge>
  );
}