import { bench } from 'vitest';
import { decode } from '@/node';
import { TestImages } from '@test/fixtures/images';

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

describe('Image Decode Performance Suite (Node.js Buffer)', () => {
  describe('Core Decode Operations', () => {
    // Single format baseline performance with Buffer input
    for (const asset of testSets.representative) {
      bench(createBenchmarkName('decode', asset), async () => {
        const buffer = await asset.asBuffer();
        await decode(buffer);
      });
    }

    const { referenceAsset } = testSets;

    bench(createBenchmarkName('decode', referenceAsset, 'buffer input'), async () => {
      const buffer = await referenceAsset.asBuffer();
      await decode(buffer);
    });

    bench(createBenchmarkName('decode', referenceAsset, 'arrayBuffer input'), async () => {
      const arrayBuffer = await referenceAsset.asArrayBuffer();
      await decode(arrayBuffer);
    });

    bench(createBenchmarkName('decode', referenceAsset, 'blob input'), async () => {
      const blob = await referenceAsset.asBlob();
      await decode(blob);
    });
  });

  describe('Resize Operations', () => {
    // Resize performance across different target sizes with Buffer input
    for (const [sizeLabel, resizeOptions] of Object.entries(BENCHMARK_CONFIG.resize)) {
      for (const asset of testSets.representative) {
        bench(
          createBenchmarkName('decode+resize', asset, `${sizeLabel} ${resizeOptions.fit}`),
          async () => {
            const buffer = await asset.asBuffer();
            await decode(buffer, { resize: resizeOptions });
          }
        );
      }
    }
  });

  describe('Concurrency Performance', () => {
    // Test different concurrency levels for decode operations with Buffer
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
              const buffer = await fastestAsset.asBuffer();
              await concurrentDecode(() => decode(buffer));
            }
          );
        }
      } else {
        // Test all formats for lower concurrency levels
        for (const asset of testSets.representative) {
          bench(
            createBenchmarkName('decode', asset, `${level} concurrency (${concurrency}x)`),
            async () => {
              const buffer = await asset.asBuffer();
              await concurrentDecode(() => decode(buffer));
            }
          );
        }
      }
    }

    // Concurrency with resize operations using Buffer
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
          const buffer = await testSets.referenceAsset.asBuffer();
          await concurrentDecode(() => decode(buffer, { resize: resizeOptions }));
        }
      );
    }
  });

  describe('Stress & Edge Cases', () => {
    // Multi-format batch processing with Buffer
    bench(
      'decode(batch) - all representative formats',
      async () => {
        const decodePromises = testSets.representative.map(async (asset) => {
          const buffer = await asset.asBuffer();
          return decode(buffer);
        });
        await Promise.all(decodePromises);
      },
      { iterations: BENCHMARK_CONFIG.iterations.standard }
    );

    // High-volume stress test with Buffer
    bench(
      'decode(stress) - comprehensive format coverage',
      async () => {
        const decodePromises = testSets.stress.map(async (asset) => {
          const buffer = await asset.asBuffer();
          return decode(buffer);
        });
        await Promise.all(decodePromises);
      },
      {
        iterations: BENCHMARK_CONFIG.iterations.stress,
        warmupIterations: 10
      }
    );

    // Memory pressure test (sequential processing to avoid OOM) with Buffer
    bench(
      'decode(endurance) - sequential memory pressure',
      async () => {
        for (const asset of testSets.comprehensive) {
          const buffer = await asset.asBuffer();
          await decode(buffer);
        }
      },
      {
        iterations: 10, // Lower iterations due to sequential nature
        warmupIterations: 2
      }
    );
  });

  describe('Performance Regression Detection', () => {
    // Consistent baseline for regression detection with Buffer
    const regressionAsset = testSets.referenceAsset;

    bench(
      'decode(baseline) - regression detector',
      async () => {
        const buffer = await regressionAsset.asBuffer();
        await decode(buffer);
      },
      { iterations: BENCHMARK_CONFIG.iterations.endurance }
    );

    // Complex operation baseline with Buffer
    bench(
      'decode+resize(baseline) - complex operation regression',
      async () => {
        const buffer = await regressionAsset.asBuffer();
        await decode(buffer, { resize: BENCHMARK_CONFIG.resize.medium });
      },
      { iterations: BENCHMARK_CONFIG.iterations.standard }
    );
  });

  describe('Scalability Analysis', () => {
    // Test how performance scales with different load patterns using Buffer
    const scalabilityTests = [
      { name: 'light load', assets: testSets.representative.slice(0, 2) },
      { name: 'moderate load', assets: testSets.representative },
      { name: 'heavy load', assets: testSets.comprehensive.slice(0, 10) }
    ];

    for (const { name, assets } of scalabilityTests) {
      bench(`decode(scalability) - ${name} (${assets.length} assets)`, async () => {
        const decodePromises = assets.map(async (asset) => {
          const buffer = await asset.asBuffer();
          return decode(buffer);
        });
        await Promise.all(decodePromises);
      });
    }
  });

  describe('Node.js Specific Optimizations', () => {
    // Test Buffer vs other input types performance
    const testAsset = testSets.referenceAsset;

    bench('decode(buffer-perf) - Buffer vs ArrayBuffer comparison', async () => {
      const buffer = await testAsset.asBuffer();
      const arrayBuffer = await testAsset.asArrayBuffer();

      // Test both in the same benchmark to compare overhead
      await Promise.all([decode(buffer), decode(arrayBuffer)]);
    });

    // Test Buffer reuse vs recreation
    bench('decode(buffer-reuse) - Buffer reuse pattern', async () => {
      const buffer = await testAsset.asBuffer();

      // Simulate buffer reuse pattern common in Node.js
      await Promise.all([decode(buffer), decode(buffer), decode(buffer)]);
    });

    // Test with different Buffer allocation patterns
    bench('decode(buffer-allocation) - Direct Buffer allocation', async () => {
      const arrayBuffer = await testAsset.asArrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await decode(buffer);
    });
  });
});
