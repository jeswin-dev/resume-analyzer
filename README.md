# CV Analyzer - AI-Powered CV vs Job Description Analysis

A full-stack application that uses Google's Gemini 1.5 Flash API to analyze CVs against job descriptions, providing detailed insights on candidate fit, strengths, weaknesses, and recommendations.

## Stack

### Backend

- **Node.js** (v18+) with TypeScript
- **tRPC** for type-safe API endpoints
- **Express** for HTTP server and file uploads
- **Vitest** for testing

### Frontend

- **React** (v18+) with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Dropzone** for file uploads
- **Vitest** + React Testing Library for testing

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd cv-analyzer
   ```

2. **Install dependencies on BE and FE**

   ```bash
   cd backend && npm install
   ```

   ```bash
   cd frontend && npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your AI authentication token:

   ```env
   AI_ENDPOINT=https://intertest.woolf.engineering/invoke
   AI_AUTH_TOKEN=your_actual_token_here
   PORT=3001
   ```

4. **Start the development servers**

   ```bash
   cd backend && npm run dev
   ```

   ```bash
   cd frontend && npm run dev
   ```

   This will start:

   - Backend API server on `http://localhost:3001`
   - Frontend development server on `http://localhost:3000`

### APIs

You can also interact with the API directly:

#### Upload and Compare Endpoint

```bash
curl -X POST http://localhost:3001/api/upload-and-compare \
  -F "cv=@path/to/cv.pdf" \
  -F "jobDescription=@path/to/job-description.pdf"
```

#### Response Format

```json
{
  "strengths": [
    "5+ years of React development experience aligns with job requirements",
    "Strong background in TypeScript and modern JavaScript"
  ],
  "weaknesses": [
    "Limited experience with backend technologies mentioned in job posting",
    "No mention of specific cloud platform experience required"
  ],
  "alignmentScore": 75,
  "recommendations": [
    "Consider highlighting any backend experience, even if limited",
    "Emphasize transferable skills and learning agility"
  ]
}
```

#### Health Check

```bash
curl http://localhost:3001/health
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **20 requests per minute** per client IP
- **300 requests per hour** per client IP

Rate limit headers are included in responses, and exceeded limits return HTTP 429 status.

### Testing

Run tests for both packages:

```bash
# Backend tests
cd packages/backend && npm test

# Frontend tests
cd packages/frontend && npm test
```

## Configuration

### Environment Variables

| Variable                             | Description                          | Default                                      |
| ------------------------------------ | ------------------------------------ | -------------------------------------------- |
| `AI_ENDPOINT`                        | Gemini API endpoint URL              | `https://intertest.woolf.engineering/invoke` |
| `AI_AUTH_TOKEN`                      | Authentication token for AI API      | Required                                     |
| `PORT`                               | Backend server port                  | `3001`                                       |
| `NODE_ENV`                           | Environment (development/production) | `development`                                |
| `RATE_LIMIT_MAX_REQUESTS_PER_MINUTE` | Rate limit per minute                | `20`                                         |
| `RATE_LIMIT_MAX_REQUESTS_PER_HOUR`   | Rate limit per hour                  | `300`                                        |

### File Upload Limits

- **Maximum file size**: 10MB per file
- **Accepted formats**: PDF only
- **Maximum files**: 2 (CV + Job Description)
