# ModerationAnalyzer API Documentation

## Overview
The ModerationAnalyzer API provides endpoints for analyzing and moderating various types of content including text, images, audio, and video. The API uses OpenAI's models for text moderation and number detection, along with a custom NSFW model for image and video analysis.

## Base URL
```
http://127.0.0.1:8000
```

## Endpoints

### Text Analysis

#### Analyze Text Content
```http
POST /text/analyze
```

Analyzes text content for moderation and detects phone numbers.

**Request Body:**
- `text` (form-data): The text to analyze

**Response:**
```json
{
    "flagged": boolean,
    "type": string,
    "category_scores": {
        "harassment": float,
        "harassment_threatening": float,
        "hate": float,
        "hate_threatening": float,
        "illicit": float,
        "illicit_violent": float,
        "self_harm": float,
        "self_harm_instructions": float,
        "self_harm_intent": float,
        "sexual": float,
        "sexual_minors": float,
        "violence": float,
        "violence_graphic": float,
        "harassment/threatening": float,
        "hate/threatening": float,
        "illicit/violent": float,
        "self-harm/intent": float,
        "self-harm/instructions": float,
        "self-harm": float,
        "sexual/minors": float,
        "violence/graphic": float
    },
    "numbers": array
}
```

**Example Response:**
```json
{
    "flagged": true,
    "type": "harassment",
    "category_scores": {
        "harassment": 0.9778013045845195,
        "harassment_threatening": 0.0030139331559034337,
        "hate": 0.7311272606415029,
        "hate_threatening": 0.00006667023092435894,
        "illicit": 0.00004442183589214344,
        "illicit_violent": 0.000010071400221737608,
        "self_harm": 0.00047438307922800164,
        "self_harm_instructions": 0.00022788290577331583,
        "self_harm_intent": 0.00022303674997692745,
        "sexual": 0.03798081373730637,
        "sexual_minors": 0.000138852327569001,
        "violence": 0.016043592550923445,
        "violence_graphic": 0.00001971694219622292,
        "harassment/threatening": 0.0030139331559034337,
        "hate/threatening": 0.00006667023092435894,
        "illicit/violent": 0.000010071400221737608,
        "self-harm/intent": 0.00022303674997692745,
        "self-harm/instructions": 0.00022788290577331583,
        "self-harm": 0.00047438307922800164,
        "sexual/minors": 0.000138852327569001,
        "violence/graphic": 0.00001971694219622292
    },
    "numbers": []
}
```

#### Check Phone Numbers
```http
POST /text/check_number
```

Specifically checks for phone numbers in text content.

**Request Body:**
- `text` (form-data): The text to check for phone numbers

**Response:**
```json
{
    "flagged": boolean,
    "numbers": array
}
```

### Image Analysis

#### Predict Image Content
```http
POST /image/predict
```

Analyzes an image for NSFW content and extracts text from the image.

**Request Body:**
- `file` (form-data): Image file (supports common image formats)

**Response:**
```json
{
    "image_classification": {
        "predictions": {
            "drawings": float,
            "hentai": float,
            "neutral": float,
            "porn": float,
            "sexy": float
        },
        "top_category": string
    },
    "text_analysis": {
        "flagged": boolean,
        "type": string,
        "category_scores": {
            "harassment": float,
            "harassment_threatening": float,
            "hate": float,
            "hate_threatening": float,
            "illicit": float,
            "illicit_violent": float,
            "self_harm": float,
            "self_harm_instructions": float,
            "self_harm_intent": float,
            "sexual": float,
            "sexual_minors": float,
            "violence": float,
            "violence_graphic": float,
            "harassment/threatening": float,
            "hate/threatening": float,
            "illicit/violent": float,
            "self-harm/intent": float,
            "self-harm/instructions": float,
            "self-harm": float,
            "sexual/minors": float,
            "violence/graphic": float
        },
        "numbers": array
    }
}
```

#### Check Image Text
```http
POST /image/check_text
```

Extracts and analyzes text from an image.

**Request Body:**
- `file` (form-data): Image file

**Response:**
```json
{
    "flagged": boolean,
    "type": string,
    "category_scores": {
        "harassment": float,
        "harassment_threatening": float,
        "hate": float,
        "hate_threatening": float,
        "illicit": float,
        "illicit_violent": float,
        "self_harm": float,
        "self_harm_instructions": float,
        "self_harm_intent": float,
        "sexual": float,
        "sexual_minors": float,
        "violence": float,
        "violence_graphic": float,
        "harassment/threatening": float,
        "hate/threatening": float,
        "illicit/violent": float,
        "self-harm/intent": float,
        "self-harm/instructions": float,
        "self-harm": float,
        "sexual/minors": float,
        "violence/graphic": float
    },
    "numbers": array
}
```

### Video Analysis

#### Analyze Video
```http
POST /video/analyze_video
```

Analyzes video content frame by frame and processes audio content.

**Request Body:**
- `file` (form-data): Video file (supports .mp4, .avi, .mov, .wmv)

**Response:**
```json
{
    "Frames_classification": {
        "predictions": array,
        "top_categories": array,
        "frame_count": integer
    },
    "Audio_analysis": {
        "flagged": boolean,
        "type": string,
        "category_scores": {
            "harassment": float,
            "harassment_threatening": float,
            "hate": float,
            "hate_threatening": float,
            "illicit": float,
            "illicit_violent": float,
            "self_harm": float,
            "self_harm_instructions": float,
            "self_harm_intent": float,
            "sexual": float,
            "sexual_minors": float,
            "violence": float,
            "violence_graphic": float,
            "harassment/threatening": float,
            "hate/threatening": float,
            "illicit/violent": float,
            "self-harm/intent": float,
            "self-harm/instructions": float,
            "self-harm": float,
            "sexual/minors": float,
            "violence/graphic": float
        },
        "numbers": array
    }
}
```

### Audio Analysis

#### Transcribe Audio
```http
POST /audio/transcribe
```

Transcribes audio content and analyzes it for moderation.

**Request Body:**
- `audio_file` (form-data): Audio file

**Response:**
```json
{
    "flagged": boolean,
    "type": string,
    "category_scores": {
        "harassment": float,
        "harassment_threatening": float,
        "hate": float,
        "hate_threatening": float,
        "illicit": float,
        "illicit_violent": float,
        "self_harm": float,
        "self_harm_instructions": float,
        "self_harm_intent": float,
        "sexual": float,
        "sexual_minors": float,
        "violence": float,
        "violence_graphic": float,
        "harassment/threatening": float,
        "hate/threatening": float,
        "illicit/violent": float,
        "self-harm/intent": float,
        "self-harm/instructions": float,
        "self-harm": float,
        "sexual/minors": float,
        "violence/graphic": float
    },
    "numbers": array
}
```

#### Transcribe Video Audio
```http
POST /audio/transcribe_video
```

Extracts and transcribes audio from a video file.

**Request Body:**
- `video_file` (form-data): Video file

**Response:**
```json
{
    "flagged": boolean,
    "type": string,
    "category_scores": {
        "harassment": float,
        "harassment_threatening": float,
        "hate": float,
        "hate_threatening": float,
        "illicit": float,
        "illicit_violent": float,
        "self_harm": float,
        "self_harm_instructions": float,
        "self_harm_intent": float,
        "sexual": float,
        "sexual_minors": float,
        "violence": float,
        "violence_graphic": float,
        "harassment/threatening": float,
        "hate/threatening": float,
        "illicit/violent": float,
        "self-harm/intent": float,
        "self-harm/instructions": float,
        "self-harm": float,
        "sexual/minors": float,
        "violence/graphic": float
    },
    "numbers": array
}
```

## Error Responses

All endpoints may return the following error responses:

- `400 Bad Request`: Invalid input or unsupported file format
- `500 Internal Server Error`: Server-side processing error

## Notes

1. The API uses OpenAI's models for text moderation and number detection
2. Image and video analysis uses a custom NSFW model with the following categories:
   - drawings
   - hentai
   - neutral
   - porn
   - sexy
3. Audio transcription is handled by OpenAI's Whisper model
4. All endpoints support CORS and can be accessed from any origin