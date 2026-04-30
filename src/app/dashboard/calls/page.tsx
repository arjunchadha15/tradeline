import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CallsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Calls</h1>
      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
