declare module 'dom-to-image-more' {
  interface Options {
    quality?: number;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: any;
    filter?: (node: any) => boolean;
    imagePlaceholder?: string;
    cacheBust?: boolean;
  }

  export function toPng(node: HTMLElement, options?: Options): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
  export function toSvg(node: HTMLElement, options?: Options): Promise<string>;
  export function toCanvas(node: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
  export function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;
} 