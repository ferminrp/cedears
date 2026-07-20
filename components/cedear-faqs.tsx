import type { CedearFaq } from "@/lib/cedear-faqs"

export function CedearFaqs({ faqs }: { faqs: CedearFaq[] }) {
  return (
    <section aria-labelledby="cedear-faqs-heading" className="space-y-4">
      <h2
        id="cedear-faqs-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Preguntas frecuentes
      </h2>
      <div className="divide-y rounded-lg border">
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
