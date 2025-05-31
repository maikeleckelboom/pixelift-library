import { BaseSequencer, TestSpecification } from 'vitest/node';

const fileNameIdentifier = 'snapshot.test.ts' as const;

export default class SnapshotLastSequencer extends BaseSequencer {
  async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    return [...files].sort((a, b) => {
      const aPath = a.moduleId;
      const bPath = b.moduleId;
      const isA = aPath.endsWith(fileNameIdentifier);
      const isB = bPath.endsWith(fileNameIdentifier);
      if (isA && !isB) return 1;
      if (!isA && isB) return -1;
      return aPath.localeCompare(bPath);
    });
  }
}
