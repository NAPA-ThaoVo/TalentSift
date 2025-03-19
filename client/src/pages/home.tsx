import { useToast } from "@/hooks/use-toast";
import CvUpload from "@/components/cv-upload";
import SearchBar from "@/components/search-bar";
import ResultsList from "@/components/results-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import type { SearchQuery } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({ keywords: [] });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              CV Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CvUpload onError={(message) => {
              toast({
                variant: "destructive",
                title: "Error",
                description: message,
              });
            }} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <SearchBar onSearch={setSearchQuery} />
          </CardContent>
        </Card>

        <ResultsList searchQuery={searchQuery} />
      </div>
    </div>
  );
}
