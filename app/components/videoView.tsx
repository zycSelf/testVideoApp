'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import { FFmpeg } from '@/common/utils/ffmpeg/src';
import { fetchFile } from '@/common/utils/util/src';
import { FFMessageKeyFrameListData, FFMessageVideoBasicParams, FileData } from '@/common/utils/ffmpeg/src/types';
import Image from 'next/image';
import { generateTime } from '@/app/utils//generateTime';
import { blurEffect } from '@/app/utils/effects/blur';
import { ActiveFileListItem, Calipers } from './divCalipers';
import { param } from 'ts-interface-checker';
import { VideoDisplayPic } from './videoDisplay';

interface VideoViewProps {
  src: string | null;

  transcode: () => void;
}
export interface VideoFileData {
  id: string;
  file: File;
  filename: string;
  startTime: number;
  endTime: number;
  scale: {
    width: number;
    height: number;
  };
  duration: number;
  params: FFMessageVideoBasicParams;
  firstPicBlobUrl: string;
}
export interface DragData {
  type: string;
  data: VideoFileData;
}
export default function VideoView() {
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [fileList, setFileList] = useState<Array<VideoFileData>>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [play, setPlay] = useState<boolean>(false);
  useEffect(() => {
    if (!loaded) {
      console.count('initial');
      initFFmpeg();
    }
  }, [loaded]);
  const getUrl = (binary: Uint8Array, type: any) => {
    const buffer = binary.buffer;
    const blob = new Blob([buffer], type);
    const url = URL.createObjectURL(blob);
    return url;
  };
  const initFFmpeg = async () => {
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
      if (messageRef.current) {
        // console.log(message)
        messageRef.current.innerText = message;
      }
    });
    ffmpeg.on('progress', (progressData) => {
      console.log(progressData);
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: '/core/ffmpeg/umd/ffmpeg-core.js',
      wasmURL: '/core/ffmpeg/umd/ffmpeg-core.wasm',
      ffprobeCoreURL: '/core/ffprobe/umd/ffprobe-core.js',
      ffprobeWasmURL: '/core/ffprobe/umd/ffprobe-core.wasm',
      ffprobeWorkerURL: '/core/ffprobe/umd/ffprobe-core.worker.js',
      workerURL: '/core/ffmpeg/umd/ffmpeg-core.worker.js',
    });
    setLoaded(true);
  };
  const getCurrentTime = (): number | null => {
    const video = videoRef.current as HTMLVideoElement;
    if (video) {
      const currentTime = video.currentTime as number;
      return currentTime;
    } else {
      return null;
    }
  };
  const getPicByTime = async (filename: string, time: number) => {
    const ffmpeg = ffmpegRef.current;
    const hmsTime = generateTime(time);
    console.log(filename, time);
    const args = [
      '-ss',
      hmsTime,
      '-i',
      filename,
      // '-vf',
      // 'select='+'eq(pict_type'+'\\,'+'I)',
      // `scale=${videoBasicParams?.params.format.size}`,
      '-frames',
      '1',
      '-s',
      `${100}x${50}`,
      '-vsync',
      '2',
      '-f',
      'image2',
      `image.png`,
    ];
    await ffmpeg.exec(args);
    const fileData = await ffmpeg.readFile('image.png');
    return fileData;
  };
  const uploadFile = async (file: File) => {
    if (!running) {
      setRunning(true);
      const filename = file.name;
      await uploadFileInfo(filename, false, file);
      setRunning(false);
    }
  };
  const uploadFileInfo = async (filename: string, isWriten: boolean, file: File) => {
    const ffmpeg = ffmpegRef.current;
    // const oldFileName = videoBasicParams ? videoBasicParams.params.format.filename : null
    const oldFileName = null;
    await writeAndDel(ffmpeg, filename, oldFileName, isWriten, file);
    console.log('writeAndDelDone');
    await addFileListData(ffmpeg, filename, file);
  };
  const writeAndDel = async (
    ffmpeg: FFmpeg,
    filename: string,
    oldFileName: string | null,
    isWriten: boolean,
    file: File,
  ) => {
    if (oldFileName) {
      deleteFile(ffmpeg, oldFileName);
    }

    if (!isWriten && file) {
      await ffmpeg.writeFile(filename, await fetchFile(file));
      await ffmpeg.writeFileFFprobe(filename, await fetchFile(file));
    } else {
      const fileData = await ffmpeg.readFile(filename);
      await ffmpeg.writeFileFFprobe(filename, fileData);
    }
  };
  const deleteFile = async (ffmpeg: FFmpeg, fileName: string) => {
    await ffmpeg.deleteFile(fileName);
    await ffmpeg.deleteFFprobeDir(fileName);
    console.log('delete done');
  };
  const setVideo = (binary: Uint8Array) => {
    const url = getUrl(binary, { type: 'video/mp4' });
    videoRef.current.src = url;
  };
  const addFileListData = async (ffmpeg: FFmpeg, filename: string, file: File) => {
    const basicParams = await ffmpeg.getVideoBasicParams(filename);
    const currentTime = 0;
    const firstPicBinary = (await getPicByTime(filename, currentTime)) as Uint8Array;
    const firstPicBlobUrl = getUrl(firstPicBinary, { type: 'image/png' });
    const id = new Date().getTime().toString();
    const startTime = 0;
    const duration = Number(basicParams.format.duration);
    const endTime = startTime + duration;
    const scale = {
      width: basicParams.streams[0].width,
      height: basicParams.streams[0].height,
    };
    const newFileListItem = {
      id,
      file,
      filename,
      firstPicBlobUrl,
      startTime,
      endTime,
      scale,
      duration,
      params: basicParams,
    };
    setFileList(fileList.concat(newFileListItem));
  };
  const handleChangeCalipersTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };
  const videoPlay = () => {
    if (!videoRef.current?.src) {
      return;
    }
    if (videoRef.current) {
      setPlay(true);
      updateCurrentTime();
      videoRef.current.play();
    }
  };
  const videoStop = () => {
    if (videoRef.current) {
      setPlay(false);
      videoRef.current.pause();
    }
  };
  const updateCurrentTime = () => {
    const video = videoRef.current;
    if (video) {
      const currentTime = videoRef.current?.currentTime;
      setCurrentTime(currentTime);
      if (!video.ended) {
        requestAnimationFrame(updateCurrentTime);
      }
    }
  };
  const handleGetVideo = () => {
    const video = videoRef.current;
    if (video) {
      return video.src;
    }
    return null;
  };
  const handleSetVideo = async (data: ActiveFileListItem, currentTime?: number) => {
    const video = videoRef.current;
    if (video) {
      const videoData = (await ffmpegRef.current.readFile(data.filename)) as Uint8Array;
      setVideo(videoData);
      if (currentTime) {
        video.currentTime = currentTime;
      }
      if (play) {
        videoPlay();
      }
    }
  };
  const getCalipersParams = () => {
    return {
      isPlay: play,
      dragData,
      currentTime,
      handleChangeCalipersTime,
      handleSplitImage,
      handleGetVideo,
      handleSetVideo,
      handlePlayVideo: videoPlay,
      handleStopVideo: videoStop,
    };
  };
  const handleSplitImage = async (file: ActiveFileListItem, splitTime: number): Promise<ActiveFileListItem> => {
    const count = Math.ceil(file.duration) * 1000;
    let currentTime = 0;
    const filename = file.filename;
    const picBlobUrlList = [];
    while (currentTime < count) {
      const picBinary = (await getPicByTime(filename, currentTime / 1000)) as Uint8Array;
      const picBlobUrl = getUrl(picBinary, { type: 'image/png' });
      picBlobUrlList.push({
        id: new Date().getTime().toString(),
        time: currentTime,
        value: picBlobUrl,
      });
      currentTime += splitTime;
    }
    return {
      ...file,
      status: 'done',
      picBlobUrlList,
    };
  };
  const handleVideoPicDragStart = (id: string, type: string) => {
    const dragData = fileList.find((file) => file.id === id);
    if (dragData) {
      setDragData({
        type,
        data: dragData,
      });
    }
  };
  return (
    <div className="flex bg-basicBgColor text-white h-full w-full flex-row justify-start items-center">
      {loaded ? (
        <Fragment>
          <div className="upload relative shrink-0 flex-col w-52 h-full border-black border-r flex items-center">
            <input
              ref={uploadFileRef}
              type={'file'}
              className="hidden"
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                  uploadFile(target.files[0]);
                }
              }}
            />
            {fileList.map((fileData) => {
              return <VideoDisplayPic key={fileData.id} {...fileData} handleDragStart={handleVideoPicDragStart} />;
            })}
            <button
              className="absolute bottom-0 w-auto text-white border border-black border-solid flex justify-center items-center p-4"
              onClick={() => {
                uploadFileRef.current?.click();
              }}
            >
              uploadFile
            </button>
          </div>
          <div className="controlArea flex h-full w-full flex-col">
            <div className="videoArea grow-[2] h-0">
              <video className="w-full h-full" ref={videoRef}></video>
            </div>
            <div className="operateArea grow  h-0">
              <div ref={messageRef}>true</div>
              <button className="ml-2" onClick={() => videoPlay()}>
                play
              </button>
            </div>
            <div className="coverArea grow  h-0">
              <Calipers {...getCalipersParams()} />
              {/* <Calipers 
                                currentTime={currentTime} 
                                duration={videoBasicParams ? videoBasicParams.format.duration : 0} 
                                handleChangeTime={handleChangeCalipersTime} 
                            /> */}
            </div>
          </div>
        </Fragment>
      ) : (
        <div>loading</div>
      )}
    </div>
  );
}
