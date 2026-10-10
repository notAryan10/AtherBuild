export default function CameraPanel({
  videoRef,
  canvasRef,
  videoStyle,
  canvasStyle,
  cameraWidth,
  cameraHeight,
  cameraStatus,
  isPaused,
  onTogglePause,
}) {
  const hasCameraError = cameraStatus === 'error' || cameraStatus === 'unsupported'

  return (
    <div style={{ position: 'absolute', top: 10, right: 10, width: 320 }}>
      <video ref={videoRef} autoPlay playsInline style={videoStyle} />
      <canvas ref={canvasRef} width={cameraWidth} height={cameraHeight} style={canvasStyle} />
      <div style={{
        position: 'absolute',
        top: 250,
        right: 0,
        width: 320,
        padding: 10,
        color: '#fff',
        background: 'rgba(0, 0, 0, 0.75)',
        borderRadius: 10,
        fontSize: 12,
      }}>
        <div>Camera: <strong style={{ color: hasCameraError ? '#ff5577' : '#00ffcc' }}>{cameraStatus}</strong></div>
        {hasCameraError && <div style={{ marginTop: 5 }}>Allow camera access, connect a camera, then reload.</div>}
        <button type="button" onClick={onTogglePause} style={buttonStyle}>
          {isPaused ? 'Resume tracking' : 'Pause tracking'}
        </button>
      </div>
    </div>
  )
}

const buttonStyle = {
  marginTop: 8,
  background: 'transparent',
  color: '#00ffcc',
  border: '1px solid #00ffcc',
  borderRadius: 4,
  padding: '4px 7px',
  cursor: 'pointer',
}
