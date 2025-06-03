import { bench, describe } from 'vitest';
import { decode } from '@/browser';
import { TestImages } from '@test/fixtures/images';

// Configuration
const BENCHMARK_CONFIG = {
  concurrency: {
    light: 3,
    moderate: 5,
    heavy: 10,
    extreme: 16,
    stress: 32
  },
  resize: {
    thumbnail: { width: 32, height: 32, fit: 'cover' as const },
    small: { width: 128, height: 128, fit: 'cover' as const },
    medium: { width: 256, height: 256, fit: 'contain' as const }
  },
  iterations: {
    standard: 50,
    stress: 100,
    endurance: 500
  }
} as const;

// Utilities
const createBenchmarkName = (
  operation: string,
  asset: { id: string; format: string },
  variant?: string
): string => {
  const base = `${operation}(${asset.format}/${asset.id})`;
  return variant ? `${base} [${variant}]` : base;
};

const createConcurrencyTest =
  (concurrency: number) =>
  <T>(fn: () => Promise<T>) =>
    Promise.all(Array.from({ length: concurrency }, fn));

// Test Data Preparation
const testSets = {
  representative: TestImages.oneOfEach(),
  comprehensive: TestImages.all(),
  stress: TestImages.stress(),
  referenceAsset: TestImages.get('medium', 'jpeg')
} as const;

describe('Image Decode Performance Suite', () => {
  describe('Core Decode Operations', () => {
    // Single format baseline performance
    for (const asset of testSets.representative) {
      bench(createBenchmarkName('decode', asset), async () => {
        const blob = await asset.asBlob();
        await decode(blob);
      });
    }

    // Input format comparison (Blob vs ArrayBuffer)
    const { referenceAsset } = testSets;

    bench(createBenchmarkName('decode', referenceAsset, 'blob input'), async () => {
      const blob = await referenceAsset.asBlob();
      await decode(blob);
    });

    bench(createBenchmarkName('decode', referenceAsset, 'arrayBuffer input'), async () => {
      const buffer = await referenceAsset.asArrayBuffer();
      await decode(buffer);
    });
  });

  describe('Resize Operations', () => {
    // Resize performance across different target sizes
    for (const [sizeLabel, resizeOptions] of Object.entries(BENCHMARK_CONFIG.resize)) {
      for (const asset of testSets.representative) {
        bench(
          createBenchmarkName('decode+resize', asset, `${sizeLabel} ${resizeOptions.fit}`),
          async () => {
            const blob = await asset.asBlob();
            await decode(blob, { resize: resizeOptions });
          }
        );
      }
    }
  });

  describe('Concurrency Performance', () => {
    // Test different concurrency levels for decode operations
    for (const [level, concurrency] of Object.entries(BENCHMARK_CONFIG.concurrency)) {
      const concurrentDecode = createConcurrencyTest(concurrency);

      // Only test higher concurrency on fastest format to avoid excessive test time
      if (concurrency > 10) {
        const fastestAsset = testSets.representative.find(
          (asset) => asset.format === 'jpeg'
        );
        if (fastestAsset) {
          bench(
            createBenchmarkName(
              'decode',
              fastestAsset,
              `${level} concurrency (${concurrency}x)`
            ),
            async () => {
              const blob = await fastestAsset.asBlob();
              await concurrentDecode(() => decode(blob));
            }
          );
        }
      } else {
        // Test all formats for lower concurrency levels
        for (const asset of testSets.representative) {
          bench(
            createBenchmarkName('decode', asset, `${level} concurrency (${concurrency}x)`),
            async () => {
              const blob = await asset.asBlob();
              await concurrentDecode(() => decode(blob));
            }
          );
        }
      }
    }

    // Concurrency with resize operations
    for (const [level, concurrency] of Object.entries(BENCHMARK_CONFIG.concurrency)) {
      const concurrentDecode = createConcurrencyTest(concurrency);
      const resizeOptions = BENCHMARK_CONFIG.resize.thumbnail;

      bench(
        createBenchmarkName(
          'decode+resize',
          testSets.referenceAsset,
          `${level} concurrency (${concurrency}x) thumbnail`
        ),
        async () => {
          const blob = await testSets.referenceAsset.asBlob();
          await concurrentDecode(() => decode(blob, { resize: resizeOptions }));
        }
      );
    }
  });

  describe('Stress & Edge Cases', () => {
    // Multi-format batch processing
    bench(
      'decode(batch) - all representative formats',
      async () => {
        const decodePromises = testSets.representative.map(async (asset) => {
          const blob = await asset.asBlob();
          return decode(blob);
        });
        await Promise.all(decodePromises);
      },
      { iterations: BENCHMARK_CONFIG.iterations.standard }
    );

    // High-volume stress test
    bench(
      'decode(stress) - comprehensive format coverage',
      async () => {
        const decodePromises = testSets.stress.map(async (asset) => {
          const blob = await asset.asBlob();
          return decode(blob);
        });
        await Promise.all(decodePromises);
      },
      {
        iterations: BENCHMARK_CONFIG.iterations.stress,
        warmupIterations: 10
      }
    );

    // Memory pressure test (sequential processing to avoid OOM)
    bench(
      'decode(endurance) - sequential memory pressure',
      async () => {
        for (const asset of testSets.comprehensive) {
          const blob = await asset.asBlob();
          await decode(blob);
        }
      },
      {
        iterations: 10, // Lower iterations due to sequential nature
        warmupIterations: 2
      }
    );
  });

  describe('Performance Regression Detection', () => {
    // Consistent baseline for regression detection
    const regressionAsset = testSets.referenceAsset;

    bench(
      'decode(baseline) - regression detector',
      async () => {
        const blob = await regressionAsset.asBlob();
        await decode(blob);
      },
      { iterations: BENCHMARK_CONFIG.iterations.endurance }
    );

    // Complex operation baseline
    bench(
      'decode+resize(baseline) - complex operation regression',
      async () => {
        const blob = await regressionAsset.asBlob();
        await decode(blob, { resize: BENCHMARK_CONFIG.resize.medium });
      },
      { iterations: BENCHMARK_CONFIG.iterations.standard }
    );
  });

  describe('Scalability Analysis', () => {
    // Test how performance scales with different load patterns
    const scalabilityTests = [
      { name: 'light load', assets: testSets.representative.slice(0, 2) },
      { name: 'moderate load', assets: testSets.representative },
      { name: 'heavy load', assets: testSets.comprehensive.slice(0, 10) }
    ];

    for (const { name, assets } of scalabilityTests) {
      bench(`decode(scalability) - ${name} (${assets.length} assets)`, async () => {
        const decodePromises = assets.map(async (asset) => {
          const blob = await asset.asBlob();
          return decode(blob);
        });
        await Promise.all(decodePromises);
      });
    }
  });
});
