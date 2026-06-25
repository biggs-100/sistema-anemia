interface StatCardProps {
  title: string;
  value: number | string;
  color: string;
}

export default function StatCard({ title, value, color }: StatCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800">
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className={`mt-1 text-3xl font-bold ${color} dark:opacity-90`}>{value}</p>
    </div>
  );
}
