import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Pencil, Trash2, Share2, Check } from "lucide-react";

interface PanelShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function PanelShell({ children, header, footer }: PanelShellProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-card">
      {header && (
        <div className="flex-shrink-0 border-b border-border">
          {header}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
      {footer && (
        <div className="flex-shrink-0 border-t border-border">
          {footer}
        </div>
      )}
    </div>
  );
}

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isEditing?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
  progress?: number;
  editingTitle?: string;
  onTitleChange?: (value: string) => void;
}

export function PanelHeader({
  title,
  subtitle,
  icon,
  isEditing,
  onSave,
  onCancel,
  onEdit,
  onShare,
  onDelete,
  onClose,
  progress,
  editingTitle,
  onTitleChange,
}: PanelHeaderProps) {
  return (
    <div className="px-4 py-3 bg-gradient-to-r from-violet-50/80 to-purple-50/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {isEditing && onTitleChange ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full text-base font-semibold bg-white border border-violet-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-300"
                autoFocus
              />
            ) : (
              <h3 className="font-semibold text-base text-foreground truncate">{title}</h3>
            )}
            {subtitle && !isEditing && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isEditing ? (
            <>
              <button 
                onClick={onSave} 
                className="p-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors"
              >
                <Check className="h-4 w-4" />
              </button>
              <button 
                onClick={onCancel} 
                className="p-2 rounded-lg text-muted-foreground hover:bg-white/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              {onEdit && (
                <button 
                  onClick={onEdit} 
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {onShare && (
                <button 
                  onClick={onShare} 
                  className="p-2 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-white/60 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={onDelete} 
                  className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-white/60 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              {onClose && (
                <button 
                  onClick={onClose} 
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-violet-600">{progress}%</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface PanelContentProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: boolean;
}

export function PanelContent({ children, scrollable = true, padding = true }: PanelContentProps) {
  if (scrollable) {
    return (
      <ScrollArea className="flex-1">
        <div className={padding ? "p-4" : ""}>
          {children}
        </div>
      </ScrollArea>
    );
  }
  
  return (
    <div className={`flex-1 overflow-auto ${padding ? "p-4" : ""}`}>
      {children}
    </div>
  );
}

interface PanelEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

export function PanelEmptyState({ icon, title, description }: PanelEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="text-muted-foreground/30 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg text-muted-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground/70 max-w-[250px]">
          {description}
        </p>
      )}
    </div>
  );
}
