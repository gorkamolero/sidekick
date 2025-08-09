import { Loader2, Music, CheckCircle, AlertCircle, Wand2 } from "lucide-react";
import { cn } from "../lib/utils";

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

        const getIcon = () => {
          if (
            toolCall.toolName === "generate-music" ||
            toolCall.toolName === "generateMusic"
          ) {
            return <Music className="w-3 h-3" />;
          }
          if (toolCall.toolName === "analyzeAudio") {
            return <Wand2 className="w-3 h-3" />;
          }
          return <Wand2 className="w-3 h-3" />;
        };

        const getStatusIcon = () => {
          if (isGenerating) {
            return <Loader2 className="w-3 h-3 animate-spin" />;
          }
          if (isComplete) {
            return <CheckCircle className="w-3 h-3 text-green-500" />;
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
              "flex items-start gap-2 p-2 rounded-md border text-xs font-mono",
              isGenerating &&
                "border-[var(--color-accent)] bg-[var(--color-accent)]/10 animate-pulse",
              isComplete && "border-green-500/30 bg-green-500/5",
              !isGenerating &&
                !isComplete &&
                "border-[var(--color-text-dim)] bg-[var(--color-surface)]",
            )}
          >
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {getIcon()}
              {getStatusIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[var(--color-text-primary)]">
                {getToolDisplayName()}
              </div>

              {toolCall.args && (
                <div className="mt-1 text-[10px] text-[var(--color-text-secondary)]">
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

              {toolCall.result && isComplete && (
                <div className="mt-1 text-[10px] text-green-600">
                  {toolCall.result.status === "success" ? (
                    <div>
                      ✓ {toolCall.result.message || "Completed successfully"}
                      {toolCall.result.service && (
                        <span className="ml-1 text-[var(--color-text-dim)]">
                          via {toolCall.result.service}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-500">
                      ✗ {toolCall.result.message || "Failed"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
