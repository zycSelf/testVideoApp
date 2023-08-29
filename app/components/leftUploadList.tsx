import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { VideoDisplayPic } from './videoDisplay';
import { DragData, FFmpegOperate, VideoFileData } from './videoView';
import { getUrl } from '@/app/utils/getBlobUrl';
import { fetchFile } from '@/common/utils/util/src';
import { FileData } from '@/common/utils/ffmpeg/src/types';
import { PicBlobUrl } from './operateList';

interface UploadListProps {
  ffmpegOperate: FFmpegOperate;
  fileList: Array<VideoFileData>;
  setNewFileList: (fileList: Array<VideoFileData>) => void;
  setDragData: Dispatch<SetStateAction<DragData | null>>;
}

export const LeftUploadist = ({ fileList, ffmpegOperate, setNewFileList, setDragData }: UploadListProps) => {
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const [running, setRunning] = useState<boolean>(false);
  const uploadFile = async (file: File) => {
    if (!running) {
      setRunning(true);
      const filename = file.name;
      await uploadFileInfo(filename, false, file);
      setRunning(false);
    }
  };
  const uploadFileInfo = async (filename: string, isWriten: boolean, file: File) => {
    await writeAndDel(filename, file);
    console.log('writeAndDelDone');
    await addFileListData(filename, file);
  };
  const writeAndDel = async (filename: string, file: File) => {
    if (file) {
      await ffmpegOperate.writeFile(filename, await fetchFile(file));
      await ffmpegOperate.writeFileFFprobe(filename, await fetchFile(file));
    } else {
      let fileData;
      console.log(filename);
      fileData = await ffmpegOperate.readFile(filename);
      if (!fileData) {
        fileData = await ffmpegOperate.readFileFFprobe(filename);
        await ffmpegOperate.writeFile(filename, fileData);
        return;
      }
      await ffmpegOperate.writeFileFFprobe(filename, fileData);
    }
  };
  const handleVideoPicDragStart = (id: string, type: string) => {
    const dragData = fileList.find((file) => file.id === id);
    if (dragData) {
      setDragData({
        type,
        data: dragData,
      });
    }
  };
  const addFileListData = async (filename: string, file: File) => {
    const basicParams = await ffmpegOperate.getVideoBasicParams(filename);
    const currentTime = 0;
    const id = new Date().getTime().toString();
    const startTime = 0;
    const duration = Number(basicParams.format.duration);
    const endTime = startTime + duration;
    const scale = {
      width: basicParams.streams[0].width,
      height: basicParams.streams[0].height,
    };
    const firstPicBinary = (await ffmpegOperate.getPicByTime(filename, currentTime, scale)) as Uint8Array;
    const firstPicBlobUrl = getUrl(firstPicBinary, { type: 'image/png' });
    const status = 'idle';
    const picBlobUrlMap: {
      [key: string]: Array<PicBlobUrl>;
    } = {};
    const newFileListItem = {
      id,
      file,
      filename,
      firstPicBinary,
      firstPicBlobUrl,
      startTime,
      endTime,
      scale,
      duration,
      params: basicParams,
      status,
      picBlobUrlMap,
    };
    setNewFileList(fileList.concat(newFileListItem));
  };
  return (
    <div className="upload relative shrink-0 flex-col w-52 h-full border-black border-r flex items-center">
      <input
        ref={uploadFileRef}
        type={'file'}
        className="hidden"
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          if (target.files && target.files.length > 0) {
            uploadFile(target.files[0]);
          }
        }}
      />
      {fileList.map((fileData) => {
        return <VideoDisplayPic key={fileData.id} {...fileData} handleDragStart={handleVideoPicDragStart} />;
      })}
      <button
        className="absolute bottom-0 w-auto text-white border border-black border-solid flex justify-center items-center p-4"
        onClick={() => {
          uploadFileRef.current?.click();
        }}
      >
        uploadFile
      </button>
    </div>
  );
};
