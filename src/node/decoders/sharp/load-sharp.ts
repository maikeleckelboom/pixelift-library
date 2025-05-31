import { default as SharpInstance } from 'sharp';

export type Sharp = typeof SharpInstance;

let _sharp: Sharp | null = null;
let sharpPromise: Promise<Sharp> | null = null;

export async function loadSharp(): Promise<Sharp> {
  if (_sharp) return _sharp;
  if (sharpPromise) return sharpPromise;

  sharpPromise = import('sharp')
    .then((mod) => {
      _sharp = mod.default;
      return _sharp;
    })
    .catch((error) => {
      _sharp = null;
      sharpPromise = null;
      throw wrapSharpError(error);
    });

  return sharpPromise;
}

function wrapSharpError(error: unknown): Error {
  const msg = createErrorMessage(error);
  const err = new Error(msg);
  err.name = 'SharpLoaderError';
  if (error instanceof Error) err.cause = error;
  return err;
}

function isMissingError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 'MODULE_NOT_FOUND' &&
    /sharp/.test(error.message)
  );
}

function createErrorMessage(error: unknown): string {
  if (isMissingError(error)) {
    return `
❌ Missing \`sharp\` package (required for server image processing)

💡 Install with:
   npm install sharp
   pnpm add sharp
   yarn add sharp
   bun add sharp

⚠️ Pixelift requires \`sharp\` for server features
   Check installation and Node.js version (v18+ recommended)
`.trim();
  }

  return `
❌ Unexpected \`sharp\` load error:

${error instanceof Error ? error.message : String(error)}

💡 Common installation issues:
   1. Node.js version mismatch: Requires v18+
   2. Missing build tools: Install Python, node-gyp and compiler tools
   3. Platform architecture mismatch: Try \`npm install --platform=linux --arch=x64 sharp\`
   4. Global libvips conflict: Set \`SHARP_IGNORE_GLOBAL_LIBVIPS=1\`
   5. Permission issues: Use \`--unsafe-perm\` with npm

📖 See troubleshooting guide: https://sharp.pixelplumbing.com/install
`.trim();
}
