import { BaseSequencer, TestSpecification } from 'vitest/node';

export const snapshotFileNameIdentifier = 'compare.snapshot.test.ts' as const;

export default class SnapshotLastSequencer extends BaseSequencer {
  async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    return [...files].sort((a, b) => {
      const aPath = a.moduleId;
      const bPath = b.moduleId;
      const isA = aPath.endsWith(snapshotFileNameIdentifier);
      const isB = bPath.endsWith(snapshotFileNameIdentifier);
      if (isA && !isB) return 1;
      if (!isA && isB) return -1;
      return aPath.localeCompare(bPath);
    });
  }
}
