import type { NodeInput, NodeOptions } from '@/node/types.ts';

export async function decode(input: NodeInput, options?: NodeOptions) {
  const decoder = await import('./decoders/sharp');
  return await decoder.decode(input, options);
}
