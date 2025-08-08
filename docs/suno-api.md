# Suno API Integration Documentation

## Overview
Suno API is an AI-powered music generation platform that offers multiple model versions and comprehensive audio processing capabilities. This document outlines the integration requirements for adding Suno as a music generation service in Sidekick.

## API Capabilities

### Core Features
- **Music Generation**: Text-to-music with multiple model versions
- **Audio Extension**: Extend existing tracks
- **Audio Upload & Transform**: Process and modify uploaded audio
- **Lyrics Generation**: Create lyrics with timestamps
- **Stem Separation**: Extract vocals and instruments
- **Music Video Generation**: Create MP4 visualizations

### Model Versions
- **V3.5**: Balanced - Solid arrangements with creative diversity
- **V4**: High Quality - Best audio quality with refined song structure  
- **V4.5**: Advanced - Superior genre blending with smarter prompts

## Authentication
- **Method**: API Key
- **Obtain**: Sign up at https://sunoapi.org/
- **Usage**: Include in request headers

## Key Advantages
- 99.9% uptime guarantee
- 20-second streaming output capability
- High concurrency support
- Watermark-free for commercial use
- Usage-based pricing model

## Integration Architecture

### SunoAdapter Implementation

```typescript
interface SunoConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: 'v3.5' | 'v4' | 'v4.5';
  streamingEnabled: boolean;
}

interface SunoGenerationParams {
  prompt: string;
  model?: 'v3.5' | 'v4' | 'v4.5';
  duration?: number;
  lyrics?: string;
  extendAudio?: string; // Base64 or URL
  makeInstrumental?: boolean;
  temperature?: number;
}

interface SunoResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  lyrics?: string;
  duration?: number;
  credits_used?: number;
}
```

## API Endpoints (Expected)

### 1. Generate Music
```typescript
POST /api/generate
{
  "prompt": "string",
  "model": "v4.5",
  "duration": 30,
  "lyrics": "optional lyrics",
  "make_instrumental": false
}
```

### 2. Extend Music
```typescript
POST /api/extend
{
  "audio_url": "string",
  "prompt": "continuation instructions",
  "duration": 30
}
```

### 3. Get Task Status
```typescript
GET /api/task/{taskId}
```

### 4. Generate Lyrics
```typescript
POST /api/lyrics
{
  "prompt": "song theme/style",
  "style": "genre"
}
```

### 5. Separate Stems
```typescript
POST /api/separate
{
  "audio_url": "string",
  "separation_type": "vocals" | "instruments" | "all"
}
```

## Implementation Plan

### Phase 1: Basic Integration
1. Create `SunoAdapter` class implementing `MusicGenerationService`
2. Implement authentication and request handling
3. Add basic music generation capability
4. Handle polling for task completion

### Phase 2: Advanced Features
1. Add streaming support for real-time generation
2. Implement audio extension functionality
3. Add lyrics generation and synchronization
4. Integrate stem separation for remixing

### Phase 3: Optimization
1. Implement caching for repeated requests
2. Add retry logic with exponential backoff
3. Optimize polling intervals based on typical generation times
4. Add credit tracking and warnings

## Error Handling

```typescript
enum SunoErrorCode {
  INSUFFICIENT_CREDITS = 'insufficient_credits',
  INVALID_API_KEY = 'invalid_api_key',
  RATE_LIMIT = 'rate_limit',
  INVALID_PROMPT = 'invalid_prompt',
  GENERATION_FAILED = 'generation_failed',
  TIMEOUT = 'timeout'
}

class SunoError extends Error {
  constructor(
    public code: SunoErrorCode,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}
```

## Service Comparison

| Feature | MusicGen | Suno | Udio |
|---------|----------|------|------|
| Model Versions | 4 | 3 | TBD |
| Max Duration | 30s | Flexible | TBD |
| Streaming | No | Yes (20s) | TBD |
| Lyrics Support | No | Yes | TBD |
| Stem Separation | No | Yes | TBD |
| Commercial Use | Yes | Yes (no watermark) | TBD |
| Pricing Model | Per generation | Usage-based | TBD |

## Configuration Example

```typescript
// config/services.ts
export const sunoConfig: SunoConfig = {
  apiKey: process.env.SUNO_API_KEY,
  baseUrl: 'https://api.sunoapi.org',
  defaultModel: 'v4.5',
  streamingEnabled: true
};

// Usage in MusicGenerationManager
const sunoAdapter = new SunoAdapter(sunoConfig);
musicManager.registerService('suno', sunoAdapter);
musicManager.setActiveService('suno');
```

## Testing Strategy

### Unit Tests
- Mock API responses for all endpoints
- Test error handling for each error code
- Validate parameter transformation
- Test polling mechanism

### Integration Tests
- Test with actual API (sandbox environment)
- Verify audio file retrieval
- Test streaming functionality
- Validate credit consumption tracking

### Performance Tests
- Measure generation time for different models
- Test concurrent request handling
- Benchmark polling efficiency
- Monitor memory usage during streaming

## Monitoring & Metrics

### Key Metrics
- Generation success rate
- Average generation time per model
- Credit consumption rate
- API error frequency
- User preference (model selection)

### Logging
```typescript
logger.info('Suno generation started', {
  model: params.model,
  duration: params.duration,
  hasLyrics: !!params.lyrics
});

logger.error('Suno generation failed', {
  error: error.code,
  taskId: taskId,
  attempts: retryCount
});
```

## Migration Path

1. **Current State**: Direct MusicGen implementation
2. **Step 1**: Create abstraction layer with MusicGenAdapter
3. **Step 2**: Add SunoAdapter in parallel
4. **Step 3**: Add UI for service selection
5. **Step 4**: Enable A/B testing between services
6. **Step 5**: Monitor and optimize based on usage

## Security Considerations

- Store API keys securely (environment variables)
- Implement request signing if required
- Sanitize user prompts before sending
- Rate limit client-side requests
- Monitor for unusual usage patterns

## Support & Resources

- **Documentation**: https://docs.sunoapi.org/
- **Support Email**: support@sunoapi.org
- **API Status**: Monitor at sunoapi.org/status
- **Community**: Discord/Slack channels (TBD)