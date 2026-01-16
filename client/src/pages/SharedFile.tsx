import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import { FileText, FileImage, File, Download, Clock, AlertCircle, CheckCircle2, Loader2, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function SharedFile() {
  const [, params] = useRoute("/shared/:token");
  const token = params?.token;
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadCount, setDownloadCount] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  const { data: document, isLoading, error } = useQuery({
    queryKey: ["shared-document", token],
    queryFn: async () => {
      const res = await fetch(`/api/shared/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore nel caricamento");
      }
      const doc = await res.json();
      setDownloadCount(doc.downloadCount || 0);
      return doc;
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (!document?.shareExpiresAt) return;
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(document.shareExpiresAt).getTime();
      const diff = expiry - now;
      
      if (diff <= 0) {
        setTimeRemaining("Scaduto");
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [document?.shareExpiresAt]);

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith("image/")) return <FileImage className="h-16 w-16 text-blue-500" />;
    if (fileType === "application/pdf") return <FileText className="h-16 w-16 text-red-500" />;
    return <File className="h-16 w-16 text-gray-500" />;
  };

  const handleDownload = () => {
    if (!token) return;
    
    setDownloading(true);
    
    // Navigate directly to download endpoint - this forces download
    window.location.href = `/api/shared/${token}/file`;
    
    // Update local count and state after a short delay
    setTimeout(() => {
      setDownloadCount((prev) => (prev || 0) + 1);
      setDownloaded(true);
      setDownloading(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="animate-pulse text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold">Link non valido</h2>
              <p className="text-muted-foreground">
                {(error as Error).message || "Il link potrebbe essere scaduto o non esistere."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="max-w-7xl w-full">
        <CardHeader className="text-center border-b pb-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="font-semibold text-primary">PULSE ERP</span>
            <span>•</span>
            <span>Documento condiviso</span>
          </div>
          <CardTitle className="text-xl mb-4">{document?.title || document?.fileName}</CardTitle>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
            {timeRemaining && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining === "Scaduto" ? "bg-red-100" : "bg-red-50"}`}>
                <Timer className="h-5 w-5 text-red-600 animate-pulse" />
                <div className="flex flex-col items-start">
                  <span className="text-red-600 font-bold text-lg tabular-nums">{timeRemaining}</span>
                  <span className="text-red-500 text-xs">Tempo rimanente</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {document?.fileSize && (
                <span className="bg-slate-100 px-3 py-1 rounded-full">{(document.fileSize / 1024).toFixed(1)} KB</span>
              )}
              {downloadCount !== null && downloadCount > 0 && (
                <span className="bg-slate-100 px-3 py-1 rounded-full text-xs">Scaricato {downloadCount} {downloadCount === 1 ? 'volta' : 'volte'}</span>
              )}
            </div>

            {document?.sharedByName && (
              <div className="flex items-center gap-2 animate-pulse bg-red-50 px-4 py-2 rounded-lg">
                <span className="text-red-600 font-semibold">Condiviso da:</span>
                <span className="text-red-700 font-bold text-lg">{document.sharedByName}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">
            {document?.fileType?.startsWith("image/") ? (
              <img 
                src={document.filePath} 
                alt={document.fileName}
                className="max-h-96 rounded-lg shadow-lg"
              />
            ) : document?.fileType === "application/pdf" ? (
              <div className="w-full">
                <iframe 
                  src={`${document.filePath}#zoom=150`}
                  className="w-full h-[700px] rounded-lg border"
                  title={document.fileName}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {getFileIcon(document?.fileType)}
                <p className="text-lg font-medium">{document?.fileName}</p>
              </div>
            )}

            {downloaded ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Download avviato!</span>
                </div>
                <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Scarica di nuovo
                </Button>
              </div>
            ) : (
              <Button onClick={handleDownload} size="lg" className="gap-2" disabled={downloading}>
                {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                Scarica file
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
