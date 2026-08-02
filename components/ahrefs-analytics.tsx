import Script from 'next/script'

const AHREFS_DATA_KEY = 'MKGWTFjOPaZUImj8DW66Bg'

export function AhrefsAnalytics() {
  return (
    <Script
      async
      src="https://analytics.ahrefs.com/analytics.js"
      data-key={AHREFS_DATA_KEY}
      strategy="afterInteractive"
    />
  )
}
