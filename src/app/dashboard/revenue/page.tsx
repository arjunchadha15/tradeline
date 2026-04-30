import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RevenuePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Revenue</h1>
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
