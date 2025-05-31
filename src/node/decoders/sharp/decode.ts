import type { PixelData } from '@/types';
import { loadSharp } from '@/node/decoders/sharp/load-sharp.ts';
import type { NodeInput, NodeOptions } from '@/node/decoders/sharp/types.ts';
import { NodeDecodeError } from '@/node/decoders/errors.ts';
import { normalizeNodeInput } from '@/node/utils/normalize-node-input.ts';
import { validateResizeOptions } from '@/shared/validate.ts';

export async function decode(input: NodeInput, options?: NodeOptions): Promise<PixelData> {
  const sharp = await loadSharp();

  const resize = validateResizeOptions(options);

  try {
    const normalizedInput = await normalizeNodeInput(input, {
      ...(options?.signal ? { signal: options.signal } : {})
    });

    let pipeline = sharp(normalizedInput);

    if (resize) {
      pipeline = pipeline.resize(resize.width, resize.height, {
        fit: resize.fit
      });
    }

    const { data, info } = await pipeline
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    return {
      data: new Uint8ClampedArray(data.buffer),
      width: info.width,
      height: info.height
    };
  } catch (error) {
    throw new NodeDecodeError.ModuleError('DECODE_FAILED', {
      cause: error,
      context: {
        input,
        resize,
        message: error instanceof Error ? error.message : String(error)
      }
    });
  }
}
