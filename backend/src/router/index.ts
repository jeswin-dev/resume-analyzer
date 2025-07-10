import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { FileParserService } from '@/services/file-parser';
import { AIService } from '@/services/ai-service';
import { rateLimiter } from '@/utils/rate-limiter';

const t = initTRPC.create();

const fileParserService = new FileParserService();
const aiService = new AIService();

export const appRouter = t.router({
  compareProfiles: t.procedure
    .input(z.object({
      cvFile: z.object({
        buffer: z.instanceof(Buffer),
        originalname: z.string(),
        mimetype: z.string(),
        size: z.number()
      }),
      jobFile: z.object({
        buffer: z.instanceof(Buffer),
        originalname: z.string(),
        mimetype: z.string(),
        size: z.number()
      })
    }))
    .output(z.object({
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      alignmentScore: z.number().min(0).max(100),
      recommendations: z.array(z.string())
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check rate limits - IP as client identifier
        const clientId = (ctx as any)?.req?.ip || 'default';
        const rateLimit = rateLimiter.checkLimit(clientId);
        
        if (!rateLimit.allowed) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Rate limit exceeded. Minute remaining: ${rateLimit.minuteRemaining}, Hour remaining: ${rateLimit.hourRemaining}`,
          });
        }

        // Validate file types
        if (input.cvFile.mimetype !== 'application/pdf' || input.jobFile.mimetype !== 'application/pdf') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Both files must be PDF format',
          });
        }

        const { cv, jobDescription } = await fileParserService.processFiles(
          input.cvFile,
          input.jobFile
        );

        const result = await aiService.compareProfiles(cv, jobDescription);

        return result;

      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        });
      }
    }),

  health: t.procedure
    .query(() => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
    })
});

export type AppRouter = typeof appRouter; 