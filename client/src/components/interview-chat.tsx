import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, Bot, User } from "lucide-react";
import type { InterviewChat } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface InterviewChatProps {
  interviewId: number;
}

export function InterviewChatComponent({ interviewId }: InterviewChatProps) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['/api/interview', interviewId, 'chat'],
    queryFn: () => fetch(`/api/interview/${interviewId}/chat`).then(res => res.json()) as Promise<InterviewChat[]>
  });

  // Send chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest(`/api/interview/${interviewId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interview', interviewId, 'chat'] });
      setMessage("");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageCircle className="h-5 w-5" />
          AI Interview Coach Chat
        </CardTitle>
        <p className="text-sm text-white/70">
          Ask follow-up questions about your interview performance
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Chat History */}
        <ScrollArea className="h-96 w-full rounded-lg border border-white/20 bg-black/20 p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <Bot className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No messages yet. Ask me anything about your interview!</p>
              <p className="text-sm mt-2">Try asking: "Was I too flattering?" or "Should I schedule another interview?"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chats.slice().reverse().map((chat) => (
                <div key={chat.id} className="space-y-3">
                  {/* User Message */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 bg-white/10 rounded-lg p-3">
                      <p className="text-white text-sm">{chat.message}</p>
                    </div>
                  </div>
                  
                  {/* AI Response */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 bg-white/5 rounded-lg p-3">
                      <p className="text-white/90 text-sm whitespace-pre-wrap">{chat.response}</p>
                    </div>
                  </div>
                  
                  <Separator className="bg-white/10" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a question about your interview performance..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50"
            disabled={sendMessageMutation.isPending}
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            {sendMessageMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Quick Question Suggestions */}
        <div className="flex flex-wrap gap-2">
          {[
            "Was I too flattering?",
            "Should I schedule another interview?",
            "How can I improve my communication?",
            "What were my strongest moments?"
          ].map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => setMessage(suggestion)}
              className="text-xs bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
              disabled={sendMessageMutation.isPending}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}