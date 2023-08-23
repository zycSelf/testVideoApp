import { Position2D } from "@/app/types/calipers";

export const renderHalfSecondTickMark = (ctx:CanvasRenderingContext2D,position:Position2D,tickMarkNum:number) => {
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = "#ffffff"
    ctx.moveTo(position.x,position.y)
    ctx.lineTo(position.x,10)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
    const tickMarkText = (tickMarkNum/10).toFixed(1)
    renderTickMarkText(ctx,tickMarkText,{x:position.x-6.5,y:position.y + 20})
}
export const renderTickMarkText = (ctx:CanvasRenderingContext2D,tickMarkText:string,position:Position2D) => {
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = "#ffffff"
    ctx.font = "12px serif"
    ctx.fillText(tickMarkText,position.x,position.y)
    ctx.closePath()
    ctx.restore()
}
export const renderMilliSecondTickMark = (ctx:CanvasRenderingContext2D,position:Position2D) => {
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = "#ffffff"
    ctx.moveTo(position.x,position.y)
    ctx.lineTo(position.x,5)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
}
export const renderCurrentTimeLine = (ctx:CanvasRenderingContext2D,position:Position2D) => {
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = "black"
    ctx.moveTo(position.x,position.y)
    ctx.lineTo(position.x,40)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
}