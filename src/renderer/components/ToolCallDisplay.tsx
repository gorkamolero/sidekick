import { Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { AudioPlayer } from "./AudioPlayer";

interface ToolCallDisplayProps {
  toolCalls?: any[];
  className?: string;
}

export function ToolCallDisplay({
  toolCalls,
  className,
}: ToolCallDisplayProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className={cn("space-y-2 mt-2", className)}>
      {toolCalls.map((toolCall, index) => {
        const isGenerating =
          toolCall.status === "generating" || toolCall.status === "calling";
        const isComplete =
          toolCall.status === "complete" || toolCall.type === "tool-result";

        const getStatusIcon = () => {
          if (isGenerating) {
            return <Loader2 className="w-3 h-3 animate-spin" />;
          }
          if (isComplete) {
            if (toolCall.result?.status === "success") {
              return <CheckCircle className="w-3 h-3 text-green-500" />;
            } else {
              return <XCircle className="w-3 h-3 text-red-500" />;
            }
          }
          return <AlertCircle className="w-3 h-3 text-yellow-500" />;
        };

        const getToolDisplayName = () => {
          if (
            toolCall.toolName === "generate-music" ||
            toolCall.toolName === "generateMusic"
          ) {
            return "Generating Music";
          }
          if (toolCall.toolName === "analyzeAudio") {
            return "Analyzing Audio";
          }
          if (
            toolCall.toolName === "getProjectInfo" ||
            toolCall.toolName === "get-project-info"
          ) {
            return "Getting Project Info";
          }
          return toolCall.toolName;
        };

        return (
          <div
            key={toolCall.toolCallId || index}
            className={cn(
              "flex items-start p-2 rounded-md border text-xs font-mono",
              isGenerating &&
                "border-[var(--color-accent)] bg-[var(--color-accent)]/10 animate-pulse",
              isComplete && toolCall.result?.status === "success" && "border-green-500/30 bg-green-500/5",
              isComplete && toolCall.result?.status !== "success" && "border-red-500/30 bg-red-500/5",
              !isGenerating &&
                !isComplete &&
                "border-[var(--color-text-dim)] bg-[var(--color-surface)]",
            )}
          >
            <div className="flex items-center flex-shrink-0 mr-1.5">
              {getStatusIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[var(--color-text-primary)]">
                {getToolDisplayName()}
              </div>

              {toolCall.args && (
                <div className="mt-2 text-[10px] text-[var(--color-text-secondary)]">
                  {toolCall.args.prompt && (
                    <div className="truncate">
                      Prompt: {toolCall.args.prompt}
                    </div>
                  )}
                  {toolCall.args.duration && (
                    <div>Duration: {toolCall.args.duration}s</div>
                  )}
                  {toolCall.args.mode && <div>Mode: {toolCall.args.mode}</div>}
                </div>
              )}
              
              {/* Show progress message if available */}
              {toolCall.progressMessage && isGenerating && (
                <div className="mt-1 text-[10px] text-[var(--color-accent)] animate-pulse">
                  {toolCall.progressMessage}
                </div>
              )}

              {toolCall.result && isComplete && (
                <>
                  <div className="mt-2 text-[10px] text-green-600">
                    {toolCall.result.status === "success" ? (
                      <div>
                        {/* Special handling for audio analysis to show concise summary */}
                        {toolCall.toolName === "analyzeAudio" ? (
                          <div>
                            ✓ {toolCall.result.finalMessage || "Analysis complete"}
                            {toolCall.result.technical && (
                              <div className="text-[var(--color-text-secondary)] mt-1">
                                {toolCall.result.technical.bpm?.toFixed(0)} BPM • 
                                {toolCall.result.technical.key} {toolCall.result.technical.scale} • 
                                {toolCall.result.technical.energy > 100000 ? "High" : 
                                 toolCall.result.technical.energy > 50000 ? "Medium" : "Low"} energy
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            ✓ {toolCall.result.message || "Completed successfully"}
                            {toolCall.result.service && (
                              <span className="ml-1 text-[var(--color-text-dim)]">
                                via {toolCall.result.service}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-500">
                        {toolCall.result.message || "Failed"}
                      </div>
                    )}
                  </div>
                  
                  {/* Show AudioPlayer for successful music generation */}
                  {toolCall.result.status === "success" && 
                   (toolCall.toolName === "generate-music" || toolCall.toolName === "generateMusic") &&
                   toolCall.result.audioUrl && (
                    <div className="mt-2">
                      <AudioPlayer
                        audioUrl={toolCall.result.audioUrl}
                        localFilePath={toolCall.result.localFilePath}
                        prompt={toolCall.result.prompt || toolCall.args?.prompt || ""}
                        duration={toolCall.result.duration || 8}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
