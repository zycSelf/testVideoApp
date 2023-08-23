import { useEffect, useRef, useState } from "react"

interface CalipersProps {
    currentTime:number
    duration:number | string
    handleChangeTime:(time:number) => void
}

export const Calipers = ({currentTime,duration,handleChangeTime}:CalipersProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [ctx,setCtx] = useState(null)
    useEffect(() => {
        if(duration) {
            console.log(Number(duration))
            const canvas = canvasRef.current as HTMLCanvasElement
            if(canvas) {
                setCtx(canvas.getContext("2d"))
            }
        }
    },[duration])
    useEffect(() => {
        renderScale()
    },[ctx])
    const renderScale = () => {
    }
    return duration ? <canvas className="w-full h-8 bg-slate-600" ref={canvasRef} />:null
}