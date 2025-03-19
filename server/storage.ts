import { cvs, type Cv, type InsertCv } from "@shared/schema";

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
  }

  async createCv(insertCv: InsertCv): Promise<Cv> {
    const id = this.currentId++;
    const cv: Cv = {
      ...insertCv,
      id,
      uploadedAt: new Date(),
    };
    this.cvs.set(id, cv);
    return cv;
  }

  async getAllCvs(): Promise<Cv[]> {
    return Array.from(this.cvs.values());
  }

  async searchCvs(keywords: string[]): Promise<Cv[]> {
    const results = Array.from(this.cvs.values()).map(cv => {
      const matches = keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matches = (cv.extractedText.match(regex) || []).length;
        return count + matches;
      }, 0);
      return { cv, matches };
    });

    return results
      .sort((a, b) => b.matches - a.matches)
      .filter(r => r.matches > 0)
      .map(r => r.cv);
  }
}

export const storage = new MemStorage();
