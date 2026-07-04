import type { Child } from "@/lib/children/queries";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-soleil-primary text-white",
  "bg-soleil-secondary text-white",
  "bg-soleil-accent text-soleil-text",
  "bg-[#81C784] text-white",
  "bg-[#FFB74D] text-soleil-text",
  "bg-[#4DB6AC] text-white",
] as const;

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }

  return Math.abs(hash);
}

export function getChildInitials(child: Pick<Child, "first_name" | "last_name">) {
  const first = child.first_name.trim().charAt(0).toUpperCase();
  const last = child.last_name.trim().charAt(0).toUpperCase();

  return `${first}${last}`;
}

export function getChildAvatarColorClass(childId: string) {
  return AVATAR_COLORS[hashString(childId) % AVATAR_COLORS.length];
}

export function getChildDisplayName(child: Pick<Child, "first_name" | "last_name">) {
  return `${child.first_name} ${child.last_name}`;
}

type ChildAvatarProps = {
  child: Pick<Child, "id" | "first_name" | "last_name" | "photo_url">;
  className?: string;
};

export function ChildAvatar({ child, className }: ChildAvatarProps) {
  const initials = getChildInitials(child);

  if (child.photo_url) {
    return (
      <img
        src={child.photo_url}
        alt={getChildDisplayName(child)}
        className={cn(
          "size-20 rounded-full border-2 border-border object-cover shadow-soleil",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-20 items-center justify-center rounded-full border-2 border-border font-heading text-xl font-bold shadow-soleil",
        getChildAvatarColorClass(child.id),
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
