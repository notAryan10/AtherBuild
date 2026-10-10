import { SHAPES } from '../scene/ObjectFactory'

export default function SceneHierarchy({ objects, selectedObjectId, dispatch }) {
  return (
    <aside style={panelStyle}>
      <div style={titleStyle}>SCENE HIERARCHY</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {SHAPES.map((type) => (
          <button key={type} type="button" onClick={() => dispatch({ type: 'ADD_OBJECT', payload: { type } })} style={smallButtonStyle}>
            +{type[0]}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
        <button type="button" onClick={() => dispatch({ type: 'DUPLICATE_OBJECT' })} style={buttonStyle}>Duplicate</button>
        <button type="button" onClick={() => dispatch({ type: 'DELETE_OBJECT' })} style={buttonStyle}>Delete</button>
      </div>
      {objects.map((object, index) => (
        <button
          key={object.id}
          type="button"
          onClick={() => dispatch({ type: 'SELECT_OBJECT', payload: object.id })}
          style={{ ...objectRowStyle, ...(object.id === selectedObjectId ? selectedRowStyle : {}) }}
        >
          <span>{index + 1}. {object.type}</span>
          <span style={{ color: object.color }}>●</span>
        </button>
      ))}
    </aside>
  )
}

const panelStyle = {
  position: 'absolute',
  top: 16,
  left: 16,
  width: 220,
  padding: 12,
  color: '#fff',
  background: 'rgba(0, 0, 0, 0.78)',
  border: '1px solid rgba(0, 255, 204, 0.35)',
  borderRadius: 10,
  fontSize: 12,
  pointerEvents: 'auto',
}

const titleStyle = { color: '#00ffcc', fontWeight: 'bold', marginBottom: 10 }
const smallButtonStyle = {
  padding: '4px 6px',
  color: '#00ffcc',
  background: 'transparent',
  border: '1px solid rgba(0, 255, 204, 0.7)',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 10,
}
const buttonStyle = { ...smallButtonStyle, flex: 1 }
const objectRowStyle = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  padding: '7px 8px',
  marginBottom: 4,
  color: '#ddd',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid transparent',
  borderRadius: 4,
  cursor: 'pointer',
  textAlign: 'left',
}
const selectedRowStyle = { color: '#00ffcc', border: '1px solid #00ffcc' }
