/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type {
  FFMessageEvent,
  FFMessageLoadConfig,
  FFMessageExecData,
  FFMessageWriteFileData,
  FFMessageReadFileData,
  FFMessageDeleteFileData,
  FFMessageRenameData,
  FFMessageCreateDirData,
  FFMessageListDirData,
  FFMessageDeleteDirData,
  FFMessageKeyFrameListData,
  CallbackData,
  IsFirst,
  OK,
  ExitCode,
  FSNode,
  FileData,
  FFMessageGetBasicParams,
  FFMessageKeyFrameList,
  FFMessageVideoBasicParams,
  FFMessageFrameList,
} from './types';
import { CORE_URL, FFMessageType } from './const';
import { ERROR_UNKNOWN_MESSAGE_TYPE, ERROR_NOT_LOADED, ERROR_IMPORT_FAILURE } from './errors';
import createFFmpegCore from '@/public/core/ffmpeg/esm/ffmpeg-core';
import createFFprobeCore from '@/public/core/ffprobe/esm/ffprobe-core';
import type { Log, FFmpegCoreModule, FFmpegCoreModuleFactory } from '@/app/common/utils/types/types';
import { param } from 'ts-interface-checker';

declare global {
  interface WorkerGlobalScope {
    createFFmpegCore: FFmpegCoreModuleFactory;
    createFFprobeCore: FFmpegCoreModuleFactory;
  }
}

interface ImportedFFmpegCoreModuleFactory {
  default: FFmpegCoreModuleFactory;
}

let ffmpeg: FFmpegCoreModule;
let ffprobe: FFmpegCoreModule;
let ffprobeLogger: Array<any> = [];

const clearFfprobeLogger = () => {
  ffprobeLogger = [];
};

const load = async ({
  coreURL: _coreURL = CORE_URL,
  wasmURL: _wasmURL,
  ffprobeCoreURL: _ffprobeCoreURL,
  ffprobeWasmURL: _ffprobeWasmURL,
  ffprobeWorkerURL: _ffprobeWorkerURL,
  workerURL: _workerURL,
}: FFMessageLoadConfig): Promise<IsFirst> => {
  const first = !ffmpeg;
  const second = !ffprobe;
  const coreURL = _coreURL;
  const wasmURL = _wasmURL ? _wasmURL : _coreURL.replace(/.js$/g, '.wasm');
  const ffprobeCore = _ffprobeCoreURL;
  const ffprobeWasmURL = _ffprobeWasmURL;
  const workerURL = _workerURL ? _workerURL : _coreURL.replace(/.js$/g, '.worker.js');
  const ffprobeWorkerURL = _ffprobeWorkerURL ? _ffprobeWorkerURL : _ffprobeCoreURL.replace(/.js$/g, '.worker.js');
  try {
    // when web worker type is `classic`.
    importScripts(coreURL);
    if (ffprobeCore) {
      console.log('挂载ffprobe');
      importScripts(ffprobeCore);
    }
  } catch {
    // when web worker type is `module`.
    (self as WorkerGlobalScope).createFFmpegCore = (
      (await import(/* @vite-ignore */ coreURL)) as ImportedFFmpegCoreModuleFactory
    ).default;

    if (!(self as WorkerGlobalScope).createFFmpegCore) {
      throw ERROR_IMPORT_FAILURE;
    }
  }
  ffmpeg = await (self as WorkerGlobalScope).createFFmpegCore({
    // Fix `Overload resolution failed.` when using multi-threaded ffmpeg-core.
    // Encoded wasmURL and workerURL in the URL as a hack to fix locateFile issue.
    mainScriptUrlOrBlob: `${coreURL}#${btoa(JSON.stringify({ wasmURL, workerURL }))}`,
  });
  ffmpeg.setLogger((data) => self.postMessage({ type: FFMessageType.LOG, data }));
  ffmpeg.setProgress((data) =>
    self.postMessage({
      type: FFMessageType.PROGRESS,
      data,
    }),
  );
  ffprobe = await (self as WorkerGlobalScope).createFFprobeCore({
    // Fix `Overload resolution failed.` when using multi-threaded ffmpeg-core.
    // Encoded wasmURL and workerURL in the URL as a hack to fix locateFile issue.
    mainScriptUrlOrBlob: `${ffprobeCore}#${btoa(
      JSON.stringify({ wasmURL: ffprobeWasmURL, workerURL: ffprobeWorkerURL }),
    )}`,
  });
  ffprobe.setLogger((data) => {
    ffprobeLogger.push(data);
    return self.postMessage({ type: FFMessageType.LOG, data });
  });
  ffprobe.setProgress((data) =>
    self.postMessage({
      type: FFMessageType.PROGRESS,
      data,
    }),
  );
  return first;
};

const exec = ({ args, timeout = -1 }: FFMessageExecData): ExitCode => {
  ffmpeg.setTimeout(timeout);
  ffmpeg.exec(...args);
  console.log('ffmpeg ', ...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
};

const execFFprobe = ({ args, timeout = -1 }: FFMessageExecData): ExitCode => {
  ffprobe.setTimeout(timeout);
  ffprobe.exec(...args);
  console.log('ffprobe ', ...args);
  const ret = ffprobe.ret;
  ffprobe.reset();
  return ret;
};

const writeFile = ({ path, data }: FFMessageWriteFileData): OK => {
  ffmpeg.FS.writeFile(path, data);
  return true;
};

const writeFileFFprobe = ({ path, data }: FFMessageWriteFileData): OK => {
  console.log('ffprobe written');
  ffprobe.FS.writeFile(path, data);
  console.log('ffprobe write done');
  return true;
};

const readFile = ({ path, encoding }: FFMessageReadFileData): FileData => ffmpeg.FS.readFile(path, { encoding });
const readFileFFprobe = ({ path, encoding }: FFMessageReadFileData): FileData =>
  ffprobe.FS.readFile(path, { encoding });
// TODO: check if deletion works.
const deleteFile = ({ path }: FFMessageDeleteFileData): OK => {
  ffmpeg.FS.unlink(path);
  return true;
};
const deleteFFprobeFile = ({ path }: FFMessageDeleteFileData): OK => {
  ffprobe.FS.unlink(path);
  return true;
};
const rename = ({ oldPath, newPath }: FFMessageRenameData): OK => {
  ffmpeg.FS.rename(oldPath, newPath);
  return true;
};

// TODO: check if creation works.
const createDir = ({ path }: FFMessageCreateDirData): OK => {
  ffmpeg.FS.mkdir(path);
  return true;
};

const listDir = ({ path }: FFMessageListDirData): FSNode[] => {
  const names = ffmpeg.FS.readdir(path);
  const nodes: FSNode[] = [];
  for (const name of names) {
    const stat = ffmpeg.FS.stat(`${path}/${name}`);
    const isDir = ffmpeg.FS.isDir(stat.mode);
    nodes.push({ name, isDir });
  }
  return nodes;
};

// TODO: check if deletion works.
const deleteDir = ({ path }: FFMessageDeleteDirData): OK => {
  ffmpeg.FS.rmdir(path);
  return true;
};
const deleteFFprobeDir = ({ path }: FFMessageDeleteDirData): OK => {
  ffprobe.FS.rmdir(path);
  return true;
};

const getVideoBasicParams = ({ path }: FFMessageGetBasicParams): FFMessageVideoBasicParams => {
  const file = ffprobe.FS.readFile(path, { encoding: 'binary' });
  console.log(file);
  const args = [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height',
    '-show_entries',
    'format=duration,size,filename',
    '-of',
    'json',
  ].concat(path);
  ffprobe.setTimeout(-1);
  const params = ffprobe.exec(...args);
  const check = checkLogger(ffprobeLogger);
  console.log(check);
  if (!check.status) {
    throw new Error(JSON.stringify(check));
  }
  const logger = check.data as Log[];
  const jsonData = logger.map((log) => log.message).join('');
  ffprobe.reset();
  return JSON.parse(jsonData);
};
const getKeyFrameList = (path: string): FFMessageFrameList => {
  const args = [
    '-i',
    path,
    '-v',
    'quiet',
    '-select_streams',
    'v:0',
    '-show_entries',
    'frame=pts_time,key_frame,pict_type,height,width',
    '-of',
    'json',
  ];

  ffprobe.setTimeout(-1);
  ffprobe.exec(...args);
  const loggerCheck = checkLogger(ffprobeLogger);
  if (!loggerCheck.status) {
    throw new Error(JSON.stringify(loggerCheck));
  }
  const framesData: any = generateJsonData(loggerCheck.data);
  const keyFrameList: Array<any> = framesData.frames.filter((frame: any) => frame.key_frame === 1);
  const frameList = framesData;
  return {
    frameList,
    keyFrameList,
  };
};
const getKeyFrameImageList = (path: string, count: number, encoding = 'binary'): Array<Uint8Array> => {
  const outputPath = '/keyframeImagePath';
  const outputPathBinary = ffmpeg.FS.mkdir(outputPath) as any;
  console.log(outputPath);
  const args = [
    '-i',
    path,
    '-vf',
    'select=' + 'eq(pict_type' + '\\,' + 'I)',
    '-vsync',
    '2',
    '-f',
    'image2',
    `${outputPath}/${path.split('.')[0]}-%02d.png`,
  ];
  ffmpeg.exec(...args);
  console.log('generageImageDone');
  const imageNameList = Object.keys(outputPathBinary.contents) as Array<string>;
  const imageBinaryList = imageNameList.map((name) => {
    const path = `${outputPath}/${name}`;
    const binary = ffmpeg.FS.readFile(path, { encoding }) as Uint8Array;
    ffmpeg.FS.unlink(path);
    return binary;
  });
  console.log(imageBinaryList);
  ffmpeg.FS.rmdir(outputPath);
  // const imageBlobList = imageBinaryList.map(binary => btoa(binary.buffer))
  return imageBinaryList;
};
const getKeyFrameInfoList = ({ path }: FFMessageGetBasicParams): FFMessageKeyFrameListData => {
  const { frameList, keyFrameList } = getKeyFrameList(path);
  const keyFrameImageList = getKeyFrameImageList(path, keyFrameList.length);
  return {
    frameList,
    keyFrameList,
    keyFrameImageList,
  };
};
function generateJsonData(data: Array<Log>) {
  return JSON.parse(data.map((log) => log.message).join(''));
}
function checkLogger(data: Array<Log>) {
  if (data.some((log) => log.type === 'stderr')) {
    const log = data.filter((log) => log.type === 'stderr');
    return {
      status: false,
      data: log,
    };
  } else {
    return {
      status: true,
      data,
    };
  }
}

self.onmessage = async ({ data: { id, type, data: _data } }: FFMessageEvent): Promise<void> => {
  const trans = [];
  let data: CallbackData;
  try {
    if (type !== FFMessageType.LOAD && !ffmpeg) throw ERROR_NOT_LOADED;

    console.log(type);
    switch (type) {
      case FFMessageType.LOAD:
        data = await load(_data as FFMessageLoadConfig);
        break;
      case FFMessageType.EXEC:
        data = exec(_data as FFMessageExecData);
        break;
      case FFMessageType.EXEC_FFPROBE:
        data = execFFprobe(_data as FFMessageExecData);
        break;
      case FFMessageType.WRITE_FILE:
        data = writeFile(_data as FFMessageWriteFileData);
        break;
      case FFMessageType.WRITE_FILE_FFPROBE:
        data = writeFileFFprobe(_data as FFMessageWriteFileData);
        break;
      case FFMessageType.READ_FILE:
        data = readFile(_data as FFMessageReadFileData);
        break;
      case FFMessageType.READ_FILE_FFPROBE:
        data = readFileFFprobe(_data as FFMessageReadFileData);
        break;
      case FFMessageType.DELETE_FILE:
        data = deleteFile(_data as FFMessageDeleteFileData);
        break;
      case FFMessageType.DELETE_FFPROBE_FILE:
        data = deleteFFprobeFile(_data as FFMessageDeleteFileData);
        break;
      case FFMessageType.RENAME:
        data = rename(_data as FFMessageRenameData);
        break;
      case FFMessageType.CREATE_DIR:
        data = createDir(_data as FFMessageCreateDirData);
        break;
      case FFMessageType.LIST_DIR:
        data = listDir(_data as FFMessageListDirData);
        break;
      case FFMessageType.DELETE_DIR:
        data = deleteDir(_data as FFMessageDeleteDirData);
        break;
      case FFMessageType.DELETE_FFPROBE_DIR:
        data = deleteFFprobeDir(_data as FFMessageDeleteDirData);
        break;
      case FFMessageType.GET_VIDEO_BASICPARAMS:
        data = getVideoBasicParams(_data as FFMessageGetBasicParams);
        break;
      case FFMessageType.GET_KEYFRAME_LIST:
        data = getKeyFrameInfoList(_data as FFMessageGetBasicParams);
        break;
      default:
        throw ERROR_UNKNOWN_MESSAGE_TYPE;
    }
    clearFfprobeLogger();
  } catch (e) {
    self.postMessage({
      id,
      type: FFMessageType.ERROR,
      data: (e as Error).toString(),
    });
    return;
  }
  if (data instanceof Uint8Array) {
    trans.push(data.buffer);
  }
  self.postMessage({ id, type, data }, trans);
};
