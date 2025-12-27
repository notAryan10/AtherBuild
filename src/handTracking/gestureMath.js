export function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
}

export function getHandCenter(landmarks) {
  const wrist = landmarks[0]
  const index = landmarks[8]
  const middle = landmarks[12]

  return {
    x: (wrist.x + index.x + middle.x) / 3,
    y: (wrist.y + index.y + middle.y) / 3,
    z: (wrist.z + index.z + middle.z) / 3,
  }
}


export function detectGestures(landmarks) {
  const handCenter = getHandCenter(landmarks)

  const isOpenPalm = landmarks[8].y < landmarks[5].y && landmarks[12].y < landmarks[9].y && landmarks[16].y < landmarks[13].y && landmarks[20].y < landmarks[17].y

  const isFist = landmarks[8].y > landmarks[5].y && landmarks[12].y > landmarks[9].y && landmarks[16].y > landmarks[13].y && landmarks[20].y > landmarks[17].y

  const pinchDistance = distance(landmarks[4], landmarks[8])
  const isPinching = pinchDistance < 0.06

  const indexUp = landmarks[8].y < landmarks[6].y
  const middleUp = landmarks[12].y < landmarks[10].y
  const ringDown = landmarks[16].y > landmarks[14].y
  const pinkyDown = landmarks[20].y > landmarks[18].y

  const isVictory = indexUp && middleUp && ringDown && pinkyDown

  return { isOpenPalm, isFist, isPinching, isVictory, pinchDistance, handCenter }
}
