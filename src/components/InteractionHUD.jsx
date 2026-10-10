export default function InteractionHUD({
  interactionMode,
  currentShape,
  cameraStatus,
  gestureState,
  gestureEvent,
  switchCountdown,
  onRecalibrate,
}) {
  const rightHand = gestureState.right
  const activeGesture = rightHand?.isPinching
    ? 'Pinching'
    : rightHand?.isOpenPalm
      ? 'Open palm'
      : rightHand?.isFist
        ? 'Fist'
        : 'Waiting for gesture'

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 252,
      width: 250,
      padding: 14,
      color: '#fff',
      background: 'rgba(0, 0, 0, 0.72)',
      border: '1px solid rgba(0, 255, 204, 0.35)',
      borderRadius: 12,
      fontSize: 12,
      pointerEvents: 'auto',
    }}>
      <div style={{ color: '#00ffcc', fontWeight: 'bold', marginBottom: 8 }}>AETHERBUILD</div>
      <div>Mode: <strong>{interactionMode}</strong></div>
      <div>Shape: <strong>{currentShape}</strong></div>
      <div>Gesture: <strong>{activeGesture}</strong></div>
      <div>Tracking: <strong style={{ color: cameraStatus === 'error' ? '#ff5577' : '#00ffcc' }}>{cameraStatus}</strong></div>
      {gestureEvent && <div style={{ marginTop: 6, color: '#ffcc00' }}>Event: {gestureEvent}</div>}
      {switchCountdown && <div style={{ marginTop: 6 }}>Switching mode in {switchCountdown}…</div>}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button type="button" onClick={onRecalibrate} style={buttonStyle}>Recalibrate</button>
      </div>
      <div style={{ marginTop: 8, opacity: 0.7 }}>Use the mouse as a fallback whenever tracking is uncertain.</div>
    </div>
  )
}

const buttonStyle = {
  background: 'transparent',
  color: '#00ffcc',
  border: '1px solid #00ffcc',
  borderRadius: 4,
  padding: '4px 7px',
  cursor: 'pointer',
}
