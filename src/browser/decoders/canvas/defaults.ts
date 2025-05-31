export const IMAGE_BITMAP_OPTIONS: ImageBitmapOptions = {
  imageOrientation: 'none',
  premultiplyAlpha: 'none'
} as const;

export const IMAGE_DATA_SETTINGS: ImageDataSettings = {
  colorSpace: 'srgb'
} as const;

export const CANVAS_IMAGE_SMOOTHING: CanvasImageSmoothing = {
  imageSmoothingEnabled: false,
  imageSmoothingQuality: 'high'
} as const;

export const CANVAS_RENDERING_CONTEXT_2D_SETTINGS: CanvasRenderingContext2DSettings = {
  alpha: true,
  willReadFrequently: true
} as const;

export const CANVAS_DECODE_CONFIG = {
  bitmap: IMAGE_BITMAP_OPTIONS,
  context2d: CANVAS_RENDERING_CONTEXT_2D_SETTINGS,
  smoothing: CANVAS_IMAGE_SMOOTHING,
  imageData: IMAGE_DATA_SETTINGS
} as const;
