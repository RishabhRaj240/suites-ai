import { useState, useCallback } from "react";

/**
 * useSidebar — manages mobile sidebar open/close state.
 *
 * Usage:
 *   const { sidebarOpen, openSidebar, closeSidebar, toggleSidebar } = useSidebar();
 */
export function useSidebar(defaultOpen = false) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultOpen);

  const openSidebar  = useCallback(() => setSidebarOpen(true),  []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  return { sidebarOpen, openSidebar, closeSidebar, toggleSidebar };
}
