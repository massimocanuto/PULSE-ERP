import { AppLayout } from "@/components/layout/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search, Star, Archive, Trash2, MailOpen, MoreVertical, Reply, ReplyAll, Forward, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { emailsApi } from "@/lib/api";
import { format } from "date-fns";

export default function Email() {
  const queryClient = useQueryClient();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["emails"],
    queryFn: emailsApi.getAll,
  });

  const selectedEmail = emails.find((e: any) => e.id === selectedEmailId) || emails[0];

  useEffect(() => {
    if (emails.length > 0 && !selectedEmailId) {
      setSelectedEmailId(emails[0].id);
    }
  }, [emails, selectedEmailId]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => emailsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: emailsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      setSelectedEmailId(null);
    },
  });

  const formatTime = (date: string | Date) => {
    try {
      return format(new Date(date), "h:mm a");
    } catch {
      return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-3rem)]">
        <div className="w-80 border-r border-border flex flex-col bg-[#F7F7F5]/50">
          <div className="p-4 border-b border-border">
             <h2 className="font-semibold mb-2 flex items-center gap-2"><span className="text-xl">📧</span> Inbox</h2>
             <div className="relative">
               <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input placeholder="Search emails..." className="pl-8 bg-background border-none shadow-sm focus-visible:ring-1" data-testid="input-search-email" />
             </div>
          </div>
          <ScrollArea className="flex-1">
             <div className="flex flex-col">
                {emails.map((email: any) => (
                   <button 
                     key={email.id}
                     data-testid={`button-email-${email.id}`}
                     onClick={() => {
                       setSelectedEmailId(email.id);
                       if (email.unread) {
                         updateMutation.mutate({ id: email.id, data: { unread: false } });
                       }
                     }}
                     className={`
                        text-left p-4 border-b border-border/50 hover:bg-muted transition-colors
                        ${selectedEmail?.id === email.id ? 'bg-card shadow-sm z-10' : ''}
                        ${email.unread ? 'bg-blue-50/30' : ''}
                     `}
                   >
                      <div className="flex justify-between items-start mb-1">
                         <span className={`text-sm ${email.unread ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                            {email.fromName}
                         </span>
                         <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{formatTime(email.receivedAt)}</span>
                      </div>
                      <div className={`text-sm mb-1 truncate ${email.unread ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                         {email.subject}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                         {email.preview}
                      </div>
                   </button>
                ))}
             </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col bg-background">
           <div className="h-14 border-b border-border flex items-center justify-between px-6">
              <div className="flex items-center gap-2">
                 <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                    <Archive className="h-4 w-4" />
                 </button>
                 <button 
                   className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                   onClick={() => selectedEmail && deleteMutation.mutate(selectedEmail.id)}
                   data-testid="button-delete-email"
                 >
                    <Trash2 className="h-4 w-4" />
                 </button>
                 <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                    <MailOpen className="h-4 w-4" />
                 </button>
                 <Separator orientation="vertical" className="h-6 mx-1" />
                 <button 
                   className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                   onClick={() => selectedEmail && updateMutation.mutate({ id: selectedEmail.id, data: { starred: !selectedEmail.starred } })}
                   data-testid="button-star-email"
                 >
                    <Star className={`h-4 w-4 ${selectedEmail?.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                 </button>
              </div>
              <div>
                 <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                 </button>
              </div>
           </div>

           {selectedEmail ? (
             <ScrollArea className="flex-1 p-8">
                <div className="w-full">
                   <div className="mb-8">
                      <h1 className="text-2xl font-bold mb-4" data-testid="text-email-subject">{selectedEmail.subject}</h1>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold">
                               {selectedEmail.fromName[0]}
                            </div>
                            <div>
                               <div className="font-medium">{selectedEmail.fromName}</div>
                               <div className="text-xs text-muted-foreground">to me</div>
                            </div>
                         </div>
                         <div className="text-sm text-muted-foreground">
                            {formatTime(selectedEmail.receivedAt)}
                         </div>
                      </div>
                   </div>
                   
                   <Separator className="my-6" />
                   
                   <div className="prose prose-stone max-w-none text-foreground whitespace-pre-line">
                      {selectedEmail.body}
                   </div>
                   
                   <div className="mt-8 flex gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium">
                         <Reply className="h-4 w-4" /> Reply
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium">
                         <ReplyAll className="h-4 w-4" /> Reply All
                      </button>
                       <button className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium">
                         <Forward className="h-4 w-4" /> Forward
                      </button>
                   </div>
                </div>
             </ScrollArea>
           ) : (
             <div className="flex-1 flex items-center justify-center text-muted-foreground">
               Select an email to read
             </div>
           )}
        </div>
      </div>
    </AppLayout>
  );
}
