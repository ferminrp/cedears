import type { CedearFaq } from "@/lib/cedear-faqs"
import { cn } from "@/lib/utils"

export function CedearFaqs({
  faqs,
  headingClassName,
  embedded = false,
  sectionId = "cedear-faqs-heading",
}: {
  faqs: CedearFaq[]
  headingClassName?: string
  embedded?: boolean
  sectionId?: string
}) {
  const headingElementId = `${sectionId}-heading`

  return (
    <section aria-labelledby={headingElementId} id={sectionId} className="space-y-4">
      <h2
        id={headingElementId}
        className={cn(
          "text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tracking-[var(--letter-spacing-l)]",
          headingClassName,
        )}
      >
        Preguntas frecuentes
      </h2>
      <div
        className={cn(
          embedded
            ? "divide-y border-0 bg-transparent"
            : "divide-y overflow-hidden rounded-[var(--radius-m)] border border-border bg-card",
        )}
      >
        {faqs.map((faq) => (
          <details key={faq.question} className="group px-4 py-1">
            <summary className="cursor-pointer list-none py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-3">
                {faq.question}
                <span
                  aria-hidden
                  className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                >
                  ▾
                </span>
              </span>
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
