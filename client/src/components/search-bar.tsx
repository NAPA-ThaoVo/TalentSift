import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { SearchQuery } from "@shared/schema";

interface SearchBarProps {
  onSearch: (query: SearchQuery) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addKeyword = () => {
    if (input.trim() && !keywords.includes(input.trim())) {
      const newKeywords = [...keywords, input.trim()];
      setKeywords(newKeywords);
      setInput("");
      onSearch({ keywords: newKeywords });
    }
  };

  const removeKeyword = (keyword: string) => {
    const newKeywords = keywords.filter(k => k !== keyword);
    setKeywords(newKeywords);
    onSearch({ keywords: newKeywords });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addKeyword();
            }
          }}
          placeholder="Enter keywords to search (e.g. React, TypeScript)"
          className="flex-1"
        />
        <Button onClick={addKeyword}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <div
              key={keyword}
              className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-1"
            >
              {keyword}
              <button
                onClick={() => removeKeyword(keyword)}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
