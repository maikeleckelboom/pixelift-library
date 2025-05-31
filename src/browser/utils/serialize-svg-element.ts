export function serializeSVGElement(input: SVGElement): string {
  const clone = input.cloneNode(true) as SVGElement;

  const bannedTags = ['script', 'style', 'foreignObject'];
  bannedTags.forEach((tag) => {
    clone.querySelectorAll(tag).forEach((el) => el.remove());
  });

  const isDangerousAttr = (name: string, value: string) => {
    const lcName = name.toLowerCase();
    const lcValue = value.toLowerCase();
    return (
      lcName.startsWith('on') || // event handlers
      lcValue.startsWith('javascript:') ||
      lcValue.includes('data:text/html') ||
      lcValue.includes('<script') ||
      (lcName === 'href' && lcValue.startsWith('javascript:'))
    );
  };

  function cleanAttributes(el: Element) {
    Array.from(el.attributes).forEach((attr) => {
      if (isDangerousAttr(attr.name, attr.value)) {
        el.removeAttribute(attr.name);
      }
    });
  }

  function walk(node: Element) {
    cleanAttributes(node);
    Array.from(node.children).forEach(walk);
  }

  walk(clone);

  return new XMLSerializer().serializeToString(clone);
}
