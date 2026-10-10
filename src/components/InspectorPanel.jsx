import { SHAPES } from '../scene/ObjectFactory'

export default function InspectorPanel({ object, dispatch }) {
  if (!object) return null

  const update = (changes) => dispatch({ type: 'UPDATE_OBJECT', payload: { id: object.id, changes } })
  const updateVector = (key, axis, value) => update({ [key]: { ...object[key], [axis]: Number(value) } })

  return (
    <aside style={panelStyle}>
      <div style={titleStyle}>INSPECTOR</div>
      <label style={labelStyle}>Shape
        <select value={object.type} onChange={(event) => update({ type: event.target.value })} style={inputStyle}>
          {SHAPES.map((shape) => <option key={shape} value={shape}>{shape}</option>)}
        </select>
      </label>
      <label style={labelStyle}>Color
        <input type="color" value={object.color} onChange={(event) => update({ color: event.target.value })} style={inputStyle} />
      </label>
      {['position', 'rotation', 'scale'].map((key) => (
        <fieldset key={key} style={fieldsetStyle}>
          <legend>{key}</legend>
          {['x', 'y', 'z'].map((axis) => (
            <label key={axis} style={axisLabelStyle}>{axis}
              <input
                type="number"
                step="0.1"
                value={object[key][axis]}
                onChange={(event) => updateVector(key, axis, event.target.value)}
                style={numberInputStyle}
              />
            </label>
          ))}
        </fieldset>
      ))}
    </aside>
  )
}

const panelStyle = {
  position: 'absolute',
  right: 16,
  bottom: 16,
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
const labelStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }
const inputStyle = { maxWidth: 120, color: '#fff', background: '#171717', border: '1px solid #555', borderRadius: 3 }
const fieldsetStyle = { display: 'flex', gap: 4, margin: '8px 0', padding: 6, border: '1px solid #444', borderRadius: 4 }
const axisLabelStyle = { display: 'flex', alignItems: 'center', gap: 2, color: '#aaa' }
const numberInputStyle = { width: 52, color: '#fff', background: '#171717', border: '1px solid #555', borderRadius: 3 }
