declare module 'through2' {
  import type { Transform } from 'node:stream';

  type Through2Callback = (error?: Error | null, data?: unknown) => void;
  type TransformFunction = (chunk: any, encoding: string, callback: Through2Callback) => void;

  interface Through2 {
    obj(transform: TransformFunction): Transform;
  }

  const through2: Through2;
  export default through2;
}
