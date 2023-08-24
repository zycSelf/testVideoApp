import Image from 'next/image';
import { VideoFileData, DragData } from './videoView';
import { Suspense, useEffect, useRef, useState } from 'react';

interface CalipersProps {
  dragData: DragData | null;
  currentTime: number | null;
  handleChangeCalipersTime: (time: number) => void;
  handleSplitImage: (file: ActiveFileListItem, splitTime: number) => Promise<ActiveFileListItem>;
}
export type ActiveFileListItem = VideoFileData & {
  status: 'idle' | 'loading' | 'done';
  picBlobUrlList?: Array<PicBlobUrl>;
};
interface PicBlobUrl {
  id: string;
  time: number;
  value: string;
}
export const Calipers = ({ dragData, currentTime, handleChangeCalipersTime, handleSplitImage }: CalipersProps) => {
  const videoAndAudioRef = useRef<HTMLDivElement>(null);
  // 12rem => timeSharing / 1000
  const [timeSharing, setTimeSharing] = useState<number>(2000);
  const [activeFileList, setActiveFileList] = useState<Array<ActiveFileListItem>>([]);
  useEffect(() => {
    if (activeFileList.length > 0) {
      const file = activeFileList[activeFileList.length - 1];
      if (file.status === 'idle') {
        handleSplitImage(file, timeSharing / 2).then((fileWithPicBlob: ActiveFileListItem) => {
          const newActiveFileList = activeFileList.map((item) => {
            if (item.id === fileWithPicBlob.id) {
              return fileWithPicBlob;
            } else {
              return item;
            }
          });
          setActiveFileList(newActiveFileList);
        });
      }
    }
  }, [activeFileList]);
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
      const secondTimeSharing = timeSharing / 1000;
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
            className="w-16 h-full flex flex-col select-none overflow-hidden pt-3 pb-2 bg-videoCaliperBG"
          >
            <div>
              <div></div>
              <div>
                {file.picBlobUrlList?.map((item: PicBlobUrl) => {
                  return (
                    <img
                      alt=""
                      key={item.id}
                      src={item.value}
                      style={{ width: `${6}rem` }}
                      className="select-none"
                      draggable={false}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
    });
    return activeFileListElements;
  };
  return (
    <div className="flex flex-col bg-black w-full h-full">
      <div className="h-8 w-full bg-red">operateArea</div>
      <div className="flex flex-row flex-1 border-t border-gray">
        <div className="icons h-full w-8">left</div>
        <div className="caliper h-full flex-1 flex flex-row relative">
          <div
            ref={videoAndAudioRef}
            onDrop={handleDropVideo}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDragEnter={handleDragEnterVideoArea}
            onDragLeave={handleDragLeaveVideoArea}
            className="videoAndAudio overflow-scroll flex flex-row  h-16 bg-slate-400 w-full absolute top-16"
          >
            {generateActiveFileList()}
          </div>
        </div>
      </div>
    </div>
  );
};
