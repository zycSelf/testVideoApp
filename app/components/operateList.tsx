import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Calipers } from './divCalipers';
import { VideoFileData, DragData, FFmpegOperate } from './videoView';
import { getUrl } from '@/app/utils/getBlobUrl';

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
            status: 'loading',
          };
        } else {
          return file;
        }
      });
      setNewFileList(newFileList);
      idleFileList.forEach((file) => {
        ffmpegOperate.splitTimeSharingImage(file, Object.values(defaultTimeSharing)).then((doneFile) => {
          setNewFileList((prevFileList: Array<VideoFileData>) => {
            const newFileList = prevFileList.map((file) => {
              if (file.id === doneFile.id) {
                return {
                  ...doneFile,
                  status: 'done',
                };
              } else {
                return file;
              }
            });
            return newFileList;
          });
          setActiveFileList((prevActiveFileList: Array<ActiveFileListItem>) => {
            const newActiveFileList = prevActiveFileList.map((file) => {
              if (file.bindId === doneFile.id) {
                return {
                  ...doneFile,
                  status: 'done',
                  id: file.id,
                  bindId: file.bindId,
                };
              } else {
                return file;
              }
            });
            return newActiveFileList;
          });
        });
      });
    }
  }, [fileList]);
  //handleActive
  useEffect(() => {
    if (activeFileList.length > 0) {
      const file = activeFileList[activeFileList.length - 1];
      if (!handleGetVideo()) {
        handleSetVideo(file, 0);
      }
      setAllTime((prevAllTime: number) => prevAllTime + file.duration);
    }
  }, [activeFileList]);
  useEffect(() => {
    if (currentTime) {
      const now = elapsedTime + currentTime;
      setCaliperCurrent(elapsedTime + currentTime);
      if (now === allTime) {
        videoStop();
      }
      if (
        activeFileList[activeVideoIndex] &&
        activeFileList[activeVideoIndex + 1] &&
        currentTime === activeFileList[activeVideoIndex].duration
      ) {
        setElapsedTime(elapsedTime + activeFileList[activeVideoIndex].duration);
        handleSetVideo(activeFileList[activeVideoIndex + 1]);
        setActiveVideoIndex(activeVideoIndex + 1);
      }
    }
  }, [currentTime]);
  useEffect(() => {
    if (play) {
        console.log(caliperCurrent,allTime)
      if (caliperCurrent === allTime) {
        setElapsedTime(0);
        setCaliperCurrent(0);
        if (activeFileList.length > 0) {
          handleSetVideo(activeFileList[0], 0);
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
  // video operations
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
      const videoData = (await ffmpegOperate.readFile(data.filename)) as Uint8Array;
      setVideo(videoData);
      if (currentTime) {
        video.currentTime = currentTime;
      }
      if (play) {
        videoPlay();
      }
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
  const setVideo = (binary: Uint8Array) => {
    const url = getUrl(binary, { type: 'video/mp4' });
    if (videoRef.current) {
      videoRef.current.src = url;
    }
  };
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
        <video className="w-auto h-full" ref={videoRef}></video>
      </div>
      <div className="operateArea grow  h-0">
        <div className="w-full h-12 flex justify-center items-center border border-gray" ref={messageRef}>
          message
        </div>
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
  );
};
