import { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export default function HandTracker() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const SIZE = 320

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`, })

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    })

    hands.onResults((results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!results.multiHandLandmarks) return

      results.multiHandLandmarks.forEach((landmarks) => {
        landmarks.forEach((point) => {
          const x = point.x * canvas.width
          const y = point.y * canvas.height

          ctx.beginPath()
          ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.fillStyle = "#00ffcc"
          ctx.fill()
        })

        CONNECTIONS.forEach(([start, end]) => {
          const p1 = landmarks[start]
          const p2 = landmarks[end]

          ctx.beginPath()
          ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height)
          ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height)
          ctx.strokeStyle = "#00ffcc"
          ctx.lineWidth = 2
          ctx.stroke()
        })
      })
    })

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video })
      }, width: 640, height: 480,
    })

    camera.start()
  }, [])

  return (
    <>

    <video ref={videoRef} autoPlay playsInline style={{ position: "absolute", top: 10, right: 10, width: SIZE, height: SIZE * 0.75, transform: "scaleX(-1)", borderRadius: 8 }} />

    <canvas ref={canvasRef} style={{ position: "absolute", top: 10, right: 10, width: SIZE, height: SIZE * 0.75, pointerEvents: "none", transform: "scaleX(-1)" }} />

    </>
  );
}