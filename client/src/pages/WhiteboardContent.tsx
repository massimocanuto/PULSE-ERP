import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  PenTool, Plus, Search, Trash2, Loader2, Square, Circle, Type, 
  StickyNote, MousePointer, Grid, Users, Share2, ArrowLeft,
  ZoomIn, ZoomOut, Upload, X, Crown, UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface WhiteboardType {
  id: string;
  title: string;
  description?: string;
  ownerId?: string;
  projectId?: string;
  isPublic: boolean;
  backgroundColor: string;
  gridEnabled: boolean;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

interface WhiteboardElement {
  id: string;
  whiteboardId: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  color: string;
  fontSize: number;
  fontWeight: string;
  borderColor?: string;
  borderWidth: number;
  shapeType?: string;
  points?: string;
  zIndex: number;
  locked: boolean;
  createdBy?: string;
}

const STICKY_COLORS = [
  "#fef08a", "#fde047", "#a3e635", "#86efac", "#67e8f9", 
  "#7dd3fc", "#c4b5fd", "#f0abfc", "#fda4af", "#fdba74"
];

interface CollaboratorInfo {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
}

interface CollaboratorsData {
  owner: CollaboratorInfo | null;
  collaborators: CollaboratorInfo[];
}

const API_BASE = "/api";

const whiteboardApi = {
  getBoards: async (userId?: string): Promise<WhiteboardType[]> => {
    const url = userId ? `${API_BASE}/whiteboards?userId=${userId}` : `${API_BASE}/whiteboards`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch whiteboards");
    return res.json();
  },
  createBoard: async (board: Partial<WhiteboardType>): Promise<WhiteboardType> => {
    const res = await fetch(`${API_BASE}/whiteboards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(board),
    });
    if (!res.ok) throw new Error("Failed to create whiteboard");
    return res.json();
  },
  deleteBoard: async (id: string, userId?: string): Promise<void> => {
    const params = userId ? `?userId=${userId}` : '';
    const res = await fetch(`${API_BASE}/whiteboards/${id}${params}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error("Failed to delete whiteboard");
  },
  getElements: async (boardId: string): Promise<WhiteboardElement[]> => {
    const res = await fetch(`${API_BASE}/whiteboards/${boardId}/elements`);
    if (!res.ok) throw new Error("Failed to fetch elements");
    return res.json();
  },
  createElement: async (boardId: string, element: Partial<WhiteboardElement>): Promise<WhiteboardElement> => {
    const res = await fetch(`${API_BASE}/whiteboards/${boardId}/elements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(element),
    });
    if (!res.ok) throw new Error("Failed to create element");
    return res.json();
  },
  updateElement: async (id: string, element: Partial<WhiteboardElement>): Promise<WhiteboardElement> => {
    const res = await fetch(`${API_BASE}/whiteboard-elements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(element),
    });
    if (!res.ok) throw new Error("Failed to update element");
    return res.json();
  },
  deleteElement: async (id: string, userId?: string): Promise<void> => {
    const params = userId ? `?userId=${userId}` : '';
    const res = await fetch(`${API_BASE}/whiteboard-elements/${id}${params}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error("Failed to delete element");
  },
  getCollaborators: async (boardId: string): Promise<CollaboratorsData> => {
    const res = await fetch(`${API_BASE}/whiteboards/${boardId}/collaborators`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch collaborators");
    return res.json();
  },
  addCollaborator: async (boardId: string, collaboratorId: string): Promise<WhiteboardType> => {
    const res = await fetch(`${API_BASE}/whiteboards/${boardId}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ collaboratorId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to add collaborator");
    }
    return res.json();
  },
  removeCollaborator: async (boardId: string, collaboratorId: string): Promise<WhiteboardType> => {
    const res = await fetch(`${API_BASE}/whiteboards/${boardId}/collaborators/${collaboratorId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to remove collaborator");
    return res.json();
  },
};

export default function WhiteboardContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBoard, setSelectedBoard] = useState<WhiteboardType | null>(null);
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  
  const [activeTool, setActiveTool] = useState<string>("select");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<WhiteboardElement | null>(null);
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [draggedElement, setDraggedElement] = useState<WhiteboardElement | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const { toast } = useToast();

  const userId = user?.id || "";

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["whiteboards", userId],
    queryFn: () => whiteboardApi.getBoards(userId),
    enabled: !!userId,
  });
  
  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: shareModalOpen,
  });
  
  const { data: collaboratorsData } = useQuery({
    queryKey: ["whiteboard-collaborators", selectedBoard?.id],
    queryFn: () => selectedBoard ? whiteboardApi.getCollaborators(selectedBoard.id) : Promise.resolve({ owner: null, collaborators: [] }),
    enabled: !!selectedBoard && shareModalOpen,
  });

  const { data: elements = [] } = useQuery({
    queryKey: ["whiteboard-elements", selectedBoard?.id],
    queryFn: () => selectedBoard ? whiteboardApi.getElements(selectedBoard.id) : Promise.resolve([]),
    enabled: !!selectedBoard,
  });

  const createBoardMutation = useMutation({
    mutationFn: (data: Partial<WhiteboardType>) => whiteboardApi.createBoard(data),
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: ["whiteboards"] });
      setNewBoardOpen(false);
      setNewBoardTitle("");
      setNewBoardDescription("");
      setSelectedBoard(board);
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (id: string) => whiteboardApi.deleteBoard(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whiteboards"] });
      setSelectedBoard(null);
    },
  });

  const createElementMutation = useMutation({
    mutationFn: ({ boardId, element }: { boardId: string; element: Partial<WhiteboardElement> }) => 
      whiteboardApi.createElement(boardId, element),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whiteboard-elements", selectedBoard?.id] });
    },
  });

  const updateElementMutation = useMutation({
    mutationFn: ({ id, element }: { id: string; element: Partial<WhiteboardElement> }) => 
      whiteboardApi.updateElement(id, element),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whiteboard-elements", selectedBoard?.id] });
    },
  });

  const deleteElementMutation = useMutation({
    mutationFn: (id: string) => whiteboardApi.deleteElement(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whiteboard-elements", selectedBoard?.id] });
      setSelectedElement(null);
    },
  });

  const addCollaboratorMutation = useMutation({
    mutationFn: ({ boardId, collaboratorId }: { boardId: string; collaboratorId: string }) => 
      whiteboardApi.addCollaborator(boardId, collaboratorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whiteboard-collaborators", selectedBoard?.id] });
      queryClient.invalidateQueries({ queryKey: ["whiteboards"] });
      setSearchUserQuery("");
      toast({
        title: "Collaboratore aggiunto",
        description: "L'utente ora può accedere alla lavagna",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere il collaboratore",
        variant: "destructive",
      });
    },
  });

  const removeCollaboratorMutation = useMutation({
    mutationFn: ({ boardId, collaboratorId }: { boardId: string; collaboratorId: string }) => 
      whiteboardApi.removeCollaborator(boardId, collaboratorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whiteboard-collaborators", selectedBoard?.id] });
      queryClient.invalidateQueries({ queryKey: ["whiteboards"] });
      toast({
        title: "Collaboratore rimosso",
        description: "L'utente non può più accedere alla lavagna",
      });
    },
  });

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!selectedBoard || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (activeTool === "sticky") {
      createElementMutation.mutate({
        boardId: selectedBoard.id,
        element: {
          type: "sticky",
          x: Math.round(x),
          y: Math.round(y),
          width: 200,
          height: 200,
          color: stickyColor,
          content: "",
          zIndex: elements.length,
          createdBy: user?.id,
        },
      });
      setActiveTool("select");
    } else if (activeTool === "text") {
      createElementMutation.mutate({
        boardId: selectedBoard.id,
        element: {
          type: "text",
          x: Math.round(x),
          y: Math.round(y),
          width: 200,
          height: 40,
          color: "#000000",
          content: "Nuovo testo",
          fontSize: 16,
          zIndex: elements.length,
          createdBy: user?.id,
        },
      });
      setActiveTool("select");
    } else if (activeTool === "rectangle") {
      createElementMutation.mutate({
        boardId: selectedBoard.id,
        element: {
          type: "shape",
          shapeType: "rectangle",
          x: Math.round(x),
          y: Math.round(y),
          width: 150,
          height: 100,
          color: "#e2e8f0",
          borderColor: "#64748b",
          borderWidth: 2,
          zIndex: elements.length,
          createdBy: user?.id,
        },
      });
      setActiveTool("select");
    } else if (activeTool === "circle") {
      createElementMutation.mutate({
        boardId: selectedBoard.id,
        element: {
          type: "shape",
          shapeType: "circle",
          x: Math.round(x),
          y: Math.round(y),
          width: 100,
          height: 100,
          color: "#e2e8f0",
          borderColor: "#64748b",
          borderWidth: 2,
          zIndex: elements.length,
          createdBy: user?.id,
        },
      });
      setActiveTool("select");
    } else if (activeTool === "select") {
      setSelectedElement(null);
    }
  };

  const handleElementClick = (e: React.MouseEvent, element: WhiteboardElement) => {
    e.stopPropagation();
    if (activeTool === "select" && !draggedElement) {
      setSelectedElement(element);
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, element: WhiteboardElement) => {
    if (activeTool !== "select" || element.locked) return;
    e.stopPropagation();
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;
    
    setDraggedElement(element);
    setDragOffset({ x: mouseX - element.x, y: mouseY - element.y });
    setSelectedElement(element);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggedElement || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;
    
    const newX = Math.round(mouseX - dragOffset.x);
    const newY = Math.round(mouseY - dragOffset.y);
    
    setDragPosition({ x: newX, y: newY });
  };

  const handleCanvasMouseUp = () => {
    if (draggedElement && dragPosition) {
      updateElementMutation.mutate({
        id: draggedElement.id,
        element: { x: dragPosition.x, y: dragPosition.y },
      });
    }
    setDraggedElement(null);
    setDragPosition(null);
  };

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBoard) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('x', '100');
      formData.append('y', '100');

      const res = await fetch(`/api/whiteboards/${selectedBoard.id}/upload?userId=${userId}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload fallito');
      }

      toast({
        title: "File caricato",
        description: `${file.name} aggiunto alla lavagna`,
      });

      queryClient.invalidateQueries({ queryKey: ["whiteboard-elements", selectedBoard.id] });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare il file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "d MMM yyyy", { locale: it });
    } catch {
      return "";
    }
  };

  const renderElement = (element: WhiteboardElement) => {
    const isSelected = selectedElement?.id === element.id;
    const displayX = draggedElement?.id === element.id && dragPosition ? dragPosition.x : element.x;
    const displayY = draggedElement?.id === element.id && dragPosition ? dragPosition.y : element.y;
    
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      left: displayX,
      top: displayY,
      width: element.width,
      height: element.height,
      zIndex: element.zIndex,
      cursor: activeTool === "select" ? "grab" : "default",
      outline: isSelected ? "2px solid #3b82f6" : "none",
      outlineOffset: "2px",
    };

    if (element.type === "sticky") {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            backgroundColor: element.color,
            borderRadius: "4px",
            padding: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
          onClick={(e) => handleElementClick(e, element)}
          onMouseDown={(e) => handleElementMouseDown(e, element)}
        >
          <textarea
            value={element.content || ""}
            onChange={(e) => {
              updateElementMutation.mutate({
                id: element.id,
                element: { content: e.target.value },
              });
            }}
            className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-sm"
            placeholder="Scrivi qui..."
          />
        </div>
      );
    }

    if (element.type === "text") {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            color: element.color,
            fontSize: element.fontSize,
            fontWeight: element.fontWeight,
          }}
          onClick={(e) => handleElementClick(e, element)}
          onMouseDown={(e) => handleElementMouseDown(e, element)}
        >
          <input
            value={element.content || ""}
            onChange={(e) => {
              updateElementMutation.mutate({
                id: element.id,
                element: { content: e.target.value },
              });
            }}
            className="w-full bg-transparent border-none focus:outline-none"
            style={{ fontSize: element.fontSize }}
          />
        </div>
      );
    }

    if (element.type === "shape") {
      if (element.shapeType === "circle") {
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.color,
              borderRadius: "50%",
              border: `${element.borderWidth}px solid ${element.borderColor}`,
            }}
            onClick={(e) => handleElementClick(e, element)}
            onMouseDown={(e) => handleElementMouseDown(e, element)}
          />
        );
      }
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            backgroundColor: element.color,
            borderRadius: "4px",
            border: `${element.borderWidth}px solid ${element.borderColor}`,
          }}
          onClick={(e) => handleElementClick(e, element)}
          onMouseDown={(e) => handleElementMouseDown(e, element)}
        />
      );
    }

    if (element.type === "image") {
      try {
        const fileData = JSON.parse(element.content || "{}");
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              borderRadius: "4px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => handleElementClick(e, element)}
            onMouseDown={(e) => handleElementMouseDown(e, element)}
          >
            <img
              src={fileData.url}
              alt={fileData.filename}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          </div>
        );
      } catch {
        return null;
      }
    }

    return null;
  };

  if (selectedBoard) {
    return (
      <div className="flex flex-col h-full overflow-hidden rounded-xl border shadow-sm bg-card">
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedBoard(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <span className="font-semibold">{selectedBoard.title}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={activeTool === "select" ? "secondary" : "ghost"} 
                      size="sm"
                      onClick={() => setActiveTool("select")}
                    >
                      <MousePointer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Seleziona</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={activeTool === "sticky" ? "secondary" : "ghost"} 
                      size="sm"
                      onClick={() => setActiveTool("sticky")}
                    >
                      <StickyNote className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Post-it</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={activeTool === "text" ? "secondary" : "ghost"} 
                      size="sm"
                      onClick={() => setActiveTool("text")}
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Testo</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={activeTool === "rectangle" ? "secondary" : "ghost"} 
                      size="sm"
                      onClick={() => setActiveTool("rectangle")}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rettangolo</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={activeTool === "circle" ? "secondary" : "ghost"} 
                      size="sm"
                      onClick={() => setActiveTool("circle")}
                    >
                      <Circle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cerchio</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            {activeTool === "sticky" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: stickyColor }} />
                    Colore
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {STICKY_COLORS.map(color => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded border-2"
                        style={{ 
                          backgroundColor: color,
                          borderColor: stickyColor === color ? "#3b82f6" : "transparent"
                        }}
                        onClick={() => setStickyColor(color)}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.25))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={handleFileUpload}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </Button>

            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Condividi Lavagna</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Aggiungi collaboratore</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Cerca utente..."
                        value={searchUserQuery}
                        onChange={(e) => setSearchUserQuery(e.target.value)}
                      />
                    </div>
                    {searchUserQuery && (
                      <div className="mt-2 border rounded-lg max-h-40 overflow-auto">
                        {allUsers
                          .filter((u: any) => 
                            u.id !== user?.id && 
                            u.id !== selectedBoard.ownerId &&
                            !collaboratorsData?.collaborators?.some(c => c.id === u.id) &&
                            (u.name?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
                             u.username?.toLowerCase().includes(searchUserQuery.toLowerCase()))
                          )
                          .map((u: any) => (
                            <div 
                              key={u.id} 
                              className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                              onClick={() => {
                                addCollaboratorMutation.mutate({ 
                                  boardId: selectedBoard.id, 
                                  collaboratorId: u.id 
                                });
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{u.name?.[0] || u.username?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{u.name || u.username}</p>
                                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                                </div>
                              </div>
                              <UserPlus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Collaboratori attuali</Label>
                    <div className="mt-2 space-y-2">
                      {collaboratorsData?.owner && (
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{collaboratorsData.owner.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{collaboratorsData.owner.name}</p>
                              <p className="text-xs text-muted-foreground">Proprietario</p>
                            </div>
                          </div>
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </div>
                      )}
                      {collaboratorsData?.collaborators?.map(collab => (
                        <div key={collab.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{collab.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{collab.name}</p>
                              <p className="text-xs text-muted-foreground">@{collab.username}</p>
                            </div>
                          </div>
                          {selectedBoard.ownerId === user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCollaboratorMutation.mutate({
                                boardId: selectedBoard.id,
                                collaboratorId: collab.id
                              })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {selectedElement && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => deleteElementMutation.mutate(selectedElement.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden"
          style={{
            backgroundColor: selectedBoard.backgroundColor || "#ffffff",
            backgroundImage: selectedBoard.gridEnabled ? 
              "radial-gradient(circle, #d1d5db 1px, transparent 1px)" : "none",
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            cursor: draggedElement ? "grabbing" : undefined,
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              position: "absolute",
              width: "5000px",
              height: "5000px",
            }}
          >
            {elements.map(renderElement)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border shadow-sm h-full flex flex-col bg-card">
      <div className="p-4 border-b flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca lavagne..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Dialog open={newBoardOpen} onOpenChange={setNewBoardOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Lavagna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuova Lavagna</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Titolo</Label>
                <Input 
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="Es: Brainstorming Q1 2025"
                />
              </div>
              <div>
                <Label>Descrizione (opzionale)</Label>
                <Textarea 
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="Descrivi lo scopo della lavagna..."
                />
              </div>
              <Button 
                className="w-full bg-violet-600 hover:bg-violet-700"
                onClick={() => {
                  if (newBoardTitle.trim()) {
                    createBoardMutation.mutate({
                      title: newBoardTitle,
                      description: newBoardDescription,
                      ownerId: user?.id,
                      isPublic: false,
                      backgroundColor: "#ffffff",
                      gridEnabled: true,
                    });
                  }
                }}
                disabled={createBoardMutation.isPending || !newBoardTitle.trim()}
              >
                {createBoardMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Crea Lavagna
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : filteredBoards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBoards.map((board) => (
              <Card
                key={board.id}
                className="p-4 cursor-pointer hover:shadow-md transition-all group"
                onClick={() => setSelectedBoard(board)}
              >
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0" style={{
                    backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
                    backgroundSize: "10px 10px",
                  }} />
                  <PenTool className="h-8 w-8 text-gray-400 relative z-10" />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{board.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(board.updatedAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 text-red-500"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmed = await confirm({
                        title: "Elimina lavagna",
                        description: "Sei sicuro di voler eliminare questa lavagna?",
                        confirmText: "Elimina",
                        variant: "destructive",
                      });
                      if (confirmed) {
                        deleteBoardMutation.mutate(board.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {board.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{board.description}</p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <PenTool className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Nessuna lavagna</h3>
            <p className="text-sm text-muted-foreground/70">
              Crea la tua prima lavagna per iniziare il brainstorming!
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
