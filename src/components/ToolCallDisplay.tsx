import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { AudioPlayer } from "./AudioPlayer";
import { cn } from "@/lib/utils";
import React from "react";
import type { ToolUIPart } from 'ai';

interface ToolCallDisplayProps {
  message: any; // AI SDK v5 message with parts
  className?: string;
}

export function ToolCallDisplay({
  message,
  className,
}: ToolCallDisplayProps) {
  if (!message?.parts) return null;

  // Filter tool parts from message.parts
  const toolParts = message.parts.filter((part: any) => 
    part.type.startsWith('tool-')
  );
  
  if (toolParts.length === 0) return null;

  // Debug logging to understand the structure
  console.log('ToolCallDisplay message.parts:', message.parts);
  console.log('Tool parts:', toolParts);

  return (
    <div className={cn("space-y-2 mt-2", className)}>
      {toolParts.map((toolPart: ToolUIPart, index: number) => {
        // Debug each tool part
        console.log(`Tool part ${index}:`, toolPart);
        console.log('Tool part type:', toolPart.type);
        console.log('Tool part state:', toolPart.state);
        
        // Extract tool name from type (e.g., 'tool-testComponent' -> 'testComponent')
        const toolName = toolPart.type.replace('tool-', '');
        
        const getToolDisplayName = () => {
          if (
            toolName === "generate-music" ||
            toolName === "generateMusic"
          ) {
            return "Generate Music";
          }
          if (toolName === "analyzeAudio") {
            return "Analyze Audio";
          }
          if (
            toolName === "getProjectInfo" ||
            toolName === "get-project-info"
          ) {
            return "Get Project Info";
          }
          if (toolName === "test-component" || toolName === "testComponent") {
            return "Test Component";
          }
          return toolName;
        };

        const renderOutput = () => {
          if (!toolPart.output) return null;
          const result = toolPart.output;

          // Special handling for test component
          if (toolName === "test-component" || toolName === "testComponent") {
            const data = result.componentData;
            return (
              <div className="space-y-2">
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
          if (toolName === "analyzeAudio" && result.status === "success") {
            return (
              <div className="space-y-2">
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
          if ((toolName === "generate-music" || toolName === "generateMusic") && 
              result.status === "success" && result.audioUrl) {
            return (
              <div className="space-y-3">
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
                  prompt={result.prompt || toolPart.input?.prompt || ""}
                  duration={result.duration || 8}
                />
              </div>
            );
          }

          // Default output
          return (
            <div className="text-sm">
              <div className={cn(
                result.status === "success" ? "text-green-600" : "text-red-600"
              )}>
                {result.status === "success" ? "✓" : "✗"} {result.message || 
                  (result.status === "success" ? "Completed successfully" : "Failed")}
              </div>
            </div>
          );
        };

        return (
          <Tool key={`${toolPart.type}-${index}`} defaultOpen={true}>
            <ToolHeader 
              type={getToolDisplayName()} 
              state={toolPart.state}
            />
            <ToolContent>
              {toolPart.input && (
                <ToolInput input={toolPart.input} />
              )}
              {toolPart.output && (
                <ToolOutput 
                  output={renderOutput()}
                  errorText={toolPart.errorText}
                />
              )}
            </ToolContent>
          </Tool>
        );
      })}
    </div>
  );
}