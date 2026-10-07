import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-auto w-fit shrink-0 items-center justify-center gap-[var(--space-xxs)] overflow-hidden rounded-[var(--radius-s)] border-0 px-[var(--space-xs)] py-[var(--space-xxs)] font-[family-name:var(--font-ui)] text-[length:var(--size-xs)] leading-[var(--line-xs)] font-medium tracking-[var(--letter-spacing-xs)] whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gui-color-1)] [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-option-badge text-option-badge-foreground [a]:hover:opacity-90",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-neutral-4/40",
        destructive:
          "bg-[var(--error-transparent)] text-destructive [a]:hover:bg-[var(--error-transparent)]",
        outline:
          "bg-transparent text-foreground ring-1 ring-border [a]:hover:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
