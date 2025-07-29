import { useEffect, useState } from "react";
import { usePerformance, useNetworkStatus } from "@/hooks/usePerformance";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PerformanceMonitor = () => {
  const metrics = usePerformance();
  const { isOnline, connectionType } = useNetworkStatus();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
    } else {
      const timer = setTimeout(() => setShowOfflineAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOfflineAlert) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      {!isOnline && (
        <Alert className="border-destructive bg-destructive/10">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Some features may be limited.
          </AlertDescription>
        </Alert>
      )}
      
      {isOnline && connectionType === 'slow-2g' && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Slow connection detected. Images may load slowly.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PerformanceMonitor;