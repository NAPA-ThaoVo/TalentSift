import { cvs, type Cv, type InsertCv } from "@shared/schema";
import { log } from "./vite";

export interface IStorage {
  createCv(cv: InsertCv): Promise<Cv>;
  getAllCvs(): Promise<Cv[]>;
  searchCvs(keywords: string[]): Promise<Cv[]>;
}

export class MemStorage implements IStorage {
  private cvs: Map<number, Cv>;
  private currentId: number;

  constructor() {
    this.cvs = new Map();
    this.currentId = 1;
    log('Initialized MemStorage');
  }

  async createCv(insertCv: InsertCv): Promise<Cv> {
    const id = this.currentId++;
    const cv: Cv = {
      ...insertCv,
      id,
      uploadedAt: new Date(),
    };
    this.cvs.set(id, cv);
    log(`Created CV with ID ${id}. Total CVs: ${this.cvs.size}`);
    return cv;
  }

  async getAllCvs(): Promise<Cv[]> {
    const cvs = Array.from(this.cvs.values());
    log(`Getting all CVs. Total CVs: ${cvs.length}`);
    return cvs;
  }

  async clearAllCvs(): Promise<void> {
    this.cvs.clear();
    this.currentId = 1;
    log('Cleared all CVs');
  }

  async searchCvs(keywords: string[]): Promise<Cv[]> {
    log(`Searching CVs with keywords: ${keywords.join(', ')}`);

    const results = Array.from(this.cvs.values()).map(cv => {
      const matches = keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matches = (cv.extractedText.match(regex) || []).length;
        log(`CV ${cv.id} (${cv.filename}) matches '${keyword}': ${matches} times`);
        return count + matches;
      }, 0);
      return { cv, matches };
    });

    const filteredResults = results
      .sort((a, b) => b.matches - a.matches)
      .filter(r => r.matches > 0)
      .map(r => r.cv);

    log(`Search found ${filteredResults.length} matching CVs from total ${this.cvs.size} CVs`);
    return filteredResults;
  }
}

// Create a single instance for the entire application
export const storage = new MemStorage();