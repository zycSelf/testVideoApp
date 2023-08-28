import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Calipers } from './divCalipers';
import { VideoFileData, DragData, FFmpegOperate } from './videoView';
import { getUrl } from '@/app/utils/getBlobUrl';
import { VideoPlayer } from './videoPlay';

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
  return (
    <div className="controlArea flex h-full w-full flex-col">
      <div className="videoArea flex justify-center grow-[2] h-0">
        <VideoPlayer
          play={play}
          currentTime={currentTime}
          activeVideoItem={activeFileList[activeVideoIndex]}
          setPlay={setPlay}
          setCurrentTime={setCurrentTime}
          offscreenCanvas={ffmpegOperate.generateScreenCanvas}
          renderOffscreenCanvas={ffmpegOperate.renderScreenCanvas}
        />
      </div>
      <div className="operateArea grow  h-0">
        <div className="w-full h-12 flex justify-center items-center border border-gray" ref={messageRef}>
          message
        </div>
        <button
          className="ml-2"
          onClick={() => {
            setPlay(true);
          }}
        >
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
  );
};
