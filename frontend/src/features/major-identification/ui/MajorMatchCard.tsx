import type { MajorResult } from "@/shared/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";

interface MajorMatchCardProps {
  result: MajorResult;
}

export function MajorMatchCard({ result }: MajorMatchCardProps) {
  const percent = (result.score * 100).toFixed(0);
  return (
    <Card className="p-2">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{result.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-extrabold text-2xl text-primary">{percent}%</div>
        <div className="h-1.5 rounded mt-3 overflow-hidden bg-muted">
          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}
