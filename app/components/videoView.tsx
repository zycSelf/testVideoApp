'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import { FFmpeg } from '@/common/utils/ffmpeg/src';
import { FFMessageVideoBasicParams, FileData, LogEvent } from '@/common/utils/ffmpeg/src/types';
import { generateTime } from '@/app/utils//generateTime';
import { LeftUploadist } from './leftUploadList';
import { OperatePage, PicBlobUrl, TimeSharing } from './operateList';
import { getUrl } from '../utils/getBlobUrl';

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
  status: string;
  picBlobUrlMap: {
    [key: string]: Array<PicBlobUrl>;
  };
}
export interface DragData {
  type: string;
  data: VideoFileData;
}
export interface FFmpegOperate {
  readFile: (filename: string) => Promise<FileData>;
  readFileFFprobe: (filename: string) => Promise<FileData>;
  writeFile: (filename: string, data: FileData) => Promise<boolean>;
  writeFileFFprobe: (filename: string, data: FileData) => Promise<boolean>;
  deleteFile: (path: string) => Promise<boolean>;
  deleteFileFFprobe: (path: string) => Promise<boolean>;
  deleteDir: (path: string) => Promise<boolean>;
  deleteDirFFprobe: (path: string) => Promise<boolean>;
  getPicByTime: (filename: string, time: number) => Promise<FileData>;
  getVideoBasicParams: (path: string) => Promise<FFMessageVideoBasicParams>;
  handleFFmpegLog: (cb: (message: string) => void) => void;
  handleFFmpegProgress: (cb: (progressData: LogEvent) => void) => void;
  splitTimeSharingImage: (file: VideoFileData, timeSharingArr: Array<TimeSharing>) => Promise<VideoFileData>;
}
export default function VideoView() {
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const workRef = useRef<Array<string>>([]);
  const ffmpegOperateRef = useRef<FFmpegOperate | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [fileList, setFileList] = useState<Array<VideoFileData>>([]);
  useEffect(() => {
    if (!loaded) {
      console.count('initial');
      initFFmpeg();
      ffmpegOperateRef.current = operate;
    }
  }, [loaded]);
  const initFFmpeg = async () => {
    const ffmpeg = ffmpegRef.current;
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
  const handleFFmpegLog = (cb: (message: string) => void) => {
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
      cb && cb(message);
    });
  };
  const handleFFmpegProgress = (cb: (progressData: LogEvent) => void) => {
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', (progressData) => {
      cb && cb(progressData);
    });
  };
  const getPicByTime = async (filename: string, time: number) => {
    const ffmpeg = ffmpegRef.current;
    const hmsTime = generateTime(time);
    console.log(filename, time);
    const name = `image${new Date().getTime()}.png`;
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
      name,
    ];
    await ffmpeg.exec(args);
    const fileData = await ffmpeg.readFile(name);
    deleteFile(name);
    return fileData;
  };
  const readFile = async (filename: string): Promise<FileData> => {
    const fileData = await ffmpegRef.current.readFile(filename);
    return fileData;
  };
  const readFileFFprobe = async (filename: string): Promise<FileData> => {
    const fileData = await ffmpegRef.current.readFileFFprobe(filename);
    return fileData;
  };
  const writeFile = async (filename: string, data: FileData): Promise<boolean> => {
    const boolean = await ffmpegRef.current.writeFile(filename, data);
    return boolean;
  };
  const writeFileFFprobe = async (filename: string, data: FileData): Promise<boolean> => {
    const boolean = await ffmpegRef.current.writeFileFFprobe(filename, data);
    return boolean;
  };
  const deleteFile = async (path: string): Promise<boolean> => {
    const boolean = await ffmpegRef.current.deleteFile(path);
    return boolean;
  };
  const deleteFileFFprobe = async (path: string): Promise<boolean> => {
    const boolean = await ffmpegRef.current.deleteFFprobeFile(path);
    return boolean;
  };
  const deleteDir = async (path: string): Promise<boolean> => {
    const boolean = await ffmpegRef.current.deleteDir(path);
    return boolean;
  };
  const deleteDirFFprobe = async (path: string): Promise<boolean> => {
    const boolean = await ffmpegRef.current.deleteFFprobeDir(path);
    return boolean;
  };
  const getVideoBasicParams = async (path: string): Promise<FFMessageVideoBasicParams> => {
    const basicFileData = await ffmpegRef.current.getVideoBasicParams(path);
    return basicFileData;
  };
  const splitTimeSharingImage = async (
    file: VideoFileData,
    timeSharingArr: Array<TimeSharing>,
  ): Promise<VideoFileData> => {
    const picBlobUrlMap: {
      [key: string]: Array<PicBlobUrl>;
    } = {};
    for (let i = 0; i < timeSharingArr.length; i++) {
      const timeSharing = timeSharingArr[i];
      const { level, time } = timeSharing;
      const splitTime = time / 2;
      const count = Math.ceil(file.duration);
      const filename = file.filename;
      let currentTime = 0;
      picBlobUrlMap[level] = [];
      const getPic = async (filename: string, time: number) => {
        const picBinary = await getPicByTime(filename, time);
        const picBlobUrl = getUrl(picBinary);
        picBlobUrlMap[level].push({
          id: new Date().getTime().toString(),
          time: currentTime,
          value: picBlobUrl,
        });
        currentTime += splitTime / 1000;
        if (currentTime < count) {
          await getPic(filename, currentTime / 1000);
        }
      };
      await getPic(filename, currentTime / 1000);
      picBlobUrlMap[level].sort((a, b) => a.time - b.time);
    }
    file.picBlobUrlMap = picBlobUrlMap;
    return file;
  };
  const operate = {
    readFile,
    readFileFFprobe,
    writeFile,
    writeFileFFprobe,
    deleteFile,
    deleteFileFFprobe,
    deleteDir,
    deleteDirFFprobe,
    getPicByTime,
    getVideoBasicParams,
    handleFFmpegLog,
    handleFFmpegProgress,
    splitTimeSharingImage,
  };

  return (
    <div className="flex bg-basicBgColor text-white h-full w-full flex-row justify-start items-center">
      {loaded ? (
        <Fragment>
          <LeftUploadist
            ffmpegOperate={ffmpegOperateRef.current!}
            fileList={fileList}
            setNewFileList={setFileList}
            setDragData={setDragData}
          />
          <OperatePage
            ffmpegOperate={ffmpegOperateRef.current!}
            fileList={fileList}
            dragData={dragData}
            setNewFileList={setFileList}
          />
        </Fragment>
      ) : (
        <div>loading</div>
      )}
    </div>
  );
}
