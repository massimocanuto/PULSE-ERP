import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Sparkles, Loader2, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Copy, Check, Printer, Highlighter, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PDFViewerProps {
  url: string;
  filename: string;
  onRequestSummary?: () => void;
  summaryLoading?: boolean;
  summary?: string | null;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export function PDFViewer({ url, filename, onRequestSummary, summaryLoading, summary }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (window.pdfjsLib) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setError('Impossibile caricare la libreria PDF');
      setLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !url) return;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setPageImages([]);
      
      try {
        const pdfjsLib = window.pdfjsLib;
        const loadingTask = pdfjsLib.getDocument(url);
        const pdfDoc = await loadingTask.promise;
        
        setNumPages(pdfDoc.numPages);
        
        const images: string[] = [];
        for (let i = 1; i <= Math.min(pdfDoc.numPages, 20); i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) continue;
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          images.push(canvas.toDataURL('image/png'));
        }
        
        setPageImages(images);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Impossibile caricare il PDF');
      } finally {
        setLoading(false);
      }
    };
    
    loadPdf();
  }, [url, scriptLoaded]);

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < numPages) setCurrentPage(currentPage + 1);
  };

  const zoomIn = () => setScale(Math.min(scale + 0.2, 3));
  const zoomOut = () => setScale(Math.max(scale - 0.2, 0.5));
  const resetZoom = () => setScale(1.2);

  const handlePrint = () => {
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  const toggleHighlightMode = () => {
    setHighlightMode(!highlightMode);
  };

  const copyToClipboard = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasSummary = summary && summary.length > 0;

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-100">
      <div className="flex items-center justify-between p-3 bg-white border-b flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4 text-red-600" />
          <span className="font-medium truncate max-w-[200px]">{filename}</span>
          {numPages > 0 && (
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
              {numPages} {numPages === 1 ? 'pagina' : 'pagine'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Apri
          </a>
          <a
            href={url}
            download={filename}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Scarica
          </a>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Stampa
          </Button>
          <Button
            size="sm"
            variant={highlightMode ? "default" : "outline"}
            onClick={toggleHighlightMode}
            className={highlightMode ? "bg-yellow-500 hover:bg-yellow-600 gap-1.5" : "gap-1.5"}
          >
            <Highlighter className="h-3.5 w-3.5" />
            Evidenzia
          </Button>
          {onRequestSummary && (
            <Button
              size="sm"
              onClick={onRequestSummary}
              disabled={summaryLoading}
              className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600"
            >
              {summaryLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              )}
              {summaryLoading ? 'Analisi...' : 'Riassunto AI'}
            </Button>
          )}
        </div>
      </div>

      {numPages > 1 && !loading && !error && pageImages.length > 0 && (
        <div className="flex items-center justify-center gap-4 p-2 bg-gray-50 border-b flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              Pagina {currentPage} di {numPages}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage >= numPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="border-l pl-4 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-14 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetZoom} title="Reset zoom">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        <div 
          ref={containerRef}
          className={`lg:col-span-3 relative min-h-[700px] max-h-[850px] overflow-auto bg-gray-300 flex items-start justify-center p-4 ${highlightMode ? 'cursor-crosshair' : ''}`}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Caricamento anteprima...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
              <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-sm">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-gray-700 font-medium mb-2">Anteprima non disponibile</p>
                <p className="text-gray-500 text-sm mb-4">Puoi comunque aprire o scaricare il PDF</p>
                <div className="flex gap-2 justify-center">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apri
                  </a>
                  <a
                    href={url}
                    download={filename}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Scarica
                  </a>
                </div>
              </div>
            </div>
          )}
          
          {!loading && !error && pageImages.length > 0 && (
            <img 
              src={pageImages[currentPage - 1]} 
              alt={`Pagina ${currentPage}`}
              className="shadow-lg bg-white rounded max-w-full"
              style={{ 
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease',
                maxHeight: '700px'
              }}
            />
          )}
        </div>

        <div className="lg:col-span-2 border-l bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between p-3 border-b bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-medium text-sm text-gray-700">Riassunto AI</span>
            </div>
            {hasSummary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 px-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <ScrollArea className="h-[650px] lg:h-[800px]">
            <div className="p-4">
              {summaryLoading ? (
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-3" />
                  <p className="text-violet-600 text-sm font-medium">Analisi in corso...</p>
                  <p className="text-violet-500 text-xs mt-1">Generazione riassunto AI</p>
                </div>
              ) : hasSummary ? (
                <div className="max-w-none font-mono text-xs leading-relaxed
                  [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:text-gray-800 dark:[&_h1]:text-gray-200 [&_h1]:mt-4 [&_h1]:mb-2
                  [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-gray-800 dark:[&_h2]:text-gray-200 [&_h2]:mt-3 [&_h2]:mb-1.5
                  [&_h3]:text-xs [&_h3]:font-medium [&_h3]:text-gray-700 dark:[&_h3]:text-gray-300 [&_h3]:mt-2 [&_h3]:mb-1
                  [&_p]:text-gray-600 dark:[&_p]:text-gray-300 [&_p]:my-1.5
                  [&_li]:text-gray-600 dark:[&_li]:text-gray-300
                  [&_ul]:my-1.5 [&_ol]:my-1.5 [&_ul]:pl-4 [&_ol]:pl-4
                  [&_strong]:text-gray-800 dark:[&_strong]:text-gray-200
                  [&_a]:text-violet-600 hover:[&_a]:text-violet-700">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-violet-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Nessun riassunto</p>
                  <p className="text-gray-500 text-sm max-w-[200px]">
                    Clicca su "Riassunto AI" per generare un'analisi del documento
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
