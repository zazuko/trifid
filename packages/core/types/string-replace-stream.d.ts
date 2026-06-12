declare module 'string-replace-stream' {
  import type { Transform } from 'node:stream';

  /**
   * Create a Transform stream that replaces occurrences of `find` with
   * `replace` in the streamed content.
   */
  export default function replaceStream(find: string, replace: string): Transform;
}
