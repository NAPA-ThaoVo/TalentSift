import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import { insertCvSchema, searchSchema } from "@shared/schema";

// Extend Express.Request to include the file property from multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export async function registerRoutes(app: Express): Promise<Server> {
  app.post('/api/cvs/upload', upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Invalid file type. Only PDF and DOCX files are allowed" });
      }

      let extractedText = '';
      if (req.file.mimetype === 'application/pdf') {
        const data = await pdfParse(req.file.buffer);
        extractedText = data.text;
      } else {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        extractedText = result.value;
      }

      const cvData = {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        extractedText
      };

      const validatedData = insertCvSchema.parse(cvData);
      const cv = await storage.createCv(validatedData);
      res.json(cv);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  app.post('/api/cvs/search', async (req, res) => {
    try {
      const { keywords } = searchSchema.parse(req.body);
      const results = await storage.searchCvs(keywords);
      res.json(results);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}