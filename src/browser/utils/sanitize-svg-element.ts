import type { Config } from 'dompurify';

type DOMPurifySanitize = (dirty: string | Node, config?: Config) => string;

interface SVGSerializerOptions {
  sanitize?: (...args: Parameters<DOMPurifySanitize>) => ReturnType<DOMPurifySanitize>;
  skipSanitization?: boolean;
}

export const BASE_SVG_SANITIZE_CONFIG: Parameters<DOMPurifySanitize>[1] = {
  USE_PROFILES: { svg: true },
  FORBID_TAGS: ['script', 'style', 'foreignObject', 'animate'],
  FORBID_ATTR: ['on*']
};

export function sanitizeSVGElement(
  input: SVGElement,
  options: SVGSerializerOptions = {}
): string {
  const clone = input.cloneNode(true) as SVGElement;

  if (!clone.hasAttribute('width')) clone.setAttribute('width', '100%');
  if (!clone.hasAttribute('height')) clone.setAttribute('height', '100%');

  const html = new XMLSerializer().serializeToString(clone);

  if (options.sanitize) {
    return options.sanitize(html, BASE_SVG_SANITIZE_CONFIG);
  }

  if (!options.skipSanitization && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[Pixelift] Security Warning: Unsanitized SVG output. ' +
        'To fix this, either:\n' +
        '1. Pass DOMPurify.sanitize as the "sanitize" option\n' +
        '2. Use createDOMPurifySVGSerializer helper\n' +
        '3. Explicitly set "skipSanitization: true" if intentional'
    );
  }

  return html;
}

export async function loadSVGSerializerWithDOMPurify(): Promise<
  (input: SVGElement) => string
> {
  try {
    const mod = await import('dompurify');
    const DOMPurify: { sanitize: DOMPurifySanitize } = mod.default || mod;

    return (input: SVGElement) =>
      sanitizeSVGElement(input, {
        sanitize: DOMPurify.sanitize,
        skipSanitization: false
      });
  } catch (err) {
    console.warn(
      '[Pixelift] DOMPurify not found. Falling back to unsanitized SVG output. ' +
        'To enable sanitization, install "dompurify" and try again.',
      err instanceof Error ? err.message : String(err)
    );

    return (input: SVGElement) =>
      sanitizeSVGElement(input, {
        skipSanitization: true
      });
  }
}
