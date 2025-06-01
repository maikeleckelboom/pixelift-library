import { BrowserPoolError, BrowserPoolErrors } from '@/browser/decoders/canvas/pool/errors';
import type { Pool, Task } from '@/browser/decoders/canvas/pool/types';

interface TaskNode {
  task: Task;
  next: TaskNode | null;
  cleanup: () => void;
}

export class CanvasPool implements Pool {
  private pool: OffscreenCanvas[] = [];
  private allocatedCanvases = new Set<OffscreenCanvas>();
  private queuedTasksHead: TaskNode | null = null;
  private queuedTasksTail: TaskNode | null = null;
  private readonly queueMaxSize: number;
  private currentQueueSizeInternal: number = 0;

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly maxSize: number = 4,
    queueMaxSizeParam: number = 100
  ) {
    if (maxSize <= 0) {
      throw new BrowserPoolError.ModuleError('INVALID_MAX_SIZE');
    }
    if (width <= 0 || height <= 0) {
      throw new BrowserPoolError.ModuleError('INVALID_DIMENSIONS');
    }
    if (queueMaxSizeParam <= 0) {
      throw new BrowserPoolError.ModuleError('INVALID_QUEUE_MAX_SIZE');
    }

    this.queueMaxSize = queueMaxSizeParam;
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
      try {
        const canvas = new OffscreenCanvas(this.width, this.height);
        this.pool.push(canvas);
        this.allocatedCanvases.add(canvas);
        return Promise.resolve(canvas);
      } catch (error) {
        return Promise.reject(
          new BrowserPoolError.ModuleError('CREATION_FAILURE', { cause: error })
        );
      }
    }

    return new Promise<OffscreenCanvas>((resolve, reject) => {
      const onAbort = () => {
        this.removeNode(node);
        reject(BrowserPoolErrors.OPERATION_ABORTED);
      };

      const node: TaskNode = {
        task: { resolve, reject, signal },
        next: null,
        cleanup: () => signal?.removeEventListener('abort', onAbort)
      };

      if (this.currentQueueSizeInternal >= this.queueMaxSize) {
        node.cleanup();
        reject(new BrowserPoolError.ModuleError('QUEUE_FULL'));
        return;
      }

      this.enqueueNode(node);

      if (signal?.aborted) {
        onAbort();
      } else if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }

  release(canvas: OffscreenCanvas): void {
    if (!this.allocatedCanvases.has(canvas)) {
      throw new BrowserPoolError.ModuleError('RELEASE_UNACQUIRED');
    }

    let canvasToUseForNextTask = canvas;

    if (canvas.width !== this.width || canvas.height !== this.height) {
      this.destroyCanvasResources(canvas);
      this.pool = this.pool.filter((c) => c !== canvas);

      try {
        const newCanvas = new OffscreenCanvas(this.width, this.height);
        this.pool.push(newCanvas);
        canvasToUseForNextTask = newCanvas;
      } catch (error) {
        this.allocatedCanvases.delete(canvas);
        throw new BrowserPoolError.ModuleError('RECREATION_FAILURE', { cause: error });
      }
    }

    this.allocatedCanvases.delete(canvas);

    if (this.queuedTasksHead) {
      const node = this.queuedTasksHead;
      this.dequeueHead();
      node.cleanup();

      if (node.task.signal?.aborted) {
        node.task.reject(BrowserPoolErrors.OPERATION_ABORTED);
      } else {
        this.allocatedCanvases.add(canvasToUseForNextTask);
        node.task.resolve(canvasToUseForNextTask);
      }
      return;
    }
  }

  dispose(): void {
    this.pool.forEach((canvas) => this.destroyCanvasResources(canvas));
    this.pool = [];
    this.allocatedCanvases.clear();

    let currentNode = this.queuedTasksHead;
    this.queuedTasksHead = null;
    this.queuedTasksTail = null;
    this.currentQueueSizeInternal = 0;

    while (currentNode) {
      const nextNode = currentNode.next;
      currentNode.cleanup();
      currentNode.task.reject(new BrowserPoolError.ModuleError('POOL_DISPOSED'));
      currentNode = nextNode;
    }
  }

  private enqueueNode(node: TaskNode): void {
    if (this.queuedTasksTail) {
      this.queuedTasksTail.next = node;
      this.queuedTasksTail = node;
    } else {
      this.queuedTasksHead = node;
      this.queuedTasksTail = node;
    }
    this.currentQueueSizeInternal++;
  }

  private dequeueHead(): void {
    if (!this.queuedTasksHead) return;

    this.queuedTasksHead = this.queuedTasksHead.next;
    if (!this.queuedTasksHead) {
      this.queuedTasksTail = null;
    }
    this.currentQueueSizeInternal--;
  }

  private removeNode(target: TaskNode): void {
    target.cleanup();

    if (!this.queuedTasksHead) return;

    let unlinked = false;
    if (this.queuedTasksHead === target) {
      this.queuedTasksHead = this.queuedTasksHead.next;
      if (!this.queuedTasksHead) {
        this.queuedTasksTail = null;
      }
      unlinked = true;
    } else {
      let prev = this.queuedTasksHead;
      while (prev.next && prev.next !== target) {
        prev = prev.next;
      }

      if (prev.next === target) {
        prev.next = target.next;
        if (target === this.queuedTasksTail) {
          this.queuedTasksTail = prev;
        }
        unlinked = true;
      }
    }

    if (unlinked) {
      this.currentQueueSizeInternal--;
    }
  }

  private destroyCanvasResources(canvas: OffscreenCanvas): void {
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.width = 1;
      canvas.height = 1;
    } catch {
      // Optionally, log this error but do not throw.
    }
  }
}
