import type { ComparisonResult, ProcessedFile, GeminiRequest } from "@/types";

export class AIService {
  private readonly endpoint: string;
  private readonly authToken: string;

  constructor() {
    this.endpoint =
      process.env.AI_ENDPOINT || "https://intertest.woolf.engineering/invoke";
    this.authToken = process.env.AI_AUTH_TOKEN || "";

    if (!this.authToken) {
      throw new Error("AI_AUTH_TOKEN environment variable is required");
    }
  }

  private createPrompt(
    cv: ProcessedFile,
    jobDescription: ProcessedFile
  ): string {
    return `
You are an expert HR analyst. Compare the following CV against the job description and provide a detailed analysis.

JOB DESCRIPTION:
${jobDescription.content}

CANDIDATE CV:
${cv.content}

Please analyze the candidate's suitability for this role and respond with a JSON object that matches this exact structure:

{
  "strengths": ["specific strength 1", "specific strength 2", "..."],
  "weaknesses": ["specific weakness 1", "specific weakness 2", "..."],
  "alignmentScore": <number between 0-100>,
  "recommendations": ["specific recommendation 1", "specific recommendation 2", "..."]
}

Guidelines for your analysis:
- Strengths: Identify 3-5 specific qualifications, skills, or experiences that align well with the job requirements
- Weaknesses: Identify 2-4 areas where the candidate may not meet requirements or could improve
- Alignment Score: Provide a realistic score (0-100) based on overall fit
- Recommendations: Suggest 2-4 specific actions for the candidate or hiring process

Focus on concrete, actionable insights rather than generic statements. Be specific about technical skills, experience levels, and role requirements.

Respond ONLY with the JSON object, no additional text.`.trim();
  }

  async compareProfiles(
    cv: ProcessedFile,
    jobDescription: ProcessedFile
  ): Promise<ComparisonResult> {
    const prompt = this.createPrompt(cv, jobDescription);

    const request: GeminiRequest = {
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${this.authToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI service error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as any;

      let resultText: string;
      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        resultText = data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Unexpected response format from AI service");
      }

      const result = JSON.parse(resultText) as ComparisonResult;

      this.validateComparisonResult(result);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("JSON")) {
          throw new Error("AI service returned invalid JSON response");
        }
        throw error;
      }
      throw new Error("Unknown error occurred while calling AI service");
    }
  }

  private validateComparisonResult(
    result: any
  ): asserts result is ComparisonResult {
    if (!result || typeof result !== "object") {
      throw new Error("AI response is not a valid object");
    }

    if (!Array.isArray(result.strengths)) {
      throw new Error("AI response missing or invalid strengths array");
    }

    if (!Array.isArray(result.weaknesses)) {
      throw new Error("AI response missing or invalid weaknesses array");
    }

    if (
      typeof result.alignmentScore !== "number" ||
      result.alignmentScore < 0 ||
      result.alignmentScore > 100
    ) {
      throw new Error(
        "AI response missing or invalid alignmentScore (must be 0-100)"
      );
    }

    if (!Array.isArray(result.recommendations)) {
      throw new Error("AI response missing or invalid recommendations array");
    }

    // Ensure all array items are strings
    const allStrings = [
      ...result.strengths,
      ...result.weaknesses,
      ...result.recommendations,
    ].every((item) => typeof item === "string");

    if (!allStrings) {
      throw new Error("AI response contains non-string items in arrays");
    }
  }
}
