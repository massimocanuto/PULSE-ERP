import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Book, X } from "lucide-react";

interface BookViewerProps {
  title: string;
  content: string;
  onClose: () => void;
}

export function BookViewer({ title, content, onClose }: BookViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");

  const pages = useMemo(() => {
    const lines = content.split('\n');
    const pageSize = 25;
    const result: string[] = [];
    
    for (let i = 0; i < lines.length; i += pageSize) {
      result.push(lines.slice(i, i + pageSize).join('\n'));
    }
    
    return result.length > 0 ? result : [content];
  }, [content]);

  const goToPage = (direction: "prev" | "next") => {
    if (isFlipping) return;
    
    const newPage = direction === "next" 
      ? Math.min(currentPage + 1, pages.length - 1)
      : Math.max(currentPage - 1, 0);
    
    if (newPage === currentPage) return;
    
    setFlipDirection(direction === "next" ? "right" : "left");
    setIsFlipping(true);
    
    setTimeout(() => {
      setCurrentPage(newPage);
      setTimeout(() => setIsFlipping(false), 300);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
        
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-800 to-orange-800 px-6 py-3 flex items-center gap-3">
            <Book className="h-5 w-5 text-amber-100" />
            <h2 className="text-lg font-serif font-semibold text-amber-50 truncate">{title}</h2>
          </div>
          
          <div className="relative h-[70vh] perspective-1000">
            <div 
              className={`absolute inset-0 p-8 transition-transform duration-300 ease-in-out origin-left
                ${isFlipping && flipDirection === "right" ? "animate-flip-out-right" : ""}
                ${isFlipping && flipDirection === "left" ? "animate-flip-out-left" : ""}
              `}
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="h-full overflow-auto bg-white/50 dark:bg-black/20 rounded-lg p-6 shadow-inner">
                <div className="font-serif text-base leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                  {pages[currentPage]}
                </div>
              </div>
              
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <div className="px-4 py-1 bg-amber-800/10 rounded-full">
                  <span className="text-sm font-serif text-amber-800 dark:text-amber-200">
                    Pagina {currentPage + 1} di {pages.length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-start pl-2">
              <Button
                variant="ghost"
                size="lg"
                className="h-20 w-12 rounded-full bg-amber-800/20 hover:bg-amber-800/40 text-amber-900 dark:text-amber-100 disabled:opacity-30"
                onClick={() => goToPage("prev")}
                disabled={currentPage === 0 || isFlipping}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            </div>
            
            <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-2">
              <Button
                variant="ghost"
                size="lg"
                className="h-20 w-12 rounded-full bg-amber-800/20 hover:bg-amber-800/40 text-amber-900 dark:text-amber-100 disabled:opacity-30"
                onClick={() => goToPage("next")}
                disabled={currentPage === pages.length - 1 || isFlipping}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-800/50 to-orange-800/50 px-6 py-2 flex justify-center gap-1">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (!isFlipping && idx !== currentPage) {
                    setFlipDirection(idx > currentPage ? "right" : "left");
                    setIsFlipping(true);
                    setTimeout(() => {
                      setCurrentPage(idx);
                      setTimeout(() => setIsFlipping(false), 300);
                    }, 300);
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentPage 
                    ? "bg-amber-100 w-4" 
                    : "bg-amber-100/40 hover:bg-amber-100/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes flipOutRight {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-90deg); }
        }
        @keyframes flipOutLeft {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(90deg); }
        }
        .animate-flip-out-right {
          animation: flipOutRight 0.3s ease-in forwards;
        }
        .animate-flip-out-left {
          animation: flipOutLeft 0.3s ease-in forwards;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
