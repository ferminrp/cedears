import type { CedearFaq } from "@/lib/cedear-faqs"
import { cn } from "@/lib/utils"

export function CedearFaqs({
  faqs,
  headingClassName,
  embedded = false,
  sectionId = "cedear-faqs",
  showHeading = true,
}: {
  faqs: CedearFaq[]
  headingClassName?: string
  embedded?: boolean
  sectionId?: string
  /** false when the caller renders the H2 (id `${sectionId}-heading`) outside a card. */
  showHeading?: boolean
}) {
  const headingElementId = `${sectionId}-heading`

  // Without its own heading the caller's <section aria-labelledby> already names
  // this region; a nested labelled section would duplicate the landmark.
  const Wrapper = showHeading ? "section" : "div"

  return (
    <Wrapper
      aria-labelledby={showHeading ? headingElementId : undefined}
      id={sectionId}
      className="space-y-4"
    >
      {showHeading ? (
      <h2
        id={headingElementId}
        className={cn(
          "text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tracking-[var(--letter-spacing-l)]",
          headingClassName,
        )}
      >
        Preguntas frecuentes
      </h2>
      ) : null}
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
                  className="mt-0.5 shrink-0 text-muted-foreground transition-transform duration-[var(--motion-large-duration)] ease-[var(--motion-large-easing)] group-open:rotate-180 motion-reduce:transition-none"
                >
                  ▾
                </span>
              </span>
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-muted-foreground">
              {faq.answerNode ?? faq.answer}
            </p>
          </details>
        ))}
      </div>
    </Wrapper>
  )
}
