import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface ExcelSheet {
  name: string;
  data: any[][];
}

interface ExcelViewerProps {
  sheets: ExcelSheet[];
  filename: string;
  onClose?: () => void;
}

export function ExcelViewer({ sheets, filename, onClose }: ExcelViewerProps) {
  const [activeSheet, setActiveSheet] = useState(0);
  const [page, setPage] = useState(0);
  const rowsPerPage = 50;

  if (!sheets || sheets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <FileSpreadsheet className="w-8 h-8 mr-2" />
        <span>Nessun dato disponibile</span>
      </div>
    );
  }

  const currentSheet = sheets[activeSheet];
  const headers = currentSheet.data[0] || [];
  const rows = currentSheet.data.slice(1);
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const paginatedRows = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const getColumnWidth = (colIndex: number) => {
    const header = headers[colIndex]?.toString() || '';
    const maxDataLength = Math.max(
      header.length,
      ...paginatedRows.map(row => (row[colIndex]?.toString() || '').length).slice(0, 20)
    );
    return Math.min(Math.max(80, maxDataLength * 8), 300);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border">
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          <span className="font-medium truncate max-w-[200px]">{filename}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{rows.length} righe</span>
          <span>•</span>
          <span>{headers.length} colonne</span>
        </div>
      </div>

      {sheets.length > 1 && (
        <Tabs value={activeSheet.toString()} onValueChange={(v) => { setActiveSheet(parseInt(v)); setPage(0); }}>
          <TabsList className="w-full justify-start rounded-none border-b bg-muted/20 px-2">
            {sheets.map((sheet, idx) => (
              <TabsTrigger key={idx} value={idx.toString()} className="text-xs">
                {sheet.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <ScrollArea className="flex-1">
        <div className="min-w-max">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/50">
                <th className="w-12 px-2 py-2 text-center font-medium text-muted-foreground border-b border-r bg-muted/70">
                  #
                </th>
                {headers.map((header, idx) => (
                  <th 
                    key={idx} 
                    className="px-3 py-2 text-left font-medium border-b border-r bg-muted/70 whitespace-nowrap"
                    style={{ minWidth: getColumnWidth(idx) }}
                  >
                    {header?.toString() || `Colonna ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="w-12 px-2 py-1.5 text-center text-muted-foreground border-b border-r bg-muted/20 text-xs">
                    {page * rowsPerPage + rowIdx + 1}
                  </td>
                  {headers.map((_, colIdx) => (
                    <td 
                      key={colIdx} 
                      className="px-3 py-1.5 border-b border-r whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ maxWidth: 300 }}
                      title={row[colIdx]?.toString() || ''}
                    >
                      {row[colIdx]?.toString() || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-2 border-t bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Pagina {page + 1} di {totalPages}
          </span>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
