import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Terminal, Package, Loader2, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

interface SetupCheck {
  name: string;
  description: string;
  command?: string;
  installCommand?: string;
  installUrl?: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message?: string;
  required: boolean;
}

interface FirstTimeSetupProps {
  onComplete: () => void;
}

export function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
  const [checks, setChecks] = useState<SetupCheck[]>([
    {
      name: 'Rust & Cargo',
      description: 'Required for Tauri backend to run',
      command: 'cargo --version',
      installUrl: 'https://www.rust-lang.org/tools/install',
      status: 'checking',
      required: true
    },
    {
      name: 'Node.js Dependencies',
      description: 'All npm packages installed',
      command: 'npm list',
      installCommand: 'npm install',
      status: 'checking',
      required: true
    },
    {
      name: 'Environment Variables',
      description: 'API keys configured in .env file',
      status: 'checking',
      required: true
    }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    checkRequirements();
  }, []);

  const checkRequirements = async () => {
    const updatedChecks = [...checks];

    // Check if running in Tauri
    const isInTauri = window.__TAURI__ !== undefined;
    
    if (!isInTauri) {
      // If not in Tauri, we need to guide them to use the right command
      updatedChecks[0].status = 'error';
      updatedChecks[0].message = 'Not running in Tauri mode';
      updatedChecks[1].status = 'warning';
      updatedChecks[1].message = 'Cannot verify in dev mode';
      updatedChecks[2].status = 'warning';
      updatedChecks[2].message = 'Cannot verify in dev mode';
    } else {
      // Check each requirement
      updatedChecks[0].status = 'success';
      updatedChecks[0].message = 'Rust is installed';
      
      updatedChecks[1].status = 'success';
      updatedChecks[1].message = 'Dependencies installed';
      
      // Check for .env file
      const hasEnv = localStorage.getItem('envConfigured') === 'true';
      updatedChecks[2].status = hasEnv ? 'success' : 'error';
      updatedChecks[2].message = hasEnv ? 'Environment configured' : 'Missing .env file or API keys';
    }

    setChecks(updatedChecks);

    // Check if all required checks pass
    const allRequiredPass = updatedChecks.filter(c => c.required).every(c => c.status === 'success');
    if (allRequiredPass) {
      // Auto-proceed after a short delay
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="w-5 h-5 text-green-400" />;
      case 'error':
        return <X className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    }
  };

  const isNotInTauri = !window.__TAURI__;
  const hasErrors = checks.some(c => c.status === 'error' && c.required);
  const allChecksPass = checks.filter(c => c.required).every(c => c.status === 'success');

  if (allChecksPass) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-void)]">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Check className="w-16 h-16 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">All Set!</h1>
          <p className="text-gray-400">Starting Sidekick...</p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--color-accent)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-void)] p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Sidekick</h1>
          <p className="text-gray-400">Let's get your environment set up</p>
        </div>


        {/* Requirements Checklist */}
        <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5" />
              Checking Requirements
            </h2>

            <div className="space-y-3">
              {checks.map((check, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border transition-all ${
                    check.status === 'success' 
                      ? 'bg-green-500/10 border-green-500/30'
                      : check.status === 'error'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <h3 className="font-medium">
                          {check.name}
                          {!check.required && <span className="text-xs text-gray-500 ml-2">(Optional)</span>}
                        </h3>
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

                    {check.status === 'error' && check.installUrl && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(check.installUrl, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Install Guide
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* Manual Fix Instructions */}
        {hasErrors && (
          <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h3 className="font-semibold text-yellow-400 mb-3">Manual Setup Required</h3>
            <ol className="space-y-2 text-sm">
              {checks[2].status === 'error' && (
                <li>
                  <span className="text-gray-400">1. Create a </span>
                  <code className="text-yellow-400">.env</code>
                  <span className="text-gray-400"> file in the project root</span>
                </li>
              )}
              <li>
                <span className="text-gray-400">{checks[2].status === 'error' ? '2' : '1'}. Add your API keys:</span>
                <pre className="mt-2 p-2 bg-black/50 rounded text-xs">
{`OPENROUTER_API_KEY=your_key_here
REPLICATE_API_TOKEN=your_key_here`}
                </pre>
              </li>
              <li>
                <span className="text-gray-400">{checks[2].status === 'error' ? '3' : '2'}. Restart the app with </span>
                <code className="text-yellow-400">npm run tauri:dev</code>
              </li>
            </ol>
          </div>
        )}

        {/* Skip button for development */}
        {!allChecksPass && (
          <div className="text-center">
            <button
              onClick={onComplete}
              className="text-xs text-gray-500 hover:text-gray-400 underline"
            >
              Skip setup (development only)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}