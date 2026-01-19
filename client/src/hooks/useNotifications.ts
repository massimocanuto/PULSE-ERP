import { useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PersonalTodo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: string;
  dueDate?: string;
  category?: string;
  starred: boolean;
  reminderBefore?: number;
  reminderSent?: boolean;
}

import { useAuth } from "@/contexts/AuthContext";
import { personalTodosApi } from "@/lib/api";

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notifiedTodos = useRef<Set<string>>(new Set());

  const { data: todos = [] } = useQuery<PersonalTodo[]>({
    queryKey: ["personal-todos", user?.id],
    queryFn: () => user ? personalTodosApi.getAll(user.id) : Promise.resolve([]),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markReminderSent = useMutation({
    mutationFn: async (todoId: string) => {
      const response = await fetch(`/api/personal-todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderSent: true }),
      });
      if (!response.ok) throw new Error("Failed to mark reminder sent");
      return response.json();
    },
  });

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("Browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }, []);

  const showNotification = useCallback((title: string, body: string, todoId: string) => {
    // Browser notifications disabled
    return;
  }, []);

  const checkReminders = useCallback(() => {
    const now = new Date();

    todos.forEach((todo) => {
      if (
        !todo.completed &&
        todo.dueDate &&
        todo.reminderBefore &&
        todo.reminderBefore > 0 &&
        !todo.reminderSent &&
        !notifiedTodos.current.has(todo.id)
      ) {
        const dueDate = new Date(todo.dueDate);
        const reminderTime = new Date(dueDate.getTime() - todo.reminderBefore * 60 * 1000);

        if (now >= reminderTime && now < dueDate) {
          notifiedTodos.current.add(todo.id);

          const minutesLeft = Math.round((dueDate.getTime() - now.getTime()) / 60000);
          let timeText = "";

          if (minutesLeft < 60) {
            timeText = `${minutesLeft} minuti`;
          } else if (minutesLeft < 1440) {
            timeText = `${Math.round(minutesLeft / 60)} ore`;
          } else {
            timeText = `${Math.round(minutesLeft / 1440)} giorni`;
          }

          showNotification(
            "Promemoria PULSE ERP",
            `"${todo.title}" scade tra ${timeText}`,
            todo.id
          );

          markReminderSent.mutate(todo.id);
        }
      }
    });
  }, [todos, showNotification, markReminderSent]);

  useEffect(() => {
    // requestPermission(); // Disabled
  }, [requestPermission]);

  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  const pendingReminders = todos.filter((todo) => {
    if (todo.completed || !todo.dueDate || !todo.reminderBefore || todo.reminderBefore === 0) {
      return false;
    }
    const now = new Date();
    const dueDate = new Date(todo.dueDate);
    const reminderTime = new Date(dueDate.getTime() - todo.reminderBefore * 60 * 1000);
    return now < reminderTime && now < dueDate;
  });

  const activeReminders = todos.filter((todo) => {
    if (todo.completed || !todo.dueDate || !todo.reminderBefore || todo.reminderBefore === 0) {
      return false;
    }
    const now = new Date();
    const dueDate = new Date(todo.dueDate);
    const reminderTime = new Date(dueDate.getTime() - todo.reminderBefore * 60 * 1000);
    return now >= reminderTime && now < dueDate;
  });

  return {
    pendingReminders,
    activeReminders,
    requestPermission,
    notificationPermission: typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "denied",
  };
}
