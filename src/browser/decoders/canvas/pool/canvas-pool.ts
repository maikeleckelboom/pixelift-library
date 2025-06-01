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
  private queueMaxSize = 100;

  // TODO: Add metrics tracking properties
  // private recreations = 0;
  // private allocations = 0;
  // private releases = 0;
  // private queueMaxSize = 0;
  // private errors = {
  //   creation: 0,
  //   recreation: 0,
  //   release: 0,
  //   abort: 0,
  //   queueFull: 0
  // };

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly maxSize: number = 4
  ) {
    if (maxSize <= 0) {
      // TODO: Track error: this.errors.creation++;
      throw new BrowserPoolError.ModuleError('INVALID_MAX_SIZE');
    }
    if (width <= 0 || height <= 0) {
      // TODO: Track error: this.errors.creation++;
      throw new BrowserPoolError.ModuleError('INVALID_DIMENSIONS');
    }
  }

  acquire(signal?: AbortSignal): Promise<OffscreenCanvas> {
    if (signal?.aborted) {
      // TODO: Track abort: this.errors.abort++;
      return Promise.reject(BrowserPoolErrors.OPERATION_ABORTED);
    }

    const available = this.pool.find((canvas) => !this.allocatedCanvases.has(canvas));
    if (available) {
      this.allocatedCanvases.add(available);
      // TODO: Track allocation: this.allocations++;
      return Promise.resolve(available);
    }

    if (this.pool.length < this.maxSize) {
      try {
        const canvas = new OffscreenCanvas(this.width, this.height);
        this.pool.push(canvas);
        this.allocatedCanvases.add(canvas);
        // TODO: Track allocation: this.allocations++;
        return Promise.resolve(canvas);
      } catch (error) {
        // TODO: Track error: this.errors.creation++;
        return Promise.reject(new BrowserPoolError.ModuleError('CREATION_FAILURE'));
      }
    }

    return new Promise<OffscreenCanvas>((resolve, reject) => {
      const onAbort = () => {
        this.removeNode(node);
        // TODO: Track abort: this.errors.abort++;
        reject(BrowserPoolErrors.OPERATION_ABORTED);
      };

      const node: TaskNode = {
        task: { resolve, reject, signal },
        next: null,
        cleanup: () => signal?.removeEventListener('abort', onAbort)
      };

      // TODO: Implement queue size check before enqueuing
      // if (this.getQueueSize() >= this.maxQueue) {
      //   node.cleanup();
      //   // TODO: Track error: this.errors.queueFull++;
      //   reject(new BrowserPoolError.ModuleError('QUEUE_FULL'));
      //   return;
      // }

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
      // TODO: Track error: this.errors.release++;
      throw new BrowserPoolError.ModuleError('RELEASE_UNACQUIRED');
    }

    if (canvas.width !== this.width || canvas.height !== this.height) {
      // TODO: Destroy canvas resources before removal
      // this.destroyCanvasResources(canvas);

      this.pool = this.pool.filter((c) => c !== canvas);
      this.allocatedCanvases.delete(canvas);

      try {
        const newCanvas = new OffscreenCanvas(this.width, this.height);
        this.pool.push(newCanvas);
        canvas = newCanvas;
        // TODO: Track recreation: this.recreations++;
      } catch (error) {
        // TODO: Track error: this.errors.recreation++;
        throw new BrowserPoolError.ModuleError('RECREATION_FAILURE', { cause: error });
      }
    }

    this.allocatedCanvases.delete(canvas);
    // TODO: Track release: this.releases++;

    while (this.queuedTasksHead) {
      const node = this.queuedTasksHead;
      this.dequeueHead();
      node.cleanup();

      if (node.task.signal?.aborted) {
        // TODO: Track abort: this.errors.abort++;
        node.task.reject(BrowserPoolErrors.OPERATION_ABORTED);
        continue;
      }

      this.allocatedCanvases.add(canvas);
      // TODO: Track allocation: this.allocations++;
      node.task.resolve(canvas);
      return;
    }
  }

  dispose(): void {
    // TODO: Destroy all canvas resources
    // this.pool.forEach(canvas => this.destroyCanvasResources(canvas));

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

  private enqueueNode(node: TaskNode): void {
    // TODO: Implement queue size check (moved to acquire)
    // if (this.queueSize >= this.maxQueue) {
    //   node.cleanup();
    //   node.task.reject(BrowserPoolErrors.QUEUE_FULL);
    //   return;
    // }

    if (this.queuedTasksTail) {
      this.queuedTasksTail.next = node;
      this.queuedTasksTail = node;
    } else {
      this.queuedTasksHead = node;
      this.queuedTasksTail = node;
    }

    // TODO: Update queue metrics
    // const currentSize = this.getQueueSize();
    // if (currentSize > this.queueMaxSize) {
    //   this.queueMaxSize = currentSize;
    // }
  }

  private dequeueHead(): void {
    if (!this.queuedTasksHead) return;
    this.queuedTasksHead = this.queuedTasksHead.next;
    if (!this.queuedTasksHead) {
      this.queuedTasksTail = null;
    }

    // TODO: Update queue size metric
    // this.metrics.queueCurrentSize = this.getQueueSize();
  }

  private removeNode(target: TaskNode): void {
    target.cleanup();

    if (!this.queuedTasksHead) return;

    if (this.queuedTasksHead === target) {
      this.dequeueHead();
      return;
    }

    let prev = this.queuedTasksHead;
    while (prev.next && prev.next !== target) {
      prev = prev.next;
    }

    if (prev.next === target) {
      prev.next = target.next;
      if (target === this.queuedTasksTail) {
        this.queuedTasksTail = prev;
      }
    }

    // TODO: Update queue size metric
    // this.metrics.queueCurrentSize = this.getQueueSize();
  }

  // TODO: Implement canvas resource destruction
  // private destroyCanvasResources(canvas: OffscreenCanvas): void {
  //   try {
  //     const ctx = canvas.getContext('2d');
  //     if (ctx) {
  //       ctx.reset();
  //       ctx.clearRect(0, 0, canvas.width, canvas.height);
  //       if ('commit' in ctx) (ctx as any).commit();
  //       if ('dispose' in ctx) (ctx as any).dispose();
  //     }
  //     const channel = new MessageChannel();
  //     channel.port1.postMessage(canvas, [canvas]);
  //     channel.port1.close();
  //   } catch (e) {
  //     console.warn('Canvas cleanup failed', e);
  //   }
  // }

  // TODO: Implement queue size calculation
  // private getQueueSize(): number {
  //   let count = 0;
  //   let node = this.queuedTasksHead;
  //   while (node) {
  //     count++;
  //     node = node.next;
  //   }
  //   return count;
  // }

  // TODO: Add warmup method
  // async warmup(count: number = this.maxSize): Promise<void> {
  //   const toCreate = Math.min(count, this.maxSize - this.pool.length);
  //   const promises = [];
  //   for (let i = 0; i < toCreate; i++) {
  //     promises.push(
  //       new Promise<void>((resolve, reject) => {
  //         try {
  //           this.pool.push(new OffscreenCanvas(this.width, this.height));
  //           resolve();
  //         } catch (error) {
  //           reject(error);
  //         }
  //       })
  //     );
  //   }
  //   await Promise.all(promises);
  // }

  // TODO: Add metrics getter
  // get metrics() {
  //   return {
  //     totalCanvases: this.pool.length,
  //     allocated: this.allocatedCanvases.size,
  //     recreations: this.recreations,
  //     allocations: this.allocations,
  //     releases: this.releases,
  //     queueCurrentSize: this.getQueueSize(),
  //     queueMaxSize: this.queueMaxSize,
  //     errors: {...this.errors}
  //   };
  // }
}
