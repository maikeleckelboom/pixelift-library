declare global {
  interface Window {
    DOMPurify?: {
      sanitize: (input: string, config?: object) => string;
    };
  }
}

export function serializeSVGElement(input: SVGElement): string {
  const clone = input.cloneNode(true) as SVGElement;

  if (typeof window !== 'undefined' && window.DOMPurify?.sanitize) {
    console.debug(
      '🧼 sanitizeSVGElement: Sanitizing SVG with DOMPurify (optional dependency) to prevent XSS risks.'
    );
    return window.DOMPurify.sanitize(clone.outerHTML, {
      USE_PROFILES: { svg: true },
      FORBID_TAGS: ['script', 'style', 'foreignObject', 'animate'],
      FORBID_ATTR: ['on*']
    });
  }

  return clone.outerHTML;
}
