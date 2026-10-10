const SIGNALS = ['isPinching', 'isOpenPalm', 'isFist', 'isVictory', 'isThumbsUp']

export class GestureController {
  constructor({ holdFrames = 3 } = {}) {
    this.holdFrames = holdFrames
    this.hands = new Map()
  }

  update(hand, gesture) {
    const previous = this.hands.get(hand) || {
      stable: {},
      candidates: {},
      counts: {},
    }
    const events = []
    const stable = { ...previous.stable }

    SIGNALS.forEach((signal) => {
      const nextValue = Boolean(gesture?.[signal])
      if (previous.candidates[signal] !== nextValue) {
        previous.candidates[signal] = nextValue
        previous.counts[signal] = 1
      } else {
        previous.counts[signal] = (previous.counts[signal] || 0) + 1
      }

      if (previous.counts[signal] >= this.holdFrames && stable[signal] !== nextValue) {
        stable[signal] = nextValue
        events.push(`${signal}${nextValue ? 'Start' : 'End'}`)
      }
    })

    previous.stable = stable
    this.hands.set(hand, previous)

    return {
      gesture: gesture ? { ...gesture, ...stable } : null,
      events,
    }
  }

  reset(hand) {
    if (hand) this.hands.delete(hand)
    else this.hands.clear()
  }
}
