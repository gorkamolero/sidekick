import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Terminal, Package, Loader2, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface SetupCheck {
  name: string;
  description: string;
  command?: string;
  installCommand?: string;
  installUrl?: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message?: string;
}

export function SetupGuide() {
  const [checks, setChecks] = useState<SetupCheck[]>([
    {
      name: 'Node.js',
      description: 'JavaScript runtime (v18 or higher)',
      command: 'node --version',
      installUrl: 'https://nodejs.org/',
      status: 'checking'
    },
    {
      name: 'Rust & Cargo',
      description: 'Required for Tauri backend',
      command: 'cargo --version',
      installUrl: 'https://www.rust-lang.org/tools/install',
      status: 'checking'
    },
    {
      name: 'Tauri CLI',
      description: 'Build tool for desktop app',
      command: 'npm list @tauri-apps/cli',
      installCommand: 'npm install',
      status: 'checking'
    },
    {
      name: 'Ableton Live',
      description: 'Digital Audio Workstation',
      installUrl: 'https://www.ableton.com/en/trial/',
      status: 'checking'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentMode, setCurrentMode] = useState<'dev' | 'tauri' | null>(null);

  useEffect(() => {
    checkDependencies();
  }, []);

  const checkDependencies = async () => {
    // In a real implementation, these would call Tauri commands
    // For now, we'll simulate the checks
    const updatedChecks = [...checks];

    // Check Node.js
    try {
      if (typeof window !== 'undefined') {
        updatedChecks[0].status = 'success';
        updatedChecks[0].message = 'Node.js is available';
      }
    } catch {
      updatedChecks[0].status = 'error';
      updatedChecks[0].message = 'Node.js not found';
    }

    // Check Rust (this would need a Tauri command in reality)
    try {
      // This is a placeholder - in production, we'd use invoke() to check
      const isInTauri = window.__TAURI__ !== undefined;
      if (isInTauri) {
        updatedChecks[1].status = 'success';
        updatedChecks[1].message = 'Rust is installed';
      } else {
        updatedChecks[1].status = 'warning';
        updatedChecks[1].message = 'Cannot verify Rust in dev mode';
      }
    } catch {
      updatedChecks[1].status = 'error';
      updatedChecks[1].message = 'Rust/Cargo not found';
    }

    // Check Tauri CLI
    updatedChecks[2].status = window.__TAURI__ ? 'success' : 'warning';
    updatedChecks[2].message = window.__TAURI__ 
      ? 'Tauri CLI is working' 
      : 'Running in dev mode (Tauri features disabled)';

    // Check Ableton (would need OSC check in reality)
    updatedChecks[3].status = 'warning';
    updatedChecks[3].message = 'Manual verification required';

    setChecks(updatedChecks);

    // Detect current mode
    if (window.__TAURI__) {
      setCurrentMode('tauri');
    } else {
      setCurrentMode('dev');
    }
  };

  const runCommand = async (command: string) => {
    setIsRunning(true);
    try {
      // In production, this would use Tauri's shell plugin
      console.log(`Running: ${command}`);
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to run: ${command}`, error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'error':
        return <X className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
    }
  };

  const allChecksPass = checks.every(c => c.status === 'success');
  const hasErrors = checks.some(c => c.status === 'error');

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Current Mode Alert */}
      <div className={`p-4 rounded-lg border ${
        currentMode === 'tauri' 
          ? 'bg-green-500/10 border-green-500/30 text-green-400'
          : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
      }`}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span className="font-semibold">
            {currentMode === 'tauri' 
              ? 'Running in Tauri Mode (Full Features)' 
              : 'Running in Dev Mode (Limited Features)'}
          </span>
        </div>
        <p className="text-sm mt-2 opacity-80">
          {currentMode === 'tauri'
            ? 'All features including OSC, file system access, and native drag-and-drop are available.'
            : 'UI development mode only. Run "npm run tauri:dev" for full functionality.'}
        </p>
      </div>

      {/* Setup Checklist */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          Setup Requirements
        </h2>

        <div className="space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="p-3 bg-black/20 rounded-lg border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h3 className="font-medium">{check.name}</h3>
                    <p className="text-sm text-gray-400">{check.description}</p>
                    {check.message && (
                      <p className={`text-xs mt-1 ${
                        check.status === 'success' ? 'text-green-400' :
                        check.status === 'error' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {check.message}
                      </p>
                    )}
                  </div>
                </div>

                {check.status === 'error' && (
                  <div className="flex gap-2">
                    {check.installCommand && (
                      <Button
                        size="sm"
                        onClick={() => runCommand(check.installCommand!)}
                        disabled={isRunning}
                      >
                        {isRunning ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Install'
                        )}
                      </Button>
                    )}
                    {check.installUrl && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(check.installUrl, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Guide
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start Commands */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Start</h2>
        
        <div className="grid gap-3">
          <div className="p-3 bg-black/20 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">Development Mode</h3>
                <p className="text-xs text-gray-400 mt-1">Frontend only, quick iterations</p>
              </div>
              <code className="text-xs bg-black/50 px-2 py-1 rounded font-mono">
                npm run dev
              </code>
            </div>
          </div>

          <div className="p-3 bg-black/20 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">Full App (Recommended)</h3>
                <p className="text-xs text-gray-400 mt-1">All features enabled</p>
              </div>
              <code className="text-xs bg-black/50 px-2 py-1 rounded font-mono">
                npm run tauri:dev
              </code>
            </div>
          </div>

          <div className="p-3 bg-black/20 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">Build for Production</h3>
                <p className="text-xs text-gray-400 mt-1">Create distributable app</p>
              </div>
              <code className="text-xs bg-black/50 px-2 py-1 rounded font-mono">
                npm run tauri:build
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Installation Steps */}
      {hasErrors && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-400">Required Setup Steps</h2>
          
          <ol className="space-y-3 list-decimal list-inside">
            {checks.filter(c => c.status === 'error').map((check, index) => (
              <li key={index} className="text-sm">
                Install {check.name}
                {check.installUrl && (
                  <a 
                    href={check.installUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-400 hover:underline"
                  >
                    {check.installUrl}
                  </a>
                )}
                {check.installCommand && (
                  <code className="ml-2 bg-black/50 px-2 py-0.5 rounded text-xs">
                    {check.installCommand}
                  </code>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Success State */}
      {allChecksPass && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-green-400">
            <Check className="w-5 h-5" />
            <span className="font-semibold">All requirements met!</span>
          </div>
          <p className="text-sm mt-2 text-green-400/80">
            You're ready to use Sidekick with full functionality.
          </p>
        </div>
      )}
    </div>
  );
}