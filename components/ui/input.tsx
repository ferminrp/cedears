import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-auto w-full min-w-0 rounded-[var(--radius-s)] border-0 bg-muted px-[var(--space-m)] py-[var(--space-s)] font-[family-name:var(--font-ui)] text-[length:var(--size-s)] leading-[var(--line-s)] tracking-[var(--letter-spacing-s)] text-foreground transition-[background,box-shadow] duration-[var(--motion-duration)] ease-[var(--motion-easing)] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-[length:var(--size-s)] file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gui-color-1)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-neutral-2 disabled:text-neutral-6 aria-invalid:outline aria-invalid:outline-2 aria-invalid:outline-[var(--error)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
