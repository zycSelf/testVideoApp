import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { ActiveFileListItem } from './operateList';
import { getDBData } from '../utils/dbActions';
import { fileDir } from './videoView';
import { getUrl } from '../utils/getBlobUrl';

interface VideoPlayerProps {
  play: boolean;
  currentTime: number;
  activeVideoItem: ActiveFileListItem;
  setPlay: Dispatch<SetStateAction<boolean>>;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  offscreenCanvas: (canvas: OffScreenCanvas) => Promise<void>;
  renderOffscreenCanvas: (videoFrame: VideoFrame) => Promise<void>;
}
export const VideoPlayer = ({
  currentTime,
  play,
  activeVideoItem,
  setCurrentTime,
  offscreenCanvas,
  renderOffscreenCanvas,
}: VideoPlayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const calcuRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const [videoValue, setVideoValue] = useState<Uint8Array>(null);
  const [basicScale, setBasicScale] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    if (activeVideoItem) {
      getDBData(fileDir.local + activeVideoItem.filename).then((data) => {
        if (data) {
          const contents = data.contents as Uint8Array;
          setVideoValue(contents);
          const url = getUrl(contents, { type: 'video/mp4' });
          const video = videoRef.current;
          if (video) {
            video.src = url;
            if (!basicScale) {
              setBasicScale(activeVideoItem.scale);
              // initCanvas(activeVideoItem.scale);
              transControl();
            }
            if (play) {
              videoPlay();
            }
          }
        }
      });
    }
  }, [activeVideoItem]);
  useEffect(() => {
    if (play) {
      videoPlay();
    }
  }, [play]);
  const videoPlay = () => {
    const video = videoRef.current;
    if (video) {
      video.play();
      updateCurrentTime();
    }
  };
  const updateCurrentTime = () => {
    const video = videoRef.current;
    if (video) {
      const currentTime = videoRef.current?.currentTime;
      setCurrentTime(currentTime);
      if (!video.ended || play) {
        video.requestVideoFrameCallback((frame, metaData) => {
          console.log(frame, metaData);
          console.log(videoValue);
          if (videoValue) {
            const videoFrame = new VideoFrame(videoValue, {
              timestamp: 2,
              codedWidth: 320,
              codedHeight: 200,
              format: 'RGBA',
            });
            renderOffscreenCanvas(videoFrame);
          }

          updateCurrentTime();
        });
      }
    }
  };
  const transControl = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const OSCanvas = canvas.transferControlToOffscreen();
      console.log(OSCanvas);
      offscreenCanvas(OSCanvas);
    }
  };
  const initCanvas = (data: typeof basicScale) => {
    const canvas = canvasRef.current;
    console.log(basicScale);
    if (data && canvas) {
      canvas.width = data.width;
      canvas.height = data.height;
      canvas.style.width = data.width + 'px';
      canvas.style.height = data.height + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // ctx.drawImage(activeVideoItem.firstPicBlobUrl, 0, 0, canvas.width, canvas.height);
      }
    }
  };
  //   const generateCanvasSize() {

  //   }
  const canvasDraw = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }
  };
  // video operations
  //   const handleGetVideo = () => {
  //     const video = videoRef.current;
  //     if (video) {
  //       return video.src;
  //     }
  //     return null;
  //   };
  //   const handleSetVideo = async (data: ActiveFileListItem, currentTime?: number) => {
  //     const video = videoRef.current;
  //     if (video) {
  //       const videoData = (await ffmpegOperate.readFile(data.filename)) as Uint8Array;
  //       setVideo(videoData);
  //       if (currentTime) {
  //         video.currentTime = currentTime;
  //       }
  //       if (play) {
  //         videoPlay();
  //       }
  //     }
  //   };
  //   const setVideo = (binary: Uint8Array) => {
  //     const url = getUrl(binary, { type: 'video/mp4' });
  //     if (videoRef.current) {
  //       videoRef.current.src = url;
  //     }
  //   };
  return (
    <div ref={calcuRef} className="w-full h-full relative">
      <canvas ref={canvasRef} />
    </div>
  );
};
