import React, { createContext, useContext, useEffect, useState } from 'react';

interface MaintenanceStatus {
  page: string;
  isEnabled: boolean;
}

interface MaintenanceContextType {
  maintenanceData: MaintenanceStatus[];
  refreshMaintenance: () => Promise<void>;
  isReady: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceStatus[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refreshMaintenance = async () => {
    try {
      const res = await fetch('/api/maintenance');
      if (res.ok) {
        const data = await res.json();
        setMaintenanceData(data);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance status', error);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    refreshMaintenance();
    // Poll every 10 seconds to keep it fresh without causing sync issues
    const interval = setInterval(refreshMaintenance, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MaintenanceContext.Provider value={{ maintenanceData, refreshMaintenance, isReady }}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
}
