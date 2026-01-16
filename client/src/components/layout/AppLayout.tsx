import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from "@/components/ui/sidebar";
import {
  Briefcase,
  MessageSquare,
  MessageCircle,
  Phone,
  Users,
  Mail,
  LayoutDashboard,
  Search,
  Settings,
  PlusCircle,
  MoreHorizontal,
  Send,
  FileText,
  Sun,
  Moon,
  Palette,
  Bell,
  Clock,
  AlertCircle,
  CheckCircle2,
  Shield,
  Archive,
  CheckSquare,
  BarChart3,
  Type,
  BookOpen,
  Bot,
  Database,
  CalendarDays,
  StickyNote,
  PanelLeftClose,
  PanelLeft,
  Maximize2,
  Minimize2,
  BookUser,
  Wallet,
  Share2,
  ExternalLink,
  Factory,
  Target,
  Megaphone,
  Star,
  Sparkles,
  LayoutGrid,
  List,
  Grid3X3,
  LayoutList,
  Minus,
  LogOut,
  User,
  UserCog,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  Cog,
  PiggyBank,
  SlidersHorizontal
} from "lucide-react";
import { AIAssistant } from "@/components/AIAssistant";
import { PageTransition } from "@/components/PageTransition";
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { useNotifications } from "@/hooks/useNotifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Task {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  tag: string | null;
}

interface Email {
  id: string;
  fromName: string;
  subject: string;
  unread: boolean;
  receivedAt: string;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme, fontFamily, setFontFamily } = useTheme();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(5);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [themePopoverOpen, setThemePopoverOpen] = useState(false);
  const [fontPopoverOpen, setFontPopoverOpen] = useState(false);
  const [menuStylePopoverOpen, setMenuStylePopoverOpen] = useState(false);
  const [interfacePopoverOpen, setInterfacePopoverOpen] = useState(false);

  // Menu style from localStorage (per user)
  const [menuStyle, setMenuStyle] = useState<string>('classic');

  // Menu layout from localStorage (per user): lista, griglia, compatto, minimalista
  const [menuLayout, setMenuLayout] = useState<string>('lista');
  const [menuLayoutPopoverOpen, setMenuLayoutPopoverOpen] = useState(false);

  // Module order from localStorage (per user)
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);
  const [moduleOrderDialogOpen, setModuleOrderDialogOpen] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const savedStyle = localStorage.getItem(`pulse-menu-style-${user.id}`) || 'classic';
      const savedLayout = localStorage.getItem(`pulse-menu-layout-${user.id}`) || 'lista';
      const savedOrder = localStorage.getItem(`pulse-module-order-${user.id}`);
      setMenuStyle(savedStyle);
      setMenuLayout(savedLayout);
      if (savedOrder) {
        try {
          setModuleOrder(JSON.parse(savedOrder));
        } catch (e) {
          setModuleOrder([]);
        }
      }
    }
  }, [user?.id]);

  const updateMenuStyle = (style: string) => {
    setMenuStyle(style);
    if (typeof window !== 'undefined' && user?.id) {
      localStorage.setItem(`pulse-menu-style-${user.id}`, style);
    }
  };

  const updateMenuLayout = (layout: string) => {
    setMenuLayout(layout);
    if (typeof window !== 'undefined' && user?.id) {
      localStorage.setItem(`pulse-menu-layout-${user.id}`, layout);
    }
  };

  const updateModuleOrder = (order: string[]) => {
    setModuleOrder(order);
    if (typeof window !== 'undefined' && user?.id) {
      localStorage.setItem(`pulse-module-order-${user.id}`, JSON.stringify(order));
    }
  };

  const moveModuleUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedMenuItems];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    updateModuleOrder(newOrder.map(item => item.url));
  };

  const moveModuleDown = (index: number) => {
    if (index === orderedMenuItems.length - 1) return;
    const newOrder = [...orderedMenuItems];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    updateModuleOrder(newOrder.map(item => item.url));
  };

  const resetModuleOrder = () => {
    setModuleOrder([]);
    if (typeof window !== 'undefined' && user?.id) {
      localStorage.removeItem(`pulse-module-order-${user.id}`);
    }
  };

  useEffect(() => {
    if (themePopoverOpen) {
      const timer = setTimeout(() => setThemePopoverOpen(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [themePopoverOpen]);

  useEffect(() => {
    if (fontPopoverOpen) {
      const timer = setTimeout(() => setFontPopoverOpen(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [fontPopoverOpen]);

  // Logout countdown effect
  useEffect(() => {
    if (logoutDialogOpen) {
      setLogoutCountdown(5);
      const interval = setInterval(() => {
        setLogoutCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setLogoutDialogOpen(false);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [logoutDialogOpen]);

  const handleLogoutClick = () => {
    setUserPopoverOpen(false);
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
  };

  const handleOpenProfile = () => {
    setUserPopoverOpen(false);
    setLocation("/control-panel");
  };

  // Fetch tasks for notifications
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch emails for notifications
  const { data: emails = [] } = useQuery<Email[]>({
    queryKey: ["/api/emails"],
    refetchInterval: 30000,
  });

  // Fetch share access notifications from database
  interface ShareNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    resourceType?: string;
    resourceId?: string;
    read: boolean;
    createdAt: string;
  }
  const { data: shareNotifications = [] } = useQuery<ShareNotification[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/notifications/${user.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const unreadShareNotifications = shareNotifications.filter(n => !n.read);

  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
      if (!res.ok) throw new Error("Errore nella conferma");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
    },
  });

  // Calculate overdue and upcoming tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter((task) => {
    if (task.done || !task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  });

  const upcomingTasks = tasks.filter((task) => {
    if (task.done || !task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return dueDate >= today && dueDate <= threeDaysFromNow;
  });

  // Unread emails
  const unreadEmails = emails.filter((email) => email.unread);

  // Todo reminders
  const { activeReminders, notificationPermission, requestPermission } = useNotifications();

  // Fetch projects for counters
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
    refetchInterval: 60000,
  });
  const activeProjects = projects.filter((p: any) => p.status === "active" || p.status === "in_progress");

  // Fetch pending leave requests for HR Manager badge
  const { data: pendingLeaveRequests = [] } = useQuery<any[]>({
    queryKey: ["richieste-assenza-pendenti"],
    queryFn: async () => {
      const res = await fetch("/api/richieste-assenza/pendenti");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Fetch CRM leads for counters
  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/crm/leads"],
    refetchInterval: 60000,
  });
  const newLeads = leads.filter((l: any) => l.status === "nuovo");

  // Fetch notes for Pulse Keep counter
  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ["/api/notes"],
    refetchInterval: 60000,
  });

  // Fetch clienti for Anagrafiche counter
  const { data: clienti = [] } = useQuery<any[]>({
    queryKey: ["/api/anagrafica/clienti"],
    refetchInterval: 60000,
  });

  // Fetch personal todos for counter
  const { data: personalTodos = [] } = useQuery<any[]>({
    queryKey: ["/api/personal-todos"],
    refetchInterval: 60000,
  });

  // Fetch invoices for Finanza counter (only for authorized users)
  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/finance/invoices"],
    refetchInterval: 60000,
  });
  const overdueInvoices = invoices.filter((inv: any) => {
    if (!inv.dataScadenza || inv.stato === "pagata" || inv.stato === "annullata") return false;
    const scadenza = new Date(inv.dataScadenza);
    return scadenza < today;
  });

  // Calculate overdue personal todos
  const overduePersonalTodos = personalTodos.filter((todo: any) => {
    if (todo.completed || !todo.dueDate) return false;
    const dueDate = new Date(todo.dueDate);
    return dueDate < today;
  });





  // Favorites from localStorage (with SSR guard)
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pulse-menu-favorites');
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          setFavorites([]);
        }
      }
    }
  }, []);

  const toggleFavorite = (url: string) => {
    setFavorites(prev => {
      const newFavs = prev.includes(url)
        ? prev.filter(f => f !== url)
        : [...prev, url];
      localStorage.setItem('pulse-menu-favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  // Total notification count
  const notificationCount = overdueTasks.length + upcomingTasks.length + unreadEmails.length + activeReminders.length + unreadShareNotifications.length;

  // Menu items with counters and badges
  const getMenuBadge = (url: string): { count?: number; alert?: boolean } => {
    switch (url) {
      case "/keep":
        return { count: notes.length };
      case "/anagrafica":
        return { count: clienti.length };
      case "/crm":
        return { count: newLeads.length, alert: newLeads.length > 0 };
      case "/communications":
        return { count: unreadEmails.length, alert: unreadEmails.length > 0 };
      case "/projects":
        const totalOverdue = overdueTasks.length + overduePersonalTodos.length;
        const projectsAndTasksCount = projects.length + totalOverdue;
        return { count: projectsAndTasksCount, alert: totalOverdue > 0 };
      case "/finanza":
        return { count: overdueInvoices.length, alert: overdueInvoices.length > 0 };
      case "/hr-manager":
        return { count: pendingLeaveRequests.length, alert: pendingLeaveRequests.length > 0 };
      default:
        return {};
    }
  };

  const allMenuItems = [
    { title: "Dashboard", icon: LayoutDashboard, url: "/" },
    { title: "Office Pulse", icon: FileText, url: "/office-pulse" },
    { title: "Pulse Keep", icon: StickyNote, url: "/keep", separator: true },
    { title: "Anagrafiche", icon: BookUser, url: "/anagrafica" },
    { title: "CRM", icon: Target, url: "/crm" },
    { title: "Social & Marketing", icon: Megaphone, url: "/social-marketing" },
    { title: "HR Manager", icon: UserCog, url: "/hr-manager" },
    { title: "Finanza", icon: Wallet, url: "/finanza", allowedUsers: [] as string[] },
    { title: "Finanza Personale", icon: PiggyBank, url: "/finanza-personale", separator: true },
    { title: "WhatsApp", icon: MessageCircle, url: "/whatsapp" },
    { title: "Comunicazione", icon: MessageSquare, url: "/communications", separator: true },
    { title: "Produzione", icon: Factory, url: "/produzione" },
    { title: "Macchinari", icon: Cog, url: "/macchinari" },
    { title: "Progetti e Task", icon: Briefcase, url: "/projects", separator: true },
    { title: "Manuale", icon: BookOpen, url: "/manual", separator: true },
    { title: "Impostazioni", icon: Settings, url: "/control-panel" },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (item.allowedUsers && item.allowedUsers.length > 0) {
      return item.allowedUsers.includes(user?.username || "");
    }
    return true;
  });

  // Apply custom order if saved
  const orderedMenuItems = moduleOrder.length > 0
    ? [...menuItems].sort((a, b) => {
      const indexA = moduleOrder.indexOf(a.url);
      const indexB = moduleOrder.indexOf(b.url);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    })
    : menuItems;

  return (
    <>
      <SidebarProvider>
        <div className="flex flex-col min-h-screen w-full">
          <div className="flex flex-1 bg-gradient-to-b from-background via-background to-muted/30 text-foreground font-sans">
            {sidebarHidden && (
              <div
                className="fixed left-0 top-0 w-4 h-full z-50 cursor-pointer"
                onMouseEnter={() => setSidebarHovered(true)}
              />
            )}
            <div
              className={`transition-all duration-300 ease-in-out ${sidebarHidden && !sidebarHovered
                ? '-translate-x-full opacity-0 w-0'
                : 'translate-x-0 opacity-100'
                }`}
              onMouseLeave={() => sidebarHidden && setSidebarHovered(false)}
            >
              <Sidebar className={`border-r-0 transition-all duration-300 ${menuStyle === 'classic' ? 'bg-sidebar' :
                menuStyle === 'glass' ? 'bg-white/70 dark:bg-black/50 backdrop-blur-xl border-r border-white/20' :
                  menuStyle === 'gradient' ? 'bg-gradient-to-b from-purple-900/90 via-blue-900/80 to-indigo-900/90 text-white' :
                    menuStyle === 'neon' ? 'bg-gray-950 border-r border-cyan-500/50 shadow-[0_0_15px_rgba(0,255,255,0.3)]' :
                      menuStyle === 'minimal' ? 'bg-transparent border-r border-dashed border-muted' :
                        menuStyle === 'colorful' ? 'bg-gradient-to-b from-pink-500/20 via-yellow-500/20 to-cyan-500/20 backdrop-blur-sm' :
                          'bg-sidebar'
                }`} variant="floating" collapsible="icon">
                <SidebarHeader className="p-3 pb-2">
                  <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-2 px-2 py-1 text-sidebar-foreground hover:bg-sidebar-accent rounded-md cursor-pointer transition-colors duration-200 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4a5568] to-[#6b7a8f] text-white font-bold text-sm">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                          <span className="font-semibold text-sm truncate">{user?.name || "Utente"}</span>
                          <span className="text-[10px] text-muted-foreground">{user?.role || "Member"}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSidebarHidden(!sidebarHidden);
                              setSidebarHovered(false);
                            }}
                            className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title={sidebarHidden ? "Mostra menu" : "Nascondi menu"}
                          >
                            <PanelLeftClose className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFullscreen();
                            }}
                            className={`p-1 rounded-md transition-colors ${isFullscreen
                              ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                              : 'text-muted-foreground hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400'
                              }`}
                            title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
                          >
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start" className="w-48 p-2">
                      <div className="space-y-1">
                        <button
                          onClick={handleOpenProfile}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                        >
                          <User className="h-4 w-4" />
                          <span>Profilo</span>
                        </button>
                        <button
                          onClick={handleLogoutClick}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent text-red-600 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <div className="mx-2 p-2 border border-border rounded-lg bg-muted/30">
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <Popover open={interfacePopoverOpen} onOpenChange={setInterfacePopoverOpen}>
                            <PopoverTrigger asChild>
                              <SidebarMenuButton className="text-muted-foreground text-xs">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span>Personalizza</span>
                              </SidebarMenuButton>
                            </PopoverTrigger>
                            <PopoverContent side="right" align="start" className="w-72 p-0 shadow-xl overflow-hidden">
                              <div className="p-3 border-b bg-muted/30">
                                <div className="font-semibold text-sm">Personalizzazione UI</div>
                                <div className="text-xs text-muted-foreground">Modifica l'aspetto dell'applicazione</div>
                              </div>
                              <ScrollArea className="h-[400px]">
                                <Accordion type="single" collapsible className="w-full">
                                  {/* TEMA */}
                                  <AccordionItem value="theme" className="border-b-0">
                                    <AccordionTrigger className="px-4 py-2 hover:bg-muted/50 hover:no-underline text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Palette className="h-4 w-4 text-muted-foreground" />
                                        <span>Tema Colore</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-3 pb-3 bg-muted/20">
                                      <div className="grid grid-cols-2 gap-2 pt-2">
                                        <button onClick={() => setTheme("light")} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs border ${theme === "light" ? "bg-background border-primary ring-1 ring-primary" : "bg-card border-border hover:border-sidebar-ring"}`}>
                                          <Sun className="h-3.5 w-3.5 text-orange-500" /> Chiaro
                                        </button>
                                        <button onClick={() => setTheme("dark")} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs border ${theme === "dark" ? "bg-background border-primary ring-1 ring-primary" : "bg-card border-border hover:border-sidebar-ring"}`}>
                                          <Moon className="h-3.5 w-3.5 text-slate-400" /> Scuro
                                        </button>
                                        <button onClick={() => setTheme("sand")} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs border ${theme === "sand" ? "bg-background border-primary ring-1 ring-primary" : "bg-card border-border hover:border-sidebar-ring"}`}>
                                          <div className="h-3 w-3 bg-amber-200 rounded-full" /> Sabbia
                                        </button>
                                        <button onClick={() => setTheme("celeste")} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs border ${theme === "celeste" ? "bg-background border-primary ring-1 ring-primary" : "bg-card border-border hover:border-sidebar-ring"}`}>
                                          <div className="h-3 w-3 bg-sky-200 rounded-full" /> Celeste
                                        </button>
                                        <button onClick={() => setTheme("glass")} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs border ${theme === "glass" ? "bg-background border-primary ring-1 ring-primary" : "bg-card border-border hover:border-sidebar-ring"}`}>
                                          <div className="h-3 w-3 bg-blue-100 rounded-full bg-opacity-50" /> Glass
                                        </button>
                                        <button onClick={() => setTheme("ubuntu")} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs border ${theme === "ubuntu" ? "bg-background border-primary ring-1 ring-primary" : "bg-card border-border hover:border-sidebar-ring"}`}>
                                          <div className="h-3 w-3 bg-orange-600 rounded-full" /> Ubuntu
                                        </button>
                                        <button onClick={() => setTheme("apple")} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs border ${theme === "apple" ? "bg-background border-primary ring-1 ring-primary" : "bg-card border-border hover:border-sidebar-ring"}`}>
                                          <div className="h-3 w-3 bg-gray-200 rounded-full" /> Apple
                                        </button>
                                        <button onClick={() => setTheme("google")} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs border ${theme === "google" ? "bg-background border-primary ring-1 ring-primary" : "bg-card border-border hover:border-sidebar-ring"}`}>
                                          <div className="h-3 w-3 border flex items-center justify-center rounded-full bg-white"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div></div> Google
                                        </button>
                                        <button onClick={() => setTheme("windows")} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs border ${theme === "windows" ? "bg-background border-primary ring-1 ring-primary" : "bg-card border-border hover:border-sidebar-ring"}`}>
                                          <div className="h-3 w-3 bg-sky-500 rounded-sm" /> Windows
                                        </button>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* CARATTERE */}
                                  <AccordionItem value="font" className="border-b-0">
                                    <AccordionTrigger className="px-4 py-2 hover:bg-muted/50 hover:no-underline text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Type className="h-4 w-4 text-muted-foreground" />
                                        <span>Carattere</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-3 pb-3 bg-muted/20">
                                      <div className="grid grid-cols-1 gap-1 pt-2">
                                        {[
                                          { id: "monospace", name: "JetBrains Mono", font: "monospace" },
                                          { id: "sans-serif", name: "Segoe UI", font: "sans-serif" },
                                          { id: "apple", name: "San Francisco", font: "-apple-system" },
                                          { id: "ubuntu", name: "Ubuntu", font: "Ubuntu" },
                                          { id: "google", name: "Google Inter", font: "Inter" },
                                        ].map((f) => (
                                          <button
                                            key={f.id}
                                            onClick={() => setFontFamily(f.id)}
                                            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${fontFamily === f.id ? "bg-background shadow-sm border border-border" : "hover:bg-background/50 border border-transparent"}`}
                                          >
                                            <span style={{ fontFamily: f.font }}>{f.name}</span>
                                            {fontFamily === f.id && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                          </button>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* STILE MENU */}
                                  <AccordionItem value="style" className="border-b-0">
                                    <AccordionTrigger className="px-4 py-2 hover:bg-muted/50 hover:no-underline text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                                        <span>Stile Menu</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-3 pb-3 bg-muted/20">
                                      <div className="space-y-1 pt-2">
                                        {[
                                          { id: 'classic', name: 'Classico' },
                                          { id: 'glass', name: 'Glassmorphism' },
                                          { id: 'gradient', name: 'Gradiente' },
                                          { id: 'neon', name: 'Neon' },
                                          { id: 'minimal', name: 'Minimalista' },
                                          { id: 'colorful', name: 'Colorato' },
                                        ].map((s) => (
                                          <button
                                            key={s.id}
                                            onClick={() => updateMenuStyle(s.id)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${menuStyle === s.id ? "bg-background shadow-sm border border-border font-medium" : "hover:bg-background/50 border border-transparent"}`}
                                          >
                                            <div className={`h-3 w-3 rounded-full ${s.id === 'classic' ? 'bg-slate-400' : s.id === 'glass' ? 'bg-blue-200' : s.id === 'neon' ? 'bg-cyan-400' : 'bg-pink-400'}`} />
                                            {s.name}
                                          </button>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* LAYOUT MENU */}
                                  <AccordionItem value="layout" className="border-b-0">
                                    <AccordionTrigger className="px-4 py-2 hover:bg-muted/50 hover:no-underline text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <LayoutList className="h-4 w-4 text-muted-foreground" />
                                        <span>Layout Moduli</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-3 pb-3 bg-muted/20">
                                      <div className="grid grid-cols-2 gap-2 pt-2">
                                        <button onClick={() => updateMenuLayout('lista')} className={`flex flex-col items-center gap-1 p-2 rounded border ${menuLayout === 'lista' ? 'bg-background border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                                          <List className="h-4 w-4" />
                                          <span className="text-[10px]">Lista</span>
                                        </button>
                                        <button onClick={() => updateMenuLayout('griglia')} className={`flex flex-col items-center gap-1 p-2 rounded border ${menuLayout === 'griglia' ? 'bg-background border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                                          <Grid3X3 className="h-4 w-4" />
                                          <span className="text-[10px]">Griglia</span>
                                        </button>
                                        <button onClick={() => updateMenuLayout('compatto')} className={`flex flex-col items-center gap-1 p-2 rounded border ${menuLayout === 'compatto' ? 'bg-background border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                                          <Minus className="h-4 w-4" />
                                          <span className="text-[10px]">Compatto</span>
                                        </button>
                                        <button onClick={() => updateMenuLayout('icone')} className={`flex flex-col items-center gap-1 p-2 rounded border ${menuLayout === 'icone' ? 'bg-background border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                                          <LayoutGrid className="h-4 w-4" />
                                          <span className="text-[10px]">Icone</span>
                                        </button>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>

                                <Separator className="my-2" />

                                <div className="p-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start gap-2"
                                    onClick={() => setModuleOrderDialogOpen(true)}
                                  >
                                    <ListOrdered className="h-4 w-4" />
                                    <span>Ordina Moduli</span>
                                  </Button>
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </div>
                  </SidebarGroup >

                  {/* Sezione Preferiti */}
                  {
                    favorites.length > 0 && (
                      <SidebarGroup>
                        <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-4 py-1 flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          PREFERITI
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                          <SidebarMenu>
                            {orderedMenuItems.filter(item => favorites.includes(item.url)).map((item) => {
                              const isActive = location === item.url;
                              const badge = getMenuBadge(item.url);
                              return (
                                <SidebarMenuItem key={`fav-${item.title}`}>
                                  <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    className={`
                                text-xs font-medium px-3 py-1.5 h-8
                                ${isActive ? 'bg-sidebar-accent text-sidebar-foreground font-semibold' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'}
                              `}
                                  >
                                    <Link href={item.url}>
                                      <div className={`
                                  flex items-center justify-center h-6 w-6 rounded-md mr-2 transition-all duration-300
                                  ${isActive
                                          ? 'bg-primary/20 text-primary animate-pulse-subtle shadow-sm'
                                          : 'bg-muted/50 text-muted-foreground group-hover:bg-muted'
                                        }
                                `}>
                                        <item.icon className="h-3.5 w-3.5" />
                                      </div>
                                      <span className="flex-1">{item.title}</span>
                                      {badge.count !== undefined && badge.count > 0 && (
                                        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${badge.alert ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                          {badge.count}
                                        </span>
                                      )}
                                      <span className="ml-1 w-3" />
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              );
                            })}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </SidebarGroup>
                    )
                  }

                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-4 py-1 flex items-center gap-2">
                      <LayoutGrid className="h-3 w-3" />
                      APPLICAZIONI
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      {/* Layout: Lista (default) */}
                      {menuLayout === 'lista' && (
                        <SidebarMenu>
                          {orderedMenuItems.map((item, index) => {
                            const isActive = location === item.url;
                            const badge = getMenuBadge(item.url);
                            const isFavorite = favorites.includes(item.url);
                            return (
                              <div key={item.title}>
                                <SidebarMenuItem className="group/item">
                                  <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    className={`
                                  text-xs font-medium px-3 py-1.5 h-8 transition-all duration-200
                                  ${isActive ? 'bg-sidebar-accent text-sidebar-foreground font-semibold border-l-2 border-primary' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'}
                                `}
                                  >
                                    <Link href={item.url}>
                                      <div className={`
                                    flex items-center justify-center h-6 w-6 rounded-md mr-2 transition-all duration-200 relative
                                    ${isActive
                                          ? 'bg-primary/20 text-primary'
                                          : 'bg-muted/50 text-muted-foreground group-hover:bg-muted'
                                        }
                                  `}>
                                        <item.icon className="h-3.5 w-3.5" />
                                        {!isFavorite && badge.alert && (
                                          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                                        )}
                                      </div>
                                      <span className="flex-1">{item.title}</span>
                                      {!isFavorite && badge.count !== undefined && (
                                        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${badge.alert ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                          {badge.count}
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          toggleFavorite(item.url);
                                        }}
                                        className={`ml-1 opacity-0 group-hover/item:opacity-100 transition-opacity ${isFavorite ? 'opacity-100' : ''}`}
                                      >
                                        <Star className={`h-3 w-3 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`} />
                                      </button>
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                                {item.separator && index < menuItems.length - 1 && (
                                  <Separator className="my-2 mx-2" />
                                )}
                              </div>
                            );
                          })}
                        </SidebarMenu>
                      )}

                      {/* Layout: Griglia */}
                      {menuLayout === 'griglia' && (
                        <div className="grid grid-cols-2 gap-1 px-2">
                          {orderedMenuItems.map((item) => {
                            const isActive = location === item.url;
                            const badge = getMenuBadge(item.url);
                            const isFavorite = favorites.includes(item.url);
                            return (
                              <Link
                                key={item.title}
                                href={item.url}
                                className={`
                              group/item relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200
                              ${isActive
                                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                                    : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                                  }
                            `}
                              >
                                <div className={`
                              relative flex items-center justify-center h-8 w-8 rounded-lg mb-1 transition-all duration-200
                              ${isActive
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted/50 group-hover/item:bg-muted'
                                  }
                            `}>
                                  <item.icon className="h-4 w-4" />
                                  {!isFavorite && badge.alert && (
                                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-background" />
                                  )}
                                  {!isFavorite && badge.count !== undefined && badge.count > 0 && !badge.alert && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-blue-500 text-white text-[9px] font-bold rounded-full ring-2 ring-background">
                                      {badge.count > 9 ? '9+' : badge.count}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-medium text-center leading-tight truncate w-full">
                                  {item.title}
                                </span>
                                {isFavorite && (
                                  <Star className="absolute top-1 right-1 h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Layout: Compatto */}
                      {menuLayout === 'compatto' && (
                        <SidebarMenu>
                          {orderedMenuItems.map((item) => {
                            const isActive = location === item.url;
                            const badge = getMenuBadge(item.url);
                            const isFavorite = favorites.includes(item.url);
                            return (
                              <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={isActive}
                                  className={`
                                text-[11px] font-medium px-2 py-0.5 h-6 transition-all duration-200
                                ${isActive ? 'bg-sidebar-accent text-sidebar-foreground font-semibold' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'}
                              `}
                                >
                                  <Link href={item.url}>
                                    <item.icon className="h-3 w-3 mr-1.5" />
                                    <span className="flex-1 truncate">{item.title}</span>
                                    {!isFavorite && badge.alert && (
                                      <span className="ml-auto h-1.5 w-1.5 bg-red-500 rounded-full" />
                                    )}
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      )}

                      {/* Layout: Solo Icone */}
                      {menuLayout === 'icone' && (
                        <div className="flex flex-wrap gap-1 px-2 justify-center">
                          {orderedMenuItems.map((item) => {
                            const isActive = location === item.url;
                            const badge = getMenuBadge(item.url);
                            const isFavorite = favorites.includes(item.url);
                            return (
                              <Link
                                key={item.title}
                                href={item.url}
                                title={item.title}
                                className={`
                              relative flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200
                              ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                  }
                            `}
                              >
                                <item.icon className="h-5 w-5" />
                                {!isFavorite && badge.alert && (
                                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-background" />
                                )}
                                {!isFavorite && badge.count !== undefined && badge.count > 0 && !badge.alert && (
                                  <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-blue-500 text-white text-[9px] font-bold rounded-full ring-2 ring-background">
                                    {badge.count > 9 ? '9+' : badge.count}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </SidebarGroupContent>
                  </SidebarGroup>

                  <SidebarGroup className="mt-2">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setIsAIAssistantOpen(true)}
                        className="relative flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                        title="Assistente AI"
                      >
                        <Bot className="h-6 w-6" />
                        <span className="absolute inset-0 rounded-full bg-purple-400/20 animate-pulse" />
                      </button>
                    </div>
                  </SidebarGroup>

                  {/* Stato del sistema */}


                </SidebarContent >
                <SidebarRail />
              </Sidebar >
            </div >

            <main className="flex-1 flex flex-col min-w-0 bg-background h-screen overflow-hidden">
              <div className="flex-1 overflow-auto">
                <PageTransition>
                  {children}
                </PageTransition>
              </div>
            </main>
          </div >
        </div >
      </SidebarProvider >
      <AIAssistant isOpen={isAIAssistantOpen} onClose={() => setIsAIAssistantOpen(false)} />

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Conferma Logout</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="mb-4">
              <LogOut className="h-12 w-12 mx-auto text-red-500" />
            </div>
            <p className="text-muted-foreground mb-4">
              Sei sicuro di voler uscire?
            </p>
            <div className="text-5xl font-bold text-red-500 mb-4">
              {logoutCountdown}
            </div>
            <p className="text-xs text-muted-foreground">
              Il dialogo si chiuderà automaticamente
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLogoutDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={confirmLogout}
            >
              Conferma Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Ordina Moduli */}
      <Dialog open={moduleOrderDialogOpen} onOpenChange={setModuleOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              Ordina Moduli
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-xs text-muted-foreground mb-4">
              Usa le frecce per spostare i moduli nell'ordine desiderato
            </p>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {orderedMenuItems.map((item, index) => (
                <div
                  key={item.url}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-sm">{item.title}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveModuleUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveModuleDown(index)}
                      disabled={index === orderedMenuItems.length - 1}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={resetModuleOrder}
            >
              Ripristina Default
            </Button>
            <Button
              className="flex-1"
              onClick={() => setModuleOrderDialogOpen(false)}
            >
              Fatto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AppLayout;
