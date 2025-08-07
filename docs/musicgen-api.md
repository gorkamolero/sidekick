# MusicGen API Reference

## Model Version
```
671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb
```

## API Endpoint
```
POST https://api.replicate.com/v1/predictions
```

## Authentication
```
Authorization: Token ${REPLICATE_API_TOKEN}
```

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **prompt** | string | required | Text description of music to generate |
| **model_version** | string | "melody" | Options: "melody", "large", "medium", "small" |
| **duration** | integer | 8 | Length in seconds (1-30) |
| **input_audio** | string/file | null | Audio file URL (melody model only) |
| **continuation** | boolean | false | Continue from input audio |
| **continuation_start** | integer | null | Start time for continuation |
| **continuation_end** | integer | null | End time for continuation |
| **multi_band_diffusion** | boolean | false | Enable for better quality |
| **normalization_strategy** | string | "loudness" | Options: "loudness", "clip", "peak", "rms" |
| **top_k** | integer | 250 | Sampling parameter (0-1000) |
| **top_p** | number | 0.0 | Nucleus sampling (0-1) |
| **temperature** | number | 1.0 | Randomness (0-2) |
| **classifier_free_guidance** | integer | 3 | Prompt adherence (1-10) |
| **output_format** | string | "wav" | Options: "wav", "mp3" |
| **seed** | integer | null | For reproducible results |

## Example Request
```json
{
  "version": "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
  "input": {
    "prompt": "deep house bassline 128 bpm analog warmth",
    "duration": 8,
    "model_version": "large",
    "temperature": 1.0,
    "top_k": 250,
    "classifier_free_guidance": 3,
    "output_format": "wav"
  }
}
```

## Response Format
```json
{
  "id": "prediction_id",
  "status": "starting|processing|succeeded|failed",
  "output": "https://replicate.delivery/output.wav",
  "error": "error message if failed"
}
```

## Status Polling
```
GET https://api.replicate.com/v1/predictions/{prediction_id}
```

Poll until status is "succeeded" or "failed".