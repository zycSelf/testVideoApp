"use client"
import { useEffect, useRef, useState } from "react"
import { renderCurrentTimeLine, renderHalfSecondTickMark, renderMilliSecondTickMark } from "../utils/canvas/canvasRenderer"

interface CalipersProps {
    currentTime:number
    duration:number | string
    handleChangeTime:(time:number) => void
}
const canvasBasicAttribute = {
    padding: 20,
}
export const Calipers = ({currentTime,duration,handleChangeTime}:CalipersProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [min,setMin] = useState<number>(0)
    const [max,setMax] = useState<number>(0)
    const [durationNum,setDurationNum] = useState<number>(0)
    const [ctx,setCtx] = useState<CanvasRenderingContext2D|null>(null)
    // useEffect(() => {
    //     if(currentTime) {
            
    //     }
    // },[currentTime])
    useEffect(() => {
        if(duration) {
            const num = Number(duration)
            setDurationNum(num)
            setMin(0)
            setMax(Math.ceil(num))
            const canvas = canvasRef.current
            if(canvas) {
                window.onresize = () => {
                    resizeCanvas()
                    draw()
                }
                resizeCanvas()
                setCtx(canvas.getContext("2d"))
            }
        }
    },[duration])
    useEffect(() => {
        if(ctx) {
            draw()
        }
    },[ctx,currentTime])
    const resizeCanvas = () => {
        const canvas = canvasRef.current!
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
    }
    const renderScale = ({padding}:{padding:number}) => {
        if(ctx) {
            for(let tickMark = min ; tickMark <= max * 10 ; tickMark++) {
                //防止浮点数问题。
                if(tickMark % 5 === 0) {
                    console.log(tickMark)
                    renderHalfSecondTickMark(ctx,{x:padding+tickMark*10,y:0},tickMark)
                }else {
                    renderMilliSecondTickMark(ctx,{x:padding+tickMark*10,y:0})
                }
            }
        }
    }
    const renderCurrentTime = (currentTime:number,{padding}:{padding:number}) => {
        if(ctx) {
            const position = {
                x: currentTime * 100 + padding,
                y: 0
            }
            console.log(position)
            renderCurrentTimeLine(ctx,position)
        }
    }
    const clearCanvas = () => {
        const canvas = canvasRef.current as HTMLCanvasElement
        ctx?.clearRect(0,0,canvas.width,canvas.height)
    }
    const draw = () => {
        clearCanvas()
        const padding = canvasBasicAttribute.padding
        renderScale({padding})
        renderCurrentTime(currentTime,{padding})
    }
    return duration ? <canvas className="w-full h-8 bg-slate-600" ref={canvasRef} />:null
}