import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "@/router";

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-frontend-domain.com"]
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());

// for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 2,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// File upload endpoint that bridges to tRPC
app.post(
  "/api/upload-and-compare",
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "jobDescription", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files.cv || !files.jobDescription) {
        return res.status(400).json({
          error: "Both CV and job description files are required",
        });
      }

      const cvFile = files.cv[0];
      const jobFile = files.jobDescription[0];

      // Call tRPC procedure directly
      const caller = appRouter.createCaller({ req, res });
      const result = await caller.compareProfiles({
        cvFile: {
          buffer: cvFile.buffer,
          originalname: cvFile.originalname,
          mimetype: cvFile.mimetype,
          size: cvFile.size,
        },
        jobFile: {
          buffer: jobFile.buffer,
          originalname: jobFile.originalname,
          mimetype: jobFile.mimetype,
          size: jobFile.size,
        },
      });

      res.json(result);
    } catch (error) {
      console.error("Upload and compare error:", error);

      if (error instanceof Error) {
        res.status(500).json({
          error: error.message,
        });
      } else {
        res.status(500).json({
          error: "An unexpected error occurred",
        });
      }
    }
  }
);

// tRPC middleware (for direct tRPC calls if needed)
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => ({ req, res }),
  })
);

// Error handling middleware
app.use(
  (
    error: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Express error:", error);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File size too large. Maximum 10MB allowed." });
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        return res
          .status(400)
          .json({ error: "Too many files. Only 2 files allowed." });
      }
    }

    res.status(500).json({ error: error.message || "Internal server error" });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📋 Health check: http://localhost:${port}/health`);
  console.log(
    `📁 Upload endpoint: http://localhost:${port}/api/upload-and-compare`
  );
  console.log(`🔧 tRPC endpoint: http://localhost:${port}/trpc`);
});
