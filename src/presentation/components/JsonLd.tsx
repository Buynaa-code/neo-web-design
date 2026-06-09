/**
 * Renders a JSON-LD <script> for structured data (schema.org).
 * Server component — emitted into static HTML so crawlers read it without running JS.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Data is built from trusted server-side sources only.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
