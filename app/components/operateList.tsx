import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Calipers } from './divCalipers';
import { VideoFileData, DragData, FFmpegOperate, fileDir } from './videoView';
import { getUrl } from '@/app/utils/getBlobUrl';
import { VideoPlayer } from './videoPlay';
import { getDBData } from '../utils/dbActions';
import { downloadFile } from '../utils/download';

interface OperatePageProps {
  ffmpegOperate: FFmpegOperate;
  fileList: Array<VideoFileData>;
  setNewFileList: Dispatch<SetStateAction<VideoFileData[]>>;
  dragData: DragData | null;
}
export type ActiveFileListItem = VideoFileData & {
  bindId: string;
};
export interface PicBlobUrl {
  id: string;
  time: number;
  value: string;
}
export type TimeSharing = typeof defaultTimeSharing.lv1;
const defaultTimeSharing = {
  lv1: {
    level: 'lv1',
    time: 2000,
    section: 10,
  },
  lv2: {
    level: 'lv2',
    time: 1000,
    section: 10,
  },
  lv3: {
    level: 'lv3',
    time: 500,
    section: 5,
  },
  lv4: {
    level: 'lv4',
    time: 200,
    section: 2,
  },
};
export const OperatePage = ({ ffmpegOperate, fileList, setNewFileList, dragData }: OperatePageProps) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [play, setPlay] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [exportFile, setExportFile] = useState<{
    status: string;
    data: Uint8Array | null;
  }>({
    status: 'idle',
    data: null,
  });
  // activeVideo
  const [timeSharing, setTimeSharing] = useState<TimeSharing>(defaultTimeSharing.lv1); // 2s 1s 0.5s 0.2s
  const [activeFileList, setActiveFileList] = useState<Array<ActiveFileListItem>>([]);
  const [allTime, setAllTime] = useState<number>(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [caliperCurrent, setCaliperCurrent] = useState<number>(0);

  //initial
  useEffect(() => {
    ffmpegOperate.handleFFmpegLog((message: string) => {
      if (messageRef.current) {
        messageRef.current.innerText = message;
      }
    });
  }, []);
  useEffect(() => {
    const idleFileList = fileList.filter((file) => file.status === 'idle');
    if (idleFileList.length > 0) {
      const newFileList = fileList.map((file) => {
        if (file.status === 'idle') {
          return {
            ...file,
            status: 'done',
          };
        } else {
          return file;
        }
      });
      setNewFileList(newFileList);
    }
  }, [fileList]);
  //handleActive
  useEffect(() => {
    if (activeFileList.length > 0) {
      const file = activeFileList[activeFileList.length - 1];
      setAllTime((prevAllTime: number) => prevAllTime + file.duration);
    }
  }, [activeFileList]);
  useEffect(() => {
    if (currentTime) {
      const now = elapsedTime + currentTime;
      setCaliperCurrent(elapsedTime + currentTime);
      if (now === allTime) {
        setPlay(false);
      }
      if (
        activeFileList[activeVideoIndex] &&
        activeFileList[activeVideoIndex + 1] &&
        currentTime === activeFileList[activeVideoIndex].duration
      ) {
        setElapsedTime(elapsedTime + activeFileList[activeVideoIndex].duration);
        setActiveVideoIndex(activeVideoIndex + 1);
      }
    }
  }, [currentTime]);
  useEffect(() => {
    if (play) {
      console.log(caliperCurrent, allTime);
      if (caliperCurrent === allTime) {
        setElapsedTime(0);
        setCaliperCurrent(0);
        if (activeFileList.length > 0) {
          setActiveVideoIndex(0);
        }
      }
    }
  }, [play]);
  useEffect(() => {
    const time = 1000 * allTime;
    const count = Math.ceil(time / timeSharing.time) + 1;
    console.log(allTime);
  }, [allTime]);
  // activeVideo

  // calipersCB
  const getCalipersParams = () => {
    return {
      isPlay: play,
      dragData,
      currentTime,
      timeSharing,
      activeFileList,
      caliperCurrent,
      setActiveFileList,
    };
  };
  const handleChangeCalipersTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };
  const handleExportFile = () => {
    setPlay(false);
    setExportFile({
      status: 'start',
      data: null,
    });
  };
  const exportFileData = async (basicScale: { width: number; height: number }) => {
    const execList: Array<Array<string>> = [];
    const tsList: Array<string> = [];
    activeFileList.map((item, index) => {
      const scale = item.scale;
      if (scale.width === basicScale.width && scale.height === basicScale.height) {
        const args: Array<string> = [
          '-i',
          `${fileDir.local + item.filename}`,
          `${fileDir.local}outputExport_${index}.ts`,
        ];
        execList.push(args);
        tsList.push(`${fileDir.local}outputExport_${index}.ts`);
      }
      // todo 添加其他可能 暂时粗略做测试数据 优化处理逻辑
      if (scale.width < basicScale.width && scale.height > basicScale.height) {
        const resultWidth = Math.floor(scale.width * (basicScale.height / scale.height));
        const resultHeight = basicScale.height;
        const offsetX = basicScale.width / 2 - resultWidth / 2;
        const offsetY = 0;
        const vf = `scale=${resultWidth}x${resultHeight},pad=${basicScale.width}:${basicScale.height}:${offsetX}:${offsetY}`;
        const args: Array<string> = [
          '-i',
          `${fileDir.local + item.filename}`,
          '-vf',
          vf,
          `${fileDir.local}outputExport_${index}.ts`,
        ];
        execList.push(args);
        tsList.push(`${fileDir.local}outputExport_${index}.ts`);
      }
    });
    await ffmpegOperate.generateExported(execList, tsList);
  };
  const handleVideoPlayDone = (id: string) => {
    const activeVideo = activeFileList.find((item) => item.id === id);
    if (activeVideo) {
      setCurrentTime(activeVideo.duration);
    }
  };
  return (
    <div className="controlArea flex h-full flex-1 w-0 flex-col">
      <div className="videoArea flex justify-center grow-[2] h-0">
        <VideoPlayer
          play={play}
          currentTime={currentTime}
          activeVideoItem={activeFileList[activeVideoIndex]}
          setPlay={setPlay}
          setCurrentTime={setCurrentTime}
          offscreenCanvas={ffmpegOperate.generateScreenCanvas}
          renderOffscreenCanvas={ffmpegOperate.renderScreenCanvas}
          videoPlayDone={handleVideoPlayDone}
          exportFile={exportFile}
          exportFileData={exportFileData}
        />
      </div>
      <div className="operateArea h-24 shrink-0 ">
        <div className="w-full h-12 flex justify-center items-center border border-gray" ref={messageRef}>
          message
        </div>
        <p>
          {currentTime + elapsedTime} / {allTime}
        </p>
        <button
          className="ml-2"
          onClick={() => {
            setPlay(true);
          }}
        >
          play: {play.toString()}
        </button>
        <button
          className="ml-2"
          onClick={() => {
            // downloadFile('1.test.mp4');
          }}
        >
          下载
        </button>
        <button
          className="ml-2"
          onClick={() => {
            handleExportFile();
          }}
        >
          导出
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
  );
};
