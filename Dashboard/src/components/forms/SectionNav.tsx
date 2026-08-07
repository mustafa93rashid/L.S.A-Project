interface SectionNavItem {
  id: string
  label: string
}

interface SectionNavProps {
  items: SectionNavItem[]
}

/** Lightweight sticky section jump-list for long forms (Services,
 * Projects) — plain anchor links + CSS, no scrollspy library. Hidden
 * below `lg` since a form this long is already single-column there. */
export function SectionNav({ items }: SectionNavProps) {
  return (
    <nav
      aria-label="Form sections"
      className="sticky top-20 hidden h-fit w-44 shrink-0 flex-col gap-0.5 self-start lg:flex"
    >
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}
