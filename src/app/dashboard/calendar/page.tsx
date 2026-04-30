import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Calendar</h1>
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
