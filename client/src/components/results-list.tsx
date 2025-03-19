import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import type { SearchQuery, Cv } from "@shared/schema";

interface ResultsListProps {
  searchQuery: SearchQuery;
}

export default function ResultsList({ searchQuery }: ResultsListProps) {
  const { data: results, isLoading } = useQuery<Cv[]>({
    queryKey: ["/api/cvs/search", searchQuery],
    enabled: searchQuery.keywords.length > 0,
  });

  if (searchQuery.keywords.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Enter keywords above to search through CVs
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No CVs found matching your search criteria
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((cv) => (
        <Card key={cv.id}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{cv.filename}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {/* Handle potentially null date by ensuring it's a valid date object */}
                  {cv.uploadedAt ? new Date(cv.uploadedAt).toLocaleDateString() : 'Date not available'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}