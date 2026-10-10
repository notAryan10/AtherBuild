export class Calibration {
  constructor() {
    this.neutral = null
    this.sensitivity = 1
  }

  calibrate(point) {
    if (!point) return
    this.neutral = { x: point.x, y: point.y, z: point.z || 0 }
  }

  setSensitivity(value) {
    this.sensitivity = Math.min(Math.max(value, 0.5), 2)
  }

  adjust(point) {
    if (!this.neutral) return point
    return {
      x: 0.5 + (point.x - this.neutral.x) * this.sensitivity,
      y: 0.5 + (point.y - this.neutral.y) * this.sensitivity,
      z: (point.z - this.neutral.z) * this.sensitivity,
    }
  }
}
