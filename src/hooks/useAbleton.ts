import { useState, useEffect, useCallback } from 'react';
import { AbletonOSC } from '../lib/ableton-osc';
import { useStore } from '../lib/store';
import { toast } from 'sonner';

export function useAbleton() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const { currentProject, updateProject } = useStore();
  const abletonOSC = AbletonOSC.getInstance();
  
  const syncWithAbleton = useCallback(async () => {
    setIsSyncing(true);
    try {
      const info = await abletonOSC.getInfo();
      if (info && currentProject) {
        const timeSignature = `${info.signature_numerator}/${info.signature_denominator}`;
        const newBpm = Math.round(info.tempo);
        
        const bpmChanged = newBpm !== currentProject.bpm;
        const sigChanged = timeSignature !== currentProject.timeSignature;
        
        if (bpmChanged || sigChanged) {
          updateProject({
            bpm: newBpm,
            timeSignature: timeSignature,
          });
          setLastSyncTime(new Date());
          
          const changes = [];
          if (bpmChanged) changes.push(`BPM: ${currentProject.bpm} → ${newBpm}`);
          if (sigChanged) changes.push(`Time Signature: ${currentProject.timeSignature} → ${timeSignature}`);
          
          toast.success("Synced with Ableton Live", {
            description: changes.join(', '),
          });
        } else {
          toast.info("Already in sync", {
            description: `BPM: ${newBpm}, Time Signature: ${timeSignature}`,
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to sync with Ableton:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [abletonOSC, updateProject, currentProject]);
  
  // Auto-sync and connection monitoring
  useEffect(() => {
    let mounted = true;
    
    const checkAndSync = async () => {
      if (!mounted) return;
      
      try {
        const connected = await abletonOSC.testConnection();
        setIsConnected(connected);
        
        // Auto-sync if connected
        if (connected && currentProject) {
          const info = await abletonOSC.getInfo();
          if (info) {
            const timeSignature = `${info.signature_numerator}/${info.signature_denominator}`;
            const newBpm = Math.round(info.tempo);
            
            // Check what changed
            const bpmChanged = newBpm !== currentProject.bpm;
            const sigChanged = timeSignature !== currentProject.timeSignature;
            
            // Only update if values changed
            if (bpmChanged || sigChanged) {
              updateProject({
                bpm: newBpm,
                timeSignature: timeSignature,
              });
              setLastSyncTime(new Date());
              
              // Show toast with what changed
              const changes = [];
              if (bpmChanged) changes.push(`BPM: ${currentProject.bpm} → ${newBpm}`);
              if (sigChanged) changes.push(`Time Signature: ${currentProject.timeSignature} → ${timeSignature}`);
              
              toast.info("Ableton sync detected changes", {
                description: changes.join(', '),
              });
            }
          }
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
        setIsConnected(false);
      }
    };
    
    // Initial check
    checkAndSync();
    
    // Set up interval for auto-sync
    const interval = setInterval(checkAndSync, 5000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [abletonOSC, currentProject, updateProject]);
  
  return {
    isConnected,
    isSyncing,
    lastSyncTime,
    syncWithAbleton,
  };
}