"use client"
import {Fragment, useEffect, useRef, useState} from "react";
import {FFmpeg} from "@/common/utils/ffmpeg/src";
import {fetchFile} from "@/common/utils/util/src";
import { FFMessageKeyFrameListData, FFMessageVideoBasicParams, FileData } from '@/common/utils/ffmpeg/src/types';
import Image from "next/image";
import { generateTime } from "@/app/utils//generateTime";
import { blurEffect } from "@/app/utils/effects/blur";
import { Calipers } from "./calipers";

interface VideoViewProps {
    src:string|null,
    transcode:() => void
}
export default function VideoView() {
    const [loaded,setLoaded] = useState<boolean>(false)
    const [running,setRunning] = useState<boolean>(false)
    const [currentTime,setCurrentTime] = useState<number>(0)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const videoBasicParamsRef = useRef<FFMessageVideoBasicParams>(null)
    const [videoBasicParams,setVideoBasicParams] = useState<FFMessageVideoBasicParams|null>(null)
    const [keyframeList,setKeyframeList] = useState<FFMessageKeyFrameListData>({
        frameList:[],
        keyFrameImageList:[],
        keyFrameList:[]
    })
    const uploadFileRef = useRef<HTMLInputElement>(null)
    const messageRef = useRef<HTMLDivElement>(null)
    const ffmpegRef = useRef<FFmpeg>(new FFmpeg())
    const pagePicRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if(loaded) {
            if(videoRef.current) {
                const video = videoRef.current 
                video.addEventListener("timeupdate",async () => {
                    setCurrentTime(getCurrentTime())
                })
            }
        }else {
            console.count("initial")
            initFFmpeg()
        }
        
    },[loaded])
    const setPicToCanvas = (fileData:Uint8Array) => {
        const type = {type:"image/png"}
        const url = getUrl(fileData,type)
        const image = new window.Image()
        image.onload = function() {
            console.log(image.width,image.height)
            const ctx = canvasRef.current?.getContext("2d")
            ctx!.drawImage(image,0,0)
            
        }
        image.src = url

    }
    const getUrl = (binary:Uint8Array,type:any)  => {
        const buffer = binary.buffer
        console.log(binary.buffer)
        const blob = new Blob([buffer],type)
        const url = URL.createObjectURL(blob)
        return url
    }
    const initFFmpeg = async () => {
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on("log", ({ message }) => {
            if(messageRef.current){
                // console.log(message)
                messageRef.current.innerText = message;
            }
        });
        ffmpeg.on("progress", (progressData)=> {
            console.log(progressData);
        });
        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL:'/core/ffmpeg/umd/ffmpeg-core.js',
            wasmURL:'/core/ffmpeg/umd/ffmpeg-core.wasm',
            ffprobeCoreURL:'/core/ffprobe/umd/ffprobe-core.js',
            ffprobeWasmURL:'/core/ffprobe/umd/ffprobe-core.wasm',
            ffprobeWorkerURL:'/core/ffprobe/umd/ffprobe-core.worker.js',
            workerURL:'/core/ffmpeg/umd/ffmpeg-core.worker.js',
        });
        setLoaded(true);
    }
    const transcode = async () => {
        if(videoBasicParams) {
            const filename = videoBasicParams.format.filename
            const ffmpeg = ffmpegRef.current
            const query = filename.split(".")
            // const h264Name = query.splice(0,query.length-1).join(".")+".h264"
            // await ffmpeg.exec(['-i',filename,"-c","h264",h264Name])
            // const binary = await ffmpeg.readFile(filename.split(".")[0]+'.h264') as Uint8Array
            const binary = await ffmpeg.readFile(filename) as Uint8Array
            const type = {type:"video/"+query[query.length-1]}
            const url = getUrl(binary,type)
            videoRef.current!.src = url
        }
        // if(videoRef.current) {
        //     videoRef.current.src = data
        // }
        // await extractPic(data)
    }
    const getCurrentTime =() : number => {
        const video = videoRef.current as HTMLVideoElement
        const currentTime = video.currentTime as number
        return currentTime
    }
    const getPicByTime = async (time:number) => {
        const ffmpeg = ffmpegRef.current
        const hmsTime = generateTime(time)
        const canvas = canvasRef.current as HTMLCanvasElement
        console.log( `${canvas.offsetWidth}x${canvas.offsetHeight}`)
        if(videoBasicParamsRef.current) {
            const args = [
                "-ss",
                hmsTime,
                '-i',
                videoBasicParamsRef.current!.format.filename,
                '-vf',
                // 'select='+'eq(pict_type'+'\\,'+'I)',
                `scale=${canvas.offsetWidth}:${canvas.offsetHeight}`,
                "-frames",
                "1",
                // "-s",
                // `${canvas.offsetWidth}x${canvas.offsetHeight}`,
                '-vsync',
                '2',
                '-f',
                'image2',
                `image.png`
              ]
            await ffmpeg.exec(args)
            const fileData = await ffmpeg.readFile("image.png")
            return fileData
        }
    }
    const getPic = async () => {
        const currentTime = getCurrentTime()
        await getPicByTime(currentTime)
    }
    const addBlurEffects = async () => {
        const fileName = videoBasicParams?.format.filename as string
        const query = fileName.split(".")
        const ffmpeg = ffmpegRef.current
        const effect = blurEffect
        const currentTime = getCurrentTime()
        const startTime = generateTime(currentTime)
        const endTime = generateTime(currentTime + effect.time)
        const splitArgs = effect.getSplitArgs(startTime,endTime,fileName)
        const filterArgs = effect.getFilterArgs(videoBasicParams!.streams[0].width,videoBasicParams!.streams[0].height)
        await ffmpeg.exec(splitArgs.args)
        await ffmpeg.exec(filterArgs.args)
        const splitFileName = splitArgs.outputName
        await uploadFileInfo(splitFileName,true)
        const binary = await ffmpeg.readFile(filterArgs.outputName) as Uint8Array
        const type = {type:"video/"+query[query.length-1]}
        const url = getUrl(binary,type)
        videoRef.current!.src = url
    }
    const uploadFile = async (file:File) => {
        if(!running){
            setRunning(true)
            const filename = file.name
            const fileData = await fetchFile(file) as Uint8Array
            await uploadFileInfo(filename,false,file)
            setRunning(false)
        }
    }
    const uploadFileInfo = async (filename:string,isWriten:boolean,file?:File) => {
        const ffmpeg = ffmpegRef.current
        const oldFileName = videoBasicParams ? videoBasicParams.format.filename : null
        await writeAndDel(ffmpeg,filename,oldFileName,isWriten,file)
        console.log("writeAndDelDone")
        await updateBasicParamsAndKeyFrameList(ffmpeg,filename)
    }
    const writeAndDel = async (ffmpeg:FFmpeg,filename:string,oldFileName:string | null,isWriten:boolean,file?:File) => {
        if(oldFileName) {
            deleteFile(ffmpeg,oldFileName)
        }
        
        if(!isWriten && file) {
            await ffmpeg.writeFile(filename,await fetchFile(file))
            await ffmpeg.writeFileFFprobe(filename,await fetchFile(file))
        }else {
            const fileData = await ffmpeg.readFile(filename)
            console.log(fileData)
            await ffmpeg.writeFileFFprobe(filename,fileData)
        }
    }
    const deleteFile = async (ffmpeg:FFmpeg,fileName:string) => {
        await ffmpeg.deleteFile(fileName)
        await ffmpeg.deleteFFprobeDir(fileName)
        console.log("delete done")
    }
    const updateBasicParamsAndKeyFrameList = async (ffmpeg:FFmpeg,filename:string) => {
        const basicParams = await ffmpeg.getVideoBasicParams(filename);
        videoBasicParamsRef.current = basicParams
        setVideoBasicParams(basicParams)
        const keyframeList = await ffmpeg.getKeyFrameList(filename)
        setKeyframeList(keyframeList)
    }
    const renderPagePic = () => {
        const {keyFrameImageList,keyFrameList} = keyframeList
        return keyFrameImageList.map((imageUnit8Array:Uint8Array,index:number) => {
            const buffer = imageUnit8Array.buffer
            const blob = new Blob([buffer],{type:"image/png"})
            const imageURL = URL.createObjectURL(blob)
            const frameData = keyFrameList[index]
            return <Image alt={`keyframe_${index}`} width={frameData.width} height={frameData.height} key={imageURL} src={imageURL} />
        })
    }
    const handleChangeCalipersTime = (time:number) => {
        if(videoRef.current) {
            videoRef.current.currentTime = time
        }
    }
    const videoPlay = () => {
        if(videoRef.current) {
            videoRef.current.play()
        }
    }
    return (
        <div className="flex h-full w-full flex-row justify-start items-center">
            {
                loaded ? (
                <Fragment>
                    <div className="upload w-52 h-full border-black border-r flex justify-center items-center">
                        <input ref={uploadFileRef} type={"file"} className="hidden" onChange={(e) => {
                            const target = e.target as HTMLInputElement
                            if(target.files&&target.files.length>0) {
                                uploadFile(target.files[0])
                        }}}/>
                        <button 
                            className="w-auto border border-black border-solid flex justify-center items-center p-4"
                            onClick={() => {
                                uploadFileRef.current?.click()
                            }}
                        >uploadFile</button>
                    </div>
                    <div className="controlArea flex h-full w-full flex-col">
                        <div className="videoArea grow-[2] h-0">
                            <video className="w-full h-full" ref={videoRef}></video>
                            {/* <canvas width={1000} height={1000} className="w-full h-full" ref={canvasRef} /> */}
                        </div>
                        <div className="operateArea grow  h-0">
                            <div ref={messageRef}>true</div>
                            <button className="ml-2" onClick={() => videoPlay()}>play</button>
                            <button className="ml-2" onClick={async () => await addBlurEffects()}>添加模糊特效</button>
                            <button className="ml-2" onClick={async () => await transcode()} >测试视频转码</button>
                            <button className="ml-2" onClick={async () => await getPic()} >测试实时转图片</button>
                            <div>{videoBasicParams?.format.duration}</div>
                        </div>
                        <div className="coverArea grow  h-0">
                            <Calipers 
                                currentTime={currentTime} 
                                duration={videoBasicParams ? videoBasicParams.format.duration : 0} 
                                handleChangeTime={handleChangeCalipersTime} 
                            />
                            <div ref={pagePicRef} className={'flex flex-row max-h-100 overflow-scroll'}>
                                    {/* {renderPagePic()} */}
                            </div>
                        </div>
                        </div>
                    </Fragment>)
                :<div>loading</div>
            }
        </div>
    )
}
