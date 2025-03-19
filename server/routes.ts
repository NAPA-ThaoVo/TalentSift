import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import { insertCvSchema, searchSchema } from "@shared/schema";
import { log } from "./vite";

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
  // Add new route to get all CVs
  app.get('/api/cvs', async (_req, res) => {
    try {
      const cvs = await storage.getAllCvs();
      res.json(cvs);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  app.post('/api/cvs/upload', upload.array('files', 10), async (req: MulterRequest, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const results = [];
      for (const file of req.files as Express.Multer.File[]) {
        // Preserve original Vietnamese filename
        const filename = Buffer.from(file.originalname, 'latin1').toString('utf8');
        log(`Processing file: ${filename} (${file.mimetype})`);

        if (!ALLOWED_TYPES.includes(file.mimetype)) {
          return res.status(400).json({ message: `Invalid file type for ${filename}. Only PDF and DOCX files are allowed` });
        }

      let extractedText = '';
        if (file.mimetype === 'application/pdf') {
          log('Processing PDF file...');
          const data = await pdfParse(file.buffer);
          extractedText = data.text;
          log(`Extracted text length: ${extractedText.length} characters`);
        } else {
          log('Processing DOCX file...');
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          extractedText = result.value;
          log(`Extracted text length: ${extractedText.length} characters`);
        }

        if (!extractedText.trim()) {
          log('Warning: Extracted text is empty');
          continue;
        }

        const cvData = {
          filename,
          contentType: file.mimetype,
          extractedText
        };

        const validatedData = insertCvSchema.parse(cvData);
        const cv = await storage.createCv(validatedData);
        log(`CV stored successfully with ID: ${cv.id}`);
        results.push(cv);
      }

      res.json(results);
    } catch (error) {
      if (error instanceof Error) {
        log(`Error processing file: ${error.message}`);
        res.status(400).json({ message: error.message });
      } else {
        log('Unexpected error occurred during file processing');
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  app.post('/api/cvs/search', async (req, res) => {
    try {
      const { keywords } = searchSchema.parse(req.body);
      log(`Received search request with keywords: ${keywords.join(', ')}`);

      const results = await storage.searchCvs(keywords);
      log(`Search returned ${results.length} results`);
      res.json(results);
    } catch (error) {
      if (error instanceof Error) {
        log(`Search error: ${error.message}`);
        res.status(400).json({ message: error.message });
      } else {
        log('Unexpected error occurred during search');
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  // Add new route to get debug information
  app.get('/api/cvs/debug', async (_req, res) => {
    try {
      const allCvs = await storage.getAllCvs();
      res.json({
        totalCvs: allCvs.length,
        cvs: allCvs,
      });
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