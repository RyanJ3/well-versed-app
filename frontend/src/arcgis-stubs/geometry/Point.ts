export default class Point {
  longitude: number;
  latitude: number;
  constructor(options: any = {}) {
    this.longitude = options.longitude ?? 0;
    this.latitude = options.latitude ?? 0;
  }
}
