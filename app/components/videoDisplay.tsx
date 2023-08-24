import { FFMessageVideoBasicParams } from '@/common/utils/ffmpeg/src/types';
import Image from 'next/image';
import { generateTime } from '../utils/generateTime';
import { useEffect, useState } from 'react';

interface VideoDisplayProps {
  id: string;
  picBlobUrl: string;
  filename: string;
  params: FFMessageVideoBasicParams;
  handleDragStart: (id: string, type: string) => void;
}
export const VideoDisplayPic = ({ id, filename, params, picBlobUrl, handleDragStart }: VideoDisplayProps) => {
  const [round, setRound] = useState<number>(0);
  useEffect(() => {
    const duration = params.format.duration;
    const num = Number(duration);
    const round = Math.round(num);
    setRound(round);
  }, []);
  const handleDrag = () => {
    const type = 'video';
    handleDragStart(id, type);
  };
  return (
    <div draggable onDragStart={handleDrag} className="w-32 h-16 relative bg-picDisplay pb-4">
      <div className="w-full h-12 relative">
        <Image layout="fill" src={picBlobUrl} alt={filename} />
      </div>
      <span className="absolute bottom-0 right-0 text-xs">{generateTime(round).split('.')[0]}</span>
    </div>
  );
};
