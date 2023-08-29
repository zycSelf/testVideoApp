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
  offscreenCanvas: (canvas: OffscreenCanvas) => Promise<void>;
  renderOffscreenCanvas: (imageBitMap: ImageBitmap, renderSize: { width: number; height: number }) => Promise<void>;
  exportFile: { status: string; data: Uint8Array | null };
  exportFileData: (basic: { width: number; height: number }) => void;
}
export const VideoPlayer = ({
  currentTime,
  play,
  activeVideoItem,
  setPlay,
  setCurrentTime,
  offscreenCanvas,
  renderOffscreenCanvas,
  exportFile,
  exportFileData,
}: VideoPlayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const calcuRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const [basicSize, setBasicSize] = useState<{ width: number; height: number } | null>(null);
  const [basicScale, setBasicScale] = useState<{ width: number; height: number }>({
    width: 1920,
    height: 1080,
  });
  const [offset, setOffset] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });
  useEffect(() => {
    if (activeVideoItem) {
      getDBData(fileDir.local + activeVideoItem.filename).then((data) => {
        if (data) {
          const contents = data.contents as Uint8Array;
          const url = getUrl(contents, { type: 'video/mp4' });
          const video = videoRef.current;
          if (video) {
            video.src = url;
            if (!basicSize || !basicScale) {
              setBasicScale(activeVideoItem.scale);
              setBasicSize(generateCanvasSize(activeVideoItem.scale));
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
    } else {
      videoStop();
    }
  }, [play]);
  useEffect(() => {
    if (exportFile.status === 'start') {
      exportFileData(basicScale);
    }
  }, [exportFile]);
  const videoPlay = () => {
    const video = videoRef.current;
    if (video) {
      video.play();
      video.onended = () => {
        setCurrentTime(video.currentTime);
      };
      video.requestVideoFrameCallback(updateCanvas);
    }
  };
  const videoStop = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
  };
  const updateCanvas = (now, metadata) => {
    const video = videoRef.current;
    if (video) {
      const videoCurrentTime = videoRef.current?.currentTime;
      setCurrentTime(videoCurrentTime);
      if (!video.ended && play) {
        const video = videoRef.current;
        createImageBitmap(video).then((data) => {
          const canvas = canvasRef.current;
          generateImageSizeAndPosBeforeRender(data);
          renderOffscreenCanvas(data, basicSize!);
          video.requestVideoFrameCallback(updateCanvas);
        });
      }
    }
  };
  const transControl = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const OSCanvas = canvas.transferControlToOffscreen();
      offscreenCanvas(OSCanvas);
    }
  };
  const generateCanvasSize = ({ width, height }: { width: number; height: number }) => {
    const calcuBox = calcuRef.current;
    const canvas = canvasRef.current;
    const basicScale = width / height;
    if (calcuBox && canvas) {
      let size;
      const boxWidth = calcuBox.offsetWidth;
      const boxHeight = calcuBox.offsetHeight;
      if (width > height) {
        size = {
          width: boxWidth,
          height: boxWidth / basicScale,
        };
      } else {
        size = {
          width: boxHeight * basicScale,
          height: boxHeight,
        };
      }
      return size;
    } else {
      return null;
    }
  };
  const generateImageSizeAndPosBeforeRender = (data: ImageBitmap) => {
    const imageSize = {
      width: data.width,
      height: data.height,
    };
    // TODO
    const imageWidthBigger = imageSize.width >= activeVideoItem.scale.width;
    const imageHeightBigger = imageSize.height >= activeVideoItem.scale.height;
    const canvas = canvasRef.current;
    if (canvas) {
      if (imageWidthBigger && imageHeightBigger) {
        if (imageSize.width > imageSize.height) {
          canvas.style.setProperty('height', '100%');
          canvas.style.removeProperty('width');
        } else {
          canvas.style.setProperty('width', '100%');
          canvas.style.removeProperty('height');
        }
      }
      if (imageWidthBigger || imageHeightBigger) {
        if (imageWidthBigger) {
          canvas.style.setProperty('width', '100%');
          canvas.style.removeProperty('height');
        }
        if (imageHeightBigger) {
          canvas.style.setProperty('height', '100%');
          canvas.style.removeProperty('width');
        }
      }
      if (!imageWidthBigger && !imageHeightBigger) {
        const scaleWidth = activeVideoItem.scale.width / imageSize.width;
        const scaleHeight = activeVideoItem.scale.height / imageSize.height;
        if (basicSize) {
          canvas.style.setProperty('height', basicSize.height / scaleHeight + 'px');
          canvas.style.setProperty('height', basicSize.width / scaleWidth + 'px');
        }
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
    <div className="w-full h-full relative flex justify-center items-center overflow-hidden">
      <div
        ref={calcuRef}
        style={basicSize ? basicSize : {}}
        className="w-full h-full relative flex justify-center items-center bg-black overflow-hidden"
      >
        <canvas ref={canvasRef} className="" />
      </div>
    </div>
  );
};
