import { getInternalCanvasPool } from '@/browser/decoders/canvas/internal-canvas-pool.ts';

async function decodeWithImageDecoderToCanvas(
  buffer: BufferSource,
  mimeType: string,
  signal?: AbortSignal
): Promise<OffscreenCanvas> {
  const pool = getInternalCanvasPool();

  const canvas = await pool.acquire(signal);

  try {
    // Create decoder
    const decoder = new ImageDecoder({ data: buffer, type: mimeType });
    await decoder.tracks.ready;

    // Decode the first frame (static images)
    const { image } = await decoder.decode({ frameIndex: 0 });

    // Draw to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    image.close(); // release bitmap memory

    return canvas;
  } catch (err) {
    pool.release(canvas);
    throw err;
  }
}

type DecodedCanvas = {
  canvas: OffscreenCanvas;
  release: () => void;
};

type DecodedFrame = {
  frame: VideoFrame;
  index: number;
  release: () => void;
};

async function decodeAnimatedFrames(
  buffer: BufferSource,
  mimeType: string,
  signal?: AbortSignal
): Promise<DecodedFrame[]> {
  const decoder = new ImageDecoder({ data: buffer, type: mimeType });
  await decoder.tracks.ready;

  if (!decoder.tracks.selectedTrack?.animated) {
    throw new Error('Image is not animated');
  }

  const frameCount = decoder.tracks.selectedTrack?.frameCount ?? 0;
  const frames: DecodedFrame[] = [];

  for (let i = 0; i < frameCount; i++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const { image } = await decoder.decode({ frameIndex: i });

    frames.push({
      frame: image,
      index: i,
      release: () => image.close()
    });
  }

  return frames;
}
