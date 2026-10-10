export default function ViewportToolbar({ state, dispatch, canUndo, canRedo }) {
  return (
    <div style={toolbarStyle}>
      <div style={groupStyle}>
        {['translate', 'rotate', 'scale'].map((mode) => (
          <button key={mode} type="button" onClick={() => dispatch({ type: 'SET_GIZMO_MODE', payload: mode })} style={state.gizmoMode === mode ? activeButtonStyle : buttonStyle}>
            {mode[0].toUpperCase()}
          </button>
        ))}
      </div>
      <div style={groupStyle}>
        <button type="button" onClick={() => dispatch({ type: 'SET_SNAP_SETTINGS', payload: { snapEnabled: !state.snapEnabled } })} style={state.snapEnabled ? activeButtonStyle : buttonStyle}>
          Snap {state.snapEnabled ? 'On' : 'Off'}
        </button>
        <button type="button" onClick={() => dispatch({ type: 'SET_PROJECTION', payload: state.projection === 'perspective' ? 'orthographic' : 'perspective' })} style={buttonStyle}>
          {state.projection === 'perspective' ? 'Ortho' : 'Perspective'}
        </button>
        <button type="button" onClick={() => dispatch({ type: 'SET_GUIDES_ENABLED', payload: !state.guidesEnabled })} style={state.guidesEnabled ? activeButtonStyle : buttonStyle}>
          Guides
        </button>
        <button type="button" onClick={() => dispatch({ type: 'FRAME_SELECTED' })} style={buttonStyle}>Frame</button>
      </div>
      <div style={groupStyle}>
        <button type="button" disabled={!canUndo} onClick={() => dispatch({ type: 'UNDO' })} style={buttonStyle}>Undo</button>
        <button type="button" disabled={!canRedo} onClick={() => dispatch({ type: 'REDO' })} style={buttonStyle}>Redo</button>
      </div>
    </div>
  )
}

const toolbarStyle = {
  position: 'absolute',
  top: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 8,
  padding: 6,
  color: '#fff',
  background: 'rgba(0, 0, 0, 0.78)',
  border: '1px solid rgba(0, 255, 204, 0.35)',
  borderRadius: 8,
  pointerEvents: 'auto',
}
const groupStyle = { display: 'flex', gap: 4 }
const buttonStyle = {
  padding: '5px 8px',
  color: '#ddd',
  background: 'transparent',
  border: '1px solid #555',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 11,
}
const activeButtonStyle = { ...buttonStyle, color: '#00ffcc', border: '1px solid #00ffcc' }
