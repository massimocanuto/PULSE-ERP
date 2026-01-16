import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Trash2, AtSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  mentions: string[];
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface TaskCommentsProps {
  taskId: string;
  taskTitle: string;
  currentUserId: string;
}

export function TaskComments({ taskId, taskTitle, currentUserId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<TaskComment[]>({
    queryKey: [`/api/tasks/${taskId}/comments`],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      return res.json();
    },
    enabled: !!taskId,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const mentions = extractMentions(content, users);
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          content,
          mentions,
          taskTitle,
        }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-feed"] });
      setNewComment("");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/comments`] });
    },
  });

  const extractMentions = (text: string, userList: User[]): string[] => {
    const mentions: string[] = [];
    userList.forEach(user => {
      const pattern = new RegExp(`@${user.name.replace(/\s+/g, '\\s*')}`, 'gi');
      if (pattern.test(text)) {
        mentions.push(user.id);
      }
    });
    return mentions;
  };

  const handleMentionClick = (userName: string) => {
    setNewComment(prev => prev + `@${userName} `);
    setShowMentions(false);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Utente';
  };

  const getUserAvatar = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.avatar || user?.name?.split(' ').map(n => n[0]).join('') || 'U';
  };

  const highlightMentions = (text: string) => {
    let result = text;
    users.forEach(user => {
      const pattern = new RegExp(`@${user.name}`, 'gi');
      result = result.replace(pattern, `<span class="text-blue-600 font-medium">@${user.name}</span>`);
    });
    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        Commenti ({comments.length})
      </div>

      <ScrollArea className="max-h-64">
        <div className="space-y-3 pr-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">Caricamento...</div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Nessun commento. Sii il primo a commentare!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50 group">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                  {getUserAvatar(comment.userId)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{getUserName(comment.userId)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {comment.createdAt && format(parseISO(comment.createdAt), 'dd MMM HH:mm', { locale: it })}
                      </span>
                      {comment.userId === currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div 
                    className="text-sm mt-1"
                    dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Scrivi un commento... Usa @ per menzionare qualcuno"
            className="min-h-[80px] pr-10 resize-none"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => setShowMentions(!showMentions)}
          >
            <AtSign className="h-4 w-4" />
          </Button>
          
          {showMentions && (
            <div className="absolute right-0 top-10 w-48 bg-card border rounded-lg shadow-lg z-10 max-h-40 overflow-auto">
              {users.map(user => (
                <button
                  key={user.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                  onClick={() => handleMentionClick(user.name)}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                    {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {user.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="sm"
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Invia
          </Button>
        </div>
      </form>
    </div>
  );
}
