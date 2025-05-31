import type { NodeInput, NodeOptions } from '@/node/decoders/sharp/types.ts';

export async function decode(input: NodeInput, options?: NodeOptions) {
  const decoder = await import('./sharp/decode');
  return await decoder.decode(input, options);
}
