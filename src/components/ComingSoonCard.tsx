import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComingSoonCardProps {
  format: "vinyl" | "cassette" | "cd";
}

const ComingSoonCard = ({ format }: ComingSoonCardProps) => {
  const formatLabels = {
    vinyl: "Vinyl",
    cassette: "Cassette",
    cd: "CD"
  };

  return (
    <Card className="group cursor-default bg-card/50 border-muted/50 hover:border-muted transition-all duration-300">
      <CardContent className="p-0">
        <div className="relative aspect-square bg-gradient-to-br from-muted/20 to-muted/5 rounded-t-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
              <span className="text-2xl text-muted-foreground/50">📀</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Coming Soon</p>
          </div>
          
          {/* Format Badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 text-xs uppercase font-bold bg-secondary/80"
          >
            {formatLabels[format]}
          </Badge>
        </div>
        
        <div className="p-4 space-y-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground">New Release</h3>
            <p className="text-xs text-muted-foreground/70">Mystery Artist</p>
          </div>
          <div className="text-sm font-bold text-muted-foreground">TBA</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComingSoonCard;