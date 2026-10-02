import { initials } from "@/feature/utils";

interface Props {
  author?: string | null;
  email?: string | null;
}

export function Author({ author, email }: Props) {
  console.log("Author component props:", { author, email });
  const name = author?.trim() || email?.trim() || "Unknown";

  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
        {initials(name)}
      </div>

      <span className="text-sm">
        {name}
      </span>
    </div>
  );
}