import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { AudioPlayer } from "./AudioPlayer";
import { cn } from "@/lib/utils";
import React from "react";

interface ToolCallDisplayProps {
  toolCalls?: any[];
  className?: string;
}

export function ToolCallDisplay({
  toolCalls,
  className,
}: ToolCallDisplayProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  // Debug logging to understand the structure
  console.log('ToolCallDisplay received toolCalls:', toolCalls);

  return (
    <div className={cn("space-y-2 mt-2", className)}>
      {toolCalls.map((toolCall, index) => {
        // Debug each tool call
        console.log(`Tool call ${index}:`, toolCall);
        console.log('Tool call state:', toolCall.state);
        console.log('Tool call result:', toolCall.result);
        console.log('Tool call output:', toolCall.output);
        
        // Map old state to new Tool component states
        const getToolState = () => {
          if (toolCall.state === 'call') return 'input-available';
          if (toolCall.state === 'result') {
            // Check both result and output fields
            const result = toolCall.result || toolCall.output;
            return result?.status === 'success' ? 'output-available' : 'output-error';
          }
          return 'input-streaming';
        };

        const getToolDisplayName = () => {
          if (
            toolCall.toolName === "generate-music" ||
            toolCall.toolName === "generateMusic"
          ) {
            return "Generate Music";
          }
          if (toolCall.toolName === "analyzeAudio") {
            return "Analyze Audio";
          }
          if (
            toolCall.toolName === "getProjectInfo" ||
            toolCall.toolName === "get-project-info"
          ) {
            return "Get Project Info";
          }
          if (toolCall.toolName === "test-component" || toolCall.toolName === "testComponent") {
            return "Test Component";
          }
          return toolCall.toolName;
        };

        const renderOutput = () => {
          // Check both result and output fields (AI SDK v5 might use output)
          const result = toolCall.result || toolCall.output;
          if (!result) return null;

          // Special handling for test component
          if ((toolCall.toolName === "test-component" || toolCall.toolName === "testComponent")) {
            const data = result.componentData;
            return (
              <div className="p-3 space-y-2">
                <div className={cn(
                  "text-sm font-medium",
                  result.status === "success" ? "text-green-600" : "text-red-600"
                )}>
                  {result.status === "success" ? "✓" : "✗"} {data?.title || "Test Component"}
                </div>
                <div className="p-2 bg-muted/50 rounded text-xs space-y-1">
                  <div><span className="text-muted-foreground">Content:</span> {data?.content}</div>
                  <div><span className="text-muted-foreground">Variant:</span> {data?.variant}</div>
                  <div><span className="text-muted-foreground">Test ID:</span> {data?.metadata?.testId}</div>
                  <div><span className="text-muted-foreground">Timestamp:</span> {new Date(data?.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            );
          }

          // Special handling for audio analysis
          if (toolCall.toolName === "analyzeAudio" && result.status === "success") {
            return (
              <div className="p-3 space-y-2">
                <div className="text-sm font-medium text-green-600">
                  ✓ {result.finalMessage || "Analysis complete"}
                </div>
                {result.technical && (
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">BPM:</span>{" "}
                      <span className="font-mono">{result.technical.bpm?.toFixed(0)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Key:</span>{" "}
                      <span className="font-mono">{result.technical.key} {result.technical.scale}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Energy:</span>{" "}
                      <span className="font-mono">
                        {result.technical.energy > 100000 ? "High" : 
                         result.technical.energy > 50000 ? "Medium" : "Low"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Special handling for music generation
          if ((toolCall.toolName === "generate-music" || toolCall.toolName === "generateMusic") && 
              result.status === "success" && result.audioUrl) {
            return (
              <div className="p-3 space-y-3">
                <div className="text-sm font-medium text-green-600">
                  ✓ {result.message || "Music generated successfully"}
                  {result.service && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      via {result.service}
                    </span>
                  )}
                </div>
                <AudioPlayer
                  audioUrl={result.audioUrl}
                  localFilePath={result.localFilePath}
                  prompt={result.prompt || toolCall.args?.prompt || ""}
                  duration={result.duration || 8}
                />
              </div>
            );
          }

          // Default output
          return (
            <div className="p-3">
              <div className={cn(
                "text-sm",
                result.status === "success" ? "text-green-600" : "text-red-600"
              )}>
                {result.status === "success" ? "✓" : "✗"} {result.message || 
                  (result.status === "success" ? "Completed successfully" : "Failed")}
              </div>
            </div>
          );
        };

        return (
          <Tool key={toolCall.toolCallId || index} defaultOpen={false}>
            <ToolHeader 
              type={getToolDisplayName()} 
              state={getToolState()}
            />
            <ToolContent>
              {toolCall.args && (
                <ToolInput input={toolCall.args} />
              )}
              {toolCall.progressMessage && toolCall.state === 'call' && (
                <div className="px-4 pb-2 text-xs text-[var(--color-accent)] animate-pulse">
                  {toolCall.progressMessage}
                </div>
              )}
              {(toolCall.result || toolCall.output) && (
                <ToolOutput 
                  output={renderOutput()}
                  errorText={(toolCall.result || toolCall.output)?.status !== "success" ? (toolCall.result || toolCall.output)?.message : undefined}
                />
              )}
            </ToolContent>
          </Tool>
        );
      })}
    </div>
  );
}