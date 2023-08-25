import Image from 'next/image';
import { VideoFileData, DragData } from './videoView';
import { Suspense, useEffect, useRef, useState } from 'react';
import { generateMMSSTime, generateTime } from '../utils/generateTime';

interface CalipersProps {
  isPlay: boolean;
  dragData: DragData | null;
  currentTime: number | null; //second 秒计时
  handleChangeCalipersTime: (time: number) => void;
  handleSplitImage: (file: ActiveFileListItem, splitTime: number) => Promise<ActiveFileListItem>;
  handleGetVideo: () => string | null;
  handleSetVideo: (data: ActiveFileListItem, currentTime?: number) => void;
  handlePlayVideo: () => void;
  handleStopVideo: () => void;
}
export type ActiveFileListItem = VideoFileData & {
  status: string;
  bindId: string;
  picBlobUrlList?: Array<PicBlobUrl>;
};
interface PicBlobUrl {
  id: string;
  time: number;
  value: string;
}
export type TimeSharing = typeof defaultTimeSharing.lv1;
const defaultTimeSharing = {
  lv1: {
    time: 2000,
    section: 10,
  },
  lv2: {
    time: 1000,
    section: 10,
  },
  lv3: {
    time: 500,
    section: 5,
  },
  lv4: {
    time: 200,
    section: 2,
  },
};
export const Calipers = ({
  isPlay,
  dragData,
  currentTime,
  handleChangeCalipersTime,
  handleSplitImage,
  handleGetVideo,
  handleSetVideo,
  handlePlayVideo,
  handleStopVideo,
}: CalipersProps) => {
  const videoAndAudioRef = useRef<HTMLDivElement>(null);
  const hourhandRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // 12rem => timeSharing.time / 1000
  const [timeSharing, setTimeSharing] = useState<TimeSharing>(defaultTimeSharing.lv1); // 2s 1s 0.5s 0.2s
  const [activeFileList, setActiveFileList] = useState<Array<ActiveFileListItem>>([]);
  const [allTime, setAllTime] = useState<number>(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [caliperCurrent, setCaliperCurrent] = useState<number>(0);
  useEffect(() => {
    if (activeFileList.length > 0) {
      const file = activeFileList[activeFileList.length - 1];
      if (!handleGetVideo()) {
        handleSetVideo(file, 0);
      }
      if (file.status === 'idle') {
        handleSplitImage(file, timeSharing.time / 2).then((fileWithPicBlob: ActiveFileListItem) => {
          const newActiveFileList = activeFileList.map((item) => {
            if (item.id === fileWithPicBlob.id) {
              return fileWithPicBlob;
            } else {
              return item;
            }
          });
          setAllTime(allTime + fileWithPicBlob.duration);
          setActiveFileList(newActiveFileList);
        });
      }
    }
  }, [activeFileList]);
  useEffect(() => {
    const hourHand = hourhandRef.current;
    if (hourHand && currentTime) {
      const now = elapsedTime + currentTime;
      setCaliperCurrent(elapsedTime + currentTime);
      console.log(currentTime, now, allTime);
      if (now === allTime) {
        handleStopVideo();
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
    if (isPlay) {
      if (caliperCurrent === allTime) {
        setElapsedTime(0);
        setCaliperCurrent(0);
        if (activeFileList.length > 0) {
          handleSetVideo(activeFileList[0], 0);
          setActiveVideoIndex(0);
        }
      }
    }
  }, [isPlay]);
  useEffect(() => {
    const time = 1000 * allTime;
    const count = Math.ceil(time / timeSharing.time) + 1;
    console.log(allTime);
  }, [allTime]);
  const handleDragEnterVideoArea = () => {
    if (dragData?.type === 'video') {
      console.log('dragOverOnVideo');
      toggleVideoClass();
    }
  };
  const handleDragLeaveVideoArea = () => {
    toggleVideoClass();
  };
  const handleDropVideo = () => {
    if (dragData) {
      const { type, data } = dragData;
      if (type === 'video') {
        const newActiveFileList = activeFileList.concat({
          ...data,
          status: 'idle',
          bindId: data.id,
          id: new Date().getTime().toString(),
        });
        setActiveFileList(newActiveFileList);
        toggleVideoClass();
      }
    }
  };
  const toggleVideoClass = () => {
    const ref = videoAndAudioRef.current;
    if (ref) {
      ref.classList.toggle('bg-slate-400');
      ref.classList.toggle('bg-green-400');
    }
  };
  const generateActiveFileList = () => {
    const activeFileListElements = activeFileList.map((file) => {
      const secondTimeSharing = timeSharing.time / 1000;
      const count = file.duration / secondTimeSharing;
      const rem = count * 12;
      if (file.status !== 'done') {
        return (
          <div key={file.id} style={{ width: `${rem}rem` }} className={`h-full`}>
            处理中
          </div>
        );
      } else {
        return (
          <div
            key={file.id}
            style={{ width: `${rem}rem` }}
            className="w-16 h-full flex flex-col select-none overflow-hidden bg-videoCaliperBG shrink-0"
          >
            <div className="header text-xs h-4">
              <span className="m-4">{file.filename}</span>
              <span className="m-4">{generateTime(file.duration)}</span>
            </div>
            <div className="body flex flex-row flex-1">
              {file.picBlobUrlList?.map((item: PicBlobUrl) => {
                return (
                  <div className="relative shrink-0 h-full" style={{ width: `${6}rem` }} key={item.value}>
                    <Image alt="" src={item.value} className="select-none" draggable={false} fill />
                  </div>
                );
              })}
            </div>
            <div className="footer h-2"></div>
          </div>
        );
      }
    });
    return activeFileListElements;
  };
  const getAllVideoDuration = () => {
    let duration = 0;
    if (activeFileList.length === 0) {
      return 10;
    } else {
      activeFileList.map((file) => {
        duration += file.duration;
      });
    }
    return duration;
  };
  return (
    <div className="flex flex-col bg-basicBgColor w-full h-full">
      <div className="h-8 w-full bg-red">operateArea</div>
      <div className="flex flex-row flex-1 border-t border-gray">
        <div className="icons h-full w-8">left</div>
        <div className="relative flex-1 overflow-auto">
          <div className="inline-flex relative min-w-full h-full">
            <TimeScaleLine timeSharing={timeSharing} duration={getAllVideoDuration()} />
            <div
              ref={videoAndAudioRef}
              onDrop={handleDropVideo}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDragEnter={handleDragEnterVideoArea}
              onDragLeave={handleDragLeaveVideoArea}
              className="videoAndAudio flex flex-row  h-16 bg-slate-400 w-full absolute top-16"
            >
              {generateActiveFileList()}
            </div>
            <div
              ref={hourhandRef}
              style={{ width: 1, transform: `translateX(${caliperCurrent * 6}rem)` }}
              className="h-full absolute bg-white transform-gpu"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
interface TimeScaleLineProps {
  timeSharing: TimeSharing;
  duration: number;
}
const TimeScaleLine = ({ timeSharing, duration }: TimeScaleLineProps) => {
  const tickMarkRef = useRef<HTMLDivElement>(null);
  const [params, setParams] = useState<{
    basicRem: number;
    maxDuration: number;
    bigTimeSharingCount: number;
  }>({
    basicRem: 12,
    maxDuration: 10 * 1000,
    bigTimeSharingCount: 5,
  });
  useEffect(() => {
    generateParams();
  }, [timeSharing, duration]);
  const generateParams = () => {
    const basicRem = 12;
    const maxDuration = Math.ceil(duration) * 1000; // 转 ms
    const bigTimeSharingCount = maxDuration / timeSharing.time; // 12rem => 1 count
    // const width = tickMarkRef.current?.offsetWidth;
    // const fontSize = document.getElementsByTagName('html')[0].style.fontSize
    //   ? Number(document.getElementsByTagName('html')[0].style.fontSize.split('px')[0])
    //   : 16;
    // console.log(fontSize);
    // while ((bigTimeSharingCount + 1) * basicRem * fontSize < width) {
    //   bigTimeSharingCount++;
    // }
    const basicParams = {
      basicRem,
      maxDuration,
      bigTimeSharingCount,
    };
    setParams(basicParams);
  };
  const renderTickMark = () => {
    const { basicRem, bigTimeSharingCount } = params;
    const domArr: Array<JSX.Element> = [];
    for (let i = 0; i <= bigTimeSharingCount; i++) {
      const time = generateMMSSTime((timeSharing.time * i) / 1000);
      const offset = basicRem * i;
      const bigTickMark = (
        <div style={{ transform: `translateX(${offset}rem)` }} className={`inline-flex transform-gpu text-xs`}>
          <div style={{ width: 1 }} className={`h-4 bg-white`} />
          <span className={'absolute top-2 left-1'}>{time}</span>
        </div>
      );
      domArr.push(bigTickMark);
    }
    return domArr;
  };
  return (
    <div
      ref={tickMarkRef}
      style={{ height: 3, width: `${(params.bigTimeSharingCount + 1) * 12 + 4}rem` }}
      className="block bg-white min-w-full"
    >
      {renderTickMark()}
    </div>
  );
};
