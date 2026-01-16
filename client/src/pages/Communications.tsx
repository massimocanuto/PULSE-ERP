import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, Send, Phone, MessagesSquare, PenTool } from "lucide-react";
import { useState } from "react";

import EmailContent from "./EmailContent";
import ChatContent from "./ChatContent";
import TelegramContent from "./TelegramContent";
import WhatsappContent from "./WhatsappContent";
import WhiteboardContent from "./WhiteboardContent";

export default function Communications() {
  const [activeTab, setActiveTab] = useState("email");

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555]">
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />

        <div className="flex-1 overflow-auto -mt-16 px-6">
          <ErrorBoundary>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl shadow-lg border mb-6">
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                      <MessagesSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Comunicazioni</h1>
                      <p className="text-sm text-muted-foreground">
                        Email, Chat, WhatsApp e Telegram
                      </p>
                    </div>
                  </div>

                  <TabsList className="grid w-full max-w-2xl grid-cols-5 gap-1 h-auto bg-transparent p-0">
                    <TabsTrigger value="email" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                      <MessageSquare className="h-4 w-4" />
                      <span>Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                      <Phone className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </TabsTrigger>
                    <TabsTrigger value="telegram" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                      <Send className="h-4 w-4" />
                      <span>Telegram</span>
                    </TabsTrigger>
                    <TabsTrigger value="lavagna" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                      <PenTool className="h-4 w-4" />
                      <span>Lavagna</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <TabsContent value="email" className="m-0 h-full">
                  <EmailContent />
                </TabsContent>
                <TabsContent value="chat" className="m-0 h-full">
                  <ChatContent />
                </TabsContent>
                <TabsContent value="whatsapp" className="m-0 h-full">
                  <WhatsappContent />
                </TabsContent>
                <TabsContent value="telegram" className="m-0 h-full">
                  <TelegramContent />
                </TabsContent>
                <TabsContent value="lavagna" className="m-0 h-full">
                  <WhiteboardContent />
                </TabsContent>
              </div>
            </Tabs>
          </ErrorBoundary>
        </div>
      </div>
    </AppLayout>
  );
}
