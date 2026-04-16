declare module 'dom-to-image-more' {
  interface Options {
    scale?: number
    width?: number
    height?: number
    style?: Partial<CSSStyleDeclaration>
    filter?: (node: Node) => boolean
    bgcolor?: string
    quality?: number
  }

  function toBlob(node: Node, options?: Options): Promise<Blob>
  function toPng(node: Node, options?: Options): Promise<string>
  function toJpeg(node: Node, options?: Options): Promise<string>
  function toSvg(node: Node, options?: Options): Promise<string>
  function toCanvas(node: Node, options?: Options): Promise<HTMLCanvasElement>
  function toPixelData(node: Node, options?: Options): Promise<Uint8ClampedArray>

  export { toBlob, toPng, toJpeg, toSvg, toCanvas, toPixelData }
}
