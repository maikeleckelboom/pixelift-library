import { isDebugEnabled } from '@/shared/debug.ts';
import type { BrowserInput } from '@/browser/types.ts';

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
    if (isDebugEnabled()) {
      console.debug(
        '🧼 sanitizeSVGElement: Sanitizing SVG with DOMPurify (optional dependency) to prevent XSS risks.'
      );
    }
    return window.DOMPurify.sanitize(clone.outerHTML, {
      USE_PROFILES: { svg: true },
      FORBID_TAGS: ['script', 'style', 'foreignObject', 'animate'],
      FORBID_ATTR: ['on*']
    });
  }

  if (!clone.getAttribute('width') || !clone.getAttribute('height')) {
    clone.setAttribute('width', '100%');
    clone.setAttribute('height', '100%');
  }

  return new XMLSerializer().serializeToString(clone);
}

export function isSVGInput(input: BrowserInput): boolean {
  return (
    input instanceof SVGElement || (input instanceof Blob && input.type === 'image/svg+xml')
  );
}
