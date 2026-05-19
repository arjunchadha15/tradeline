import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
