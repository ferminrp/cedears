"use client"

import type * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-s)",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--success)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--error)",
          fontFamily: "var(--font-ui)",
          fontSize: "var(--size-s)",
          lineHeight: "var(--line-s)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast shadow-[var(--shadow-m)] rounded-[var(--radius-s)] font-[family-name:var(--font-ui)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
