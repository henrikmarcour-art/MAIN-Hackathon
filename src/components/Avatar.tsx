import type { Person } from "@/data/events";

export function Avatar({
  person,
  size = 28,
  className = "",
}: {
  person: Person;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={
        "inline-grid place-items-center rounded-full font-bold text-white ring-2 ring-surface " +
        className
      }
      style={{
        width: size,
        height: size,
        background: person.color,
        fontSize: Math.round(size * 0.42),
      }}
      aria-label={person.name}
    >
      {person.initials}
    </span>
  );
}

export function AvatarStack({
  people,
  size = 28,
}: {
  people: Person[];
  size?: number;
}) {
  return (
    <span className="flex">
      {people.map((p, i) => (
        <Avatar
          key={p.id}
          person={p}
          size={size}
          className={i === 0 ? "" : "-ml-2"}
        />
      ))}
    </span>
  );
}
