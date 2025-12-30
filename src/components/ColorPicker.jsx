import { useRef, useEffect, useState, memo } from 'react'

const ColorPicker = ({ onColorChange, handCursor, interactionMode }) => {
    const containerRef = useRef(null)
    const [selectedColor, setSelectedColor] = useState('#00ffd5')
    const [cursorPos, setCursorPos] = useState({ x: 0.5, y: 0.5 })

    const hslToHex = (h, s, l) => {
        l /= 100
        const a = s * Math.min(l, 1 - l) / 100
        const f = n => {
            const k = (n + h / 30) % 12
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
            return Math.round(255 * color).toString(16).padStart(2, '0')
        }
        return `#${f(0)}${f(8)}${f(4)}`
    }

    const updateColorFromPosition = (x, y) => {
        const dx = x - 0.5
        const dy = y - 0.5
        const dist = Math.sqrt(dx * dx + dy * dy) * 2

        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
        if (angle < 0) angle += 360

        const s = Math.min(dist * 100, 100)
        const l = 50

        const color = hslToHex(angle, s, l)
        setSelectedColor(color)
        onColorChange(color)
        setCursorPos({ x, y })
    }

    useEffect(() => {
        if (interactionMode === 'COLOR' && handCursor) {
            updateColorFromPosition(handCursor.x, handCursor.y)
        }
    }, [interactionMode, handCursor])

    const handleMouseDown = (e) => {
        handleMouseMove(e)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }

    const handleMouseMove = (e) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
        const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1)
        updateColorFromPosition(x, y)
    }

    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
    }

    if (interactionMode !== 'COLOR') return null

    return (
        <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 300, height: 300, borderRadius: '50%',
                background: ` radial-gradient(circle closest-side, transparent 0%, transparent 0%, white 100%), conic-gradient(from 0deg, red 0deg, yellow 60deg, lime 120deg, cyan 180deg, blue 240deg, magenta 300deg, red 360deg)`,
                boxShadow: '0 0 20px rgba(0,0,0,0.5)', cursor: 'crosshair', pointerEvents: 'auto', zIndex: 50}}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, white 0%, transparent 100%)', opacity: 0.5, pointerEvents: 'none'}} />
            <div style={{ position: 'absolute', left: `${cursorPos.x * 100}%`, top: `${cursorPos.y * 100}%`, width: 20, height: 20, transform: 'translate(-50%, -50%)', border: '2px solid white', borderRadius: '50%', backgroundColor: selectedColor, boxShadow: '0 0 5px rgba(0,0,0,0.5)', pointerEvents: 'none'}} />
            <div style={{ position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)', color: 'white', background: 'rgba(0,0,0,0.7)', padding: '5px 10px', borderRadius: 5, textAlign: 'center', pointerEvents: 'none', whiteSpace: 'nowrap'}}>
                Select Color<br />
                (Index Finger or Mouse)
            </div>
        </div>
    )
}

export default memo(ColorPicker)
