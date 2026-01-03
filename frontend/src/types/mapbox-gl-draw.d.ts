declare module '@mapbox/mapbox-gl-draw' {
  import type { IControl } from 'maplibre-gl'

  interface DrawOptions {
    displayControlsDefault?: boolean
    controls?: {
      point?: boolean
      line_string?: boolean
      polygon?: boolean
      trash?: boolean
      combine_features?: boolean
      uncombine_features?: boolean
    }
    touchEnabled?: boolean
    touchBuffer?: number
    clickBuffer?: number
    boxSelect?: boolean
    styles?: object[]
  }

  interface DrawFeatureCollection {
    type: 'FeatureCollection'
    features: GeoJSON.Feature[]
  }

  class MapboxDraw implements IControl {
    constructor(options?: DrawOptions)
    onAdd(map: maplibregl.Map): HTMLElement
    onRemove(): void
    changeMode(mode: string, options?: object): void
    getAll(): DrawFeatureCollection
    deleteAll(): void
    delete(ids: string | string[]): void
    set(featureCollection: DrawFeatureCollection): string[]
    add(feature: GeoJSON.Feature): string[]
  }

  export default MapboxDraw
}
