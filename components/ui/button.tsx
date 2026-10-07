import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-[family-name:var(--font-ui)] text-[length:var(--size-s)] leading-[var(--line-s)] font-medium tracking-[var(--letter-spacing-s)] whitespace-nowrap transition-[background,color,box-shadow,transform] duration-[var(--motion-duration)] ease-[var(--motion-easing)] outline-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gui-color-1)] active:not-aria-[haspopup]:translate-y-[var(--motion-press-distance)] disabled:pointer-events-none aria-invalid:outline aria-invalid:outline-2 aria-invalid:outline-[var(--error)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 rounded-[var(--radius-s)] gap-[var(--space-xs)] px-[var(--space-l)] py-[var(--space-s)]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:shadow-[var(--shadow-s)] disabled:bg-muted disabled:text-neutral-6",
        outline:
          "bg-transparent text-foreground hover:bg-neutral-3/20 aria-expanded:bg-muted disabled:bg-transparent disabled:text-neutral-6",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-neutral-4/20 aria-expanded:bg-secondary disabled:bg-muted disabled:text-neutral-6",
        ghost:
          "bg-transparent text-foreground hover:bg-neutral-3/20 aria-expanded:bg-muted disabled:bg-transparent disabled:text-neutral-6",
        destructive:
          "bg-destructive text-primary-foreground hover:shadow-[var(--shadow-s)] disabled:bg-muted disabled:text-neutral-6",
        link: "bg-transparent px-0 py-0 text-foreground underline-offset-4 hover:underline disabled:bg-transparent disabled:text-neutral-6",
      },
      size: {
        default: "",
        xs: "gap-[var(--space-xxs)] px-[var(--space-m)] py-[var(--space-xs)] text-[length:var(--size-xs)] leading-[var(--line-xs)] [&_svg:not([class*='size-'])]:size-3",
        sm: "gap-[var(--space-xxs)] px-[var(--space-m)] py-[var(--space-xs)] text-[length:var(--size-xs)] leading-[var(--line-xs)] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "px-[var(--space-xl)] py-[var(--space-m)] text-[length:var(--size-m)] leading-[var(--line-m)]",
        icon: "size-[calc(var(--space-s)*2+var(--line-s))] px-0 py-0",
        "icon-xs": "size-6 px-0 py-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 px-0 py-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9 px-0 py-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
