import { Printer, Crown, Star } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MountainProgressProps {
  projectTitle: string;
  projectId?: string;
  tasks: { title: string; done: boolean }[];
}

// Premium Color Palette
const TIER_GROUPS = [
  { start: "#FDA4AF", end: "#BE123C" }, // Red/Pink
  { start: "#FCD34D", end: "#D97706" }, // Amber
  { start: "#67E8F9", end: "#0E7490" }, // Cyan
  { start: "#93C5FD", end: "#1D4ED8" }, // Blue
  { start: "#C4B5FD", end: "#6D28D9" }, // Purple
  { start: "#86EFAC", end: "#15803D" }, // Green
];

function MountainSVG({ tasks, progress, numTiers, baseY, tierHeight, displayTasks, large = false }: {
  tasks: { title: string; done: boolean }[];
  progress: number;
  numTiers: number;
  baseY: number;
  tierHeight: number;
  displayTasks: { title: string; done: boolean }[];
  large?: boolean;
}) {
  const viewBoxWidth = large ? 900 : 800; // Ridotta larghezza
  const viewBoxHeight = large ? 850 : 750;
  const mountainCenterX = large ? 180 : 160; // Spostato centro
  const mountainBase = viewBoxHeight - 50;
  const mountainTop = 50;
  const availableHeight = mountainBase - mountainTop;
  const scaledTierHeight = Math.min(tierHeight * 2.5, availableHeight / Math.max(numTiers, 1));
  const mountainHalfWidth = 220; // Allargata leggermente la base
  const labelStartX = mountainCenterX + mountainHalfWidth + 60;
  const labelWidth = viewBoxWidth - labelStartX - 150; // Ridotta larghezza delle label (più margine destro)

  // Calcolo per disegnare la montagna base
  const mountainPoints = `${mountainCenterX - mountainHalfWidth},${mountainBase} ${mountainCenterX},${mountainTop} ${mountainCenterX + mountainHalfWidth},${mountainBase}`;

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className="w-full h-auto drop-shadow-xl"
      style={{ maxHeight: large ? '700px' : '600px', minHeight: large ? '500px' : '400px' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Gradienti per ogni tier */}
        {TIER_GROUPS.map((colors, i) => (
          <linearGradient key={i} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.start} stopOpacity="0.9" />
            <stop offset="100%" stopColor={colors.end} stopOpacity="1" />
          </linearGradient>
        ))}

        {/* Gradiente Sfondo Montagna (Scheletro) */}
        <linearGradient id="mountainBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.8" />
        </linearGradient>

        {/* Ombreggiatura Premium */}
        <filter id="premiumShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.2" />
        </filter>

        {/* Glow per completato */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Sfondo Montagna (Scheletro) */}
      <polygon
        points={mountainPoints}
        fill="url(#mountainBg)"
        stroke="#94a3b8"
        strokeWidth="1"
        strokeDasharray="5,5"
        opacity="0.3"
      />

      {/* Linea centrale guida */}
      <line
        x1={mountainCenterX}
        y1={mountainTop}
        x2={mountainCenterX}
        y2={mountainBase}
        stroke="#cbd5e1"
        strokeWidth="1"
        strokeDasharray="4,4"
        opacity="0.5"
      />

      {/* Flag sulla cima se completato */}
      {progress === 100 && (
        <g transform={`translate(${mountainCenterX - 15}, ${mountainTop - 35})`}>
          <Crown size={30} color="#F59E0B" fill="#FCD34D" filter="url(#premiumShadow)" />
        </g>
      )}

      {/* Tiers/Livelli */}
      {displayTasks.map((task, index) => {
        const startY = mountainBase - (index * scaledTierHeight);
        const endY = startY - scaledTierHeight;
        const midY = startY - scaledTierHeight / 2;

        // Calcolo larghezza a questa altezza (interpolazione lineare del triangolo)
        const getXAtY = (y: number) => {
          const ratio = (mountainBase - y) / (mountainBase - mountainTop);
          const halfWidth = mountainHalfWidth * (1 - ratio * 0.95); // 0.95 per stringere un po'
          return mountainCenterX - halfWidth;
        };

        const x1 = getXAtY(startY);
        const x2 = getXAtY(endY);
        // Larghezza triangolo a startY e endY
        const w1 = (mountainCenterX - x1) * 2;
        const w2 = (mountainCenterX - x2) * 2;

        const colorIndex = index % TIER_GROUPS.length;
        const colors = TIER_GROUPS[colorIndex];
        const isDone = task.done;
        const opacity = isDone ? 1 : 0.4; // Più trasparente se non fatto

        // Label Position
        const labelY = midY;
        const connectorXStart = x1 + w1; // Bordo destro del tier

        return (
          <g key={index} className="transition-all duration-500 ease-in-out">
            {/* Trapezio del livello */}
            <polygon
              points={`${x1},${startY} ${x1 + w1},${startY} ${x2 + w2},${endY} ${x2},${endY}`}
              fill={`url(#grad-${colorIndex})`}
              opacity={opacity}
              filter={isDone ? "url(#premiumShadow)" : undefined}
              stroke="white"
              strokeWidth="1"
            />

            {/* Numero livello dentro la montagna */}
            <text
              x={mountainCenterX}
              y={midY + 5}
              textAnchor="middle"
              fill="white"
              fontSize={large ? "16" : "14"}
              fontWeight="bold"
              style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.3)" }}
            >
              {index + 1}
            </text>

            {/* Connettore Curvo */}
            <path
              d={`M${connectorXStart},${midY} C${connectorXStart + 30},${midY} ${labelStartX - 30},${labelY} ${labelStartX},${labelY}`}
              fill="none"
              stroke={isDone ? colors.end : "#cbd5e1"}
              strokeWidth={isDone ? "2" : "1"}
              strokeDasharray={isDone ? "none" : "3,3"}
              opacity="0.6"
            />

            {/* Etichetta esterna */}
            <g transform={`translate(${labelStartX}, ${labelY - 18})`}>
              {/* Sfondo Etichetta */}
              <rect
                width={labelWidth}
                height="36"
                rx="8"
                fill="white"
                stroke={isDone ? colors.end : "#e2e8f0"}
                strokeWidth={isDone ? "2" : "1"}
                filter="url(#premiumShadow)"
                opacity={isDone ? 1 : 0.7}
              />

              {/* Barra laterale colorata */}
              <rect
                x="0" y="0"
                width="6" height="36"
                rx="4" // Arrotondato a sinistra
                fill={`url(#grad-${colorIndex})`}
                opacity={isDone ? 1 : 0.5}
              />
              {/* Fix per angolo destro della barra laterale per non sbordare se rx è grande, 
                    ma qui con width piccola e rx piccolo va bene. Oppure usiamo clipPath.
                    Metodo semplice: sovrapponiamo un rect bianco per tagliare l'arrotondamento destro se necessario,
                    ma con rx=4 su rect padre e child non serve.
                */}

              {/* Testo Etichetta */}
              <text
                x="16"
                y="23"
                fill={isDone ? "#1e293b" : "#94a3b8"}
                fontSize={large ? "14" : "12"}
                fontWeight={isDone ? "600" : "400"}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {task.title.length > (large ? 50 : 40) ? task.title.substring(0, large ? 50 : 40) + '...' : task.title}
              </text>

              {/* Icona Status a destra */}
              {isDone && (
                <g transform={`translate(${labelWidth - 30}, 8)`}>
                  <circle cx="10" cy="10" r="10" fill={`url(#grad-${colorIndex})`} />
                  <Star size={12} color="white" fill="white" x="4" y="4" />
                </g>
              )}
            </g>

          </g>
        );
      })}

    </svg>
  );
}

export function MountainProgress({ projectTitle, projectId, tasks }: MountainProgressProps) {
  const [, setLocation] = useLocation();
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.done).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const maxDisplay = 15; // Ripristinato a 15
  const displayTasks = tasks.slice(0, maxDisplay);
  const remainingTasks = totalTasks - maxDisplay;
  const numTiers = displayTasks.length || 1;
  const tierHeight = 44;
  const baseY = 230;

  const handleMountainClick = () => {
    if (projectId) {
      setLocation(`/projects?selected=${projectId}`);
    }
  };

  const handlePrint = () => {
    // ... existing print logic reuse ...
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Progresso - ${projectTitle}</title>
          <style>body{font-family:sans-serif;padding:20px; text-align:center;} .container{max-width:800px;margin:0 auto;}</style>
        </head>
        <body>
            <div class="container">
                <h1>${projectTitle}</h1>
                ${printContent.innerHTML}
                <h2>${Math.round(progress)}% Completato</h2>
            </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (totalTasks === 0) {
    return (
      <div className="relative w-full py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <p className="text-muted-foreground font-medium">Nessuna attività</p>
        <p className="text-xs text-muted-foreground mt-1">Aggiungi task al progetto</p>
      </div>
    );
  }

  return (
    <div className="relative w-full py-8 px-6 rounded-2xl bg-gradient-to-br from-sky-50/80 via-blue-50/30 to-white border border-sky-100/50 shadow-inner">
      {/* Intestazione Statistica */}
      <div className="flex items-end justify-between mb-6 px-2">
        <div>
          <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
            {Math.round(progress)}<span className="text-3xl">%</span>
          </div>
          <div className="text-sm font-medium text-muted-foreground mt-1">
            Progresso Generale
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-gray-700">
            {completedTasks}<span className="text-gray-400 text-lg">/{totalTasks}</span>
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            {remainingTasks > 0 && <span className="bg-gray-100 px-2 py-0.5 rounded-full">+{remainingTasks} altri</span>}
            <span>Tasks</span>
          </div>
        </div>
      </div>

      {/* Pulsante Stampa (piccolo e discreto) */}
      <div className="absolute top-0 right-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700" onClick={() => setShowPrintDialog(true)}>
          <Printer size={16} />
        </Button>
      </div>

      {/* Montagna Grafica */}
      <div
        className={`transition-transform duration-300 ${projectId ? "cursor-pointer hover:scale-[1.02]" : ""}`}
        onClick={handleMountainClick}
      >
        <MountainSVG
          tasks={tasks}
          progress={progress}
          numTiers={numTiers}
          baseY={baseY}
          tierHeight={tierHeight}
          displayTasks={displayTasks}
        />
      </div>

      {/* Dialog Stampa */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{projectTitle} - Report</DialogTitle>
          </DialogHeader>
          <div ref={printRef} className="py-8 bg-white rounded-xl flex justify-center">
            <MountainSVG
              tasks={tasks}
              progress={progress}
              numTiers={numTiers}
              baseY={baseY}
              tierHeight={tierHeight}
              displayTasks={displayTasks}
              large={true}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={handlePrint}>Stampa Report</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
