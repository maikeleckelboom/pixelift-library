import { BrowserPoolError, BrowserPoolErrors } from '@/browser/decoders/canvas/pool/errors';
import type { Pool, Task } from '@/browser/decoders/canvas/pool/types';

interface TaskNode {
  task: Task;
  prev: TaskNode | null;
  next: TaskNode | null;
  cleanup: () => void;
}

export class CanvasPool implements Pool {
  private pool: OffscreenCanvas[] = [];
  private allocatedCanvases = new Set<OffscreenCanvas>();
  private queuedTasksHead: TaskNode | null = null;
  private queuedTasksTail: TaskNode | null = null;

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly maxSize: number = 4
  ) {
    if (maxSize <= 0) throw new BrowserPoolError.ModuleError('INVALID_MAX_SIZE');
    if (width <= 0 || height <= 0)
      throw new BrowserPoolError.ModuleError('INVALID_DIMENSIONS');
  }

  acquire(signal?: AbortSignal): Promise<OffscreenCanvas> {
    if (signal?.aborted) {
      return Promise.reject(BrowserPoolErrors.OPERATION_ABORTED);
    }

    const available = this.pool.find((canvas) => !this.allocatedCanvases.has(canvas));
    if (available) {
      this.allocatedCanvases.add(available);
      return Promise.resolve(available);
    }

    if (this.pool.length < this.maxSize) {
      const canvas = new OffscreenCanvas(this.width, this.height);
      this.pool.push(canvas);
      this.allocatedCanvases.add(canvas);
      return Promise.resolve(canvas);
    }

    return new Promise((resolve, reject) => {
      const onAbort = () => {
        this.removeNode(node);
        reject(BrowserPoolErrors.OPERATION_ABORTED);
      };

      const node: TaskNode = {
        task: { resolve, reject, signal },
        prev: null,
        next: null,
        cleanup: () => signal?.removeEventListener('abort', onAbort)
      };

      this.appendNode(node);
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  release(canvas: OffscreenCanvas): void {
    if (!this.allocatedCanvases.has(canvas)) {
      throw new BrowserPoolError.ModuleError('RELEASE_UNACQUIRED');
    }

    this.allocatedCanvases.delete(canvas);

    let currentNode = this.queuedTasksHead;
    while (currentNode) {
      const nextNode = currentNode.next;
      this.removeNode(currentNode);
      currentNode.cleanup();

      if (!currentNode.task.signal?.aborted) {
        this.allocatedCanvases.add(canvas);
        currentNode.task.resolve(canvas);
        return;
      }

      currentNode.task.reject(BrowserPoolErrors.OPERATION_ABORTED);
      currentNode = nextNode;
    }
  }

  dispose(): void {
    this.pool = [];
    this.allocatedCanvases.clear();

    let currentNode = this.queuedTasksHead;
    this.queuedTasksHead = null;
    this.queuedTasksTail = null;

    while (currentNode) {
      const nextNode = currentNode.next;
      currentNode.cleanup();
      currentNode.task.reject(new BrowserPoolError.ModuleError('POOL_DISPOSED'));
      currentNode = nextNode;
    }
  }

  private appendNode(node: TaskNode): void {
    if (this.queuedTasksTail) {
      this.queuedTasksTail.next = node;
      node.prev = this.queuedTasksTail;
      this.queuedTasksTail = node;
    } else {
      this.queuedTasksHead = node;
      this.queuedTasksTail = node;
    }
  }

  private removeNode(node: TaskNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.queuedTasksHead = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.queuedTasksTail = node.prev;
    }
  }
}
