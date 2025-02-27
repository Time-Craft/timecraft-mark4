import { useState } from "react";
import ExploreHeader from "@/components/explore/ExploreHeader";
import ExploreContent from "@/components/explore/ExploreContent";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
const Explore = () => {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [sortByRelevance, setSortByRelevance] = useState(false);
  return <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <ExploreHeader view={view} onViewChange={setView} />
        <Button variant={sortByRelevance ? "default" : "outline"} onClick={() => setSortByRelevance(!sortByRelevance)} className="ml-4">
          <Brain className="mr-2 h-4 w-4" />
          AI Recommend
        </Button>
      </div>
      <ExploreContent view={view} sortByRelevance={sortByRelevance} />
    </div>;
};
export default Explore;