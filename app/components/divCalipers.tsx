import { VideoFileData, DragData } from './videoView';
import { useRef, useState } from 'react';

interface CalipersProps {
  dragData: DragData | null;
  currentTime: number | null;
  handleChangeCalipersTime: (time: number) => void;
}
type ActiveFileList = VideoFileData & {
  status: 'idle' | 'loading' | 'done';
};
export const Calipers = ({ dragData, currentTime, handleChangeCalipersTime }: CalipersProps) => {
  const videoAndAudioRef = useRef<HTMLDivElement>(null);
  const [activeFileList, setActiveFileList] = useState<Array<ActiveFileList>>([]);
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
  return (
    <div className="flex flex-col bg-black w-full h-full">
      <div className="h-8 w-full bg-red">operateArea</div>
      <div className="flex flex-row flex-1 border-t border-gray">
        <div className="icons h-full w-8">left</div>
        <div className="caliper h-full flex-1 flex flex-row relative">
          <div
            ref={videoAndAudioRef}
            onDrop={handleDropVideo}
            onDragEnter={handleDragEnterVideoArea}
            onDragLeave={handleDragLeaveVideoArea}
            className="videoAndAudio h-16 bg-slate-400 w-full absolute top-16"
          ></div>
        </div>
      </div>
    </div>
  );
};
