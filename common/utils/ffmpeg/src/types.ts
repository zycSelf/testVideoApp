export type FFFSPath = string;

/**
 * ffmpeg-core loading configuration.
 */
export interface FFMessageLoadConfig {
  /**
   * `ffmpeg-core.js` URL.
   *
   * @defaultValue `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`;
   */
  coreURL?: string;
  /**
   * `ffmpeg-core.wasm` URL.
   *
   * @defaultValue `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.wasm`;
   */
  wasmURL?: string;
  ffprobeCoreURL?:string;
  ffprobeWasmURL?: string;
  ffprobeWorkerURL?: string;
  /**
   * `ffmpeg-core.worker.js` URL, only being loaded when `thread` is `true`.
   *
   * @defaultValue `https://unpkg.com/@ffmpeg/core-mt@${CORE_VERSION}/dist/umd/ffmpeg-core.worker.js`;
   */
  workerURL?: string;
}

export interface FFMessageExecData {
  args: string[];
  timeout?: number;
}

export interface FFMessageWriteFileData {
  path: FFFSPath;
  data: FileData;
}

export interface FFMessageReadFileData {
  path: FFFSPath;
  encoding: string;
}

export interface FFMessageDeleteFileData {
  path: FFFSPath;
}

export interface FFMessageGetBasicParams {
  path: FFFSPath;
}

export interface FFMessageRenameData {
  oldPath: FFFSPath;
  newPath: FFFSPath;
}

export interface FFMessageCreateDirData {
  path: FFFSPath;
}

export interface FFMessageListDirData {
  path: FFFSPath;
}

export interface Format {
  duration:string
  size:string
  filename:string
}
export interface Streams {
  width:number
  height:number
}
export interface Programs {
}
export interface FFMessageVideoBasicParams {
  format:Format
  programs:Array<Programs>
  streams:Array<Streams>
}

export interface FFMessageFrameList {
  frameList:Array<FFMessageKeyFrameList>
  keyFrameList:Array<FFMessageKeyFrameList>
}

export interface FFMessageKeyFrameList {
  key_frame:number
  pts_time:string
  width:number
  height:number
  pict_tyep:string
}

export interface FFMessageKeyFrameListData {
  frameList:FFMessageKeyFrameList[]
  keyFrameList:FFMessageKeyFrameList[]
  keyFrameImageList:Uint8Array[]
}

/**
 * @remarks
 * Only deletes empty directory.
 */
export interface FFMessageDeleteDirData {
  path: FFFSPath;
}

export type FFMessageData =
  | FFMessageLoadConfig
  | FFMessageExecData
  | FFMessageWriteFileData
  | FFMessageReadFileData
  | FFMessageDeleteFileData
  | FFMessageRenameData
  | FFMessageCreateDirData
  | FFMessageListDirData
  | FFMessageDeleteDirData;

export interface Message {
  type: string;
  data?: FFMessageData;
}

export interface FFMessage extends Message {
  id: number;
}

export interface FFMessageEvent extends MessageEvent {
  data: FFMessage;
}

export interface LogEvent {
  type: string;
  message: string;
}

export interface ProgressEvent {
  progress: number;
  time: number;
}

export type ExitCode = number;
export type ErrorMessage = string;
export type FileData = Uint8Array | string;
export type IsFirst = boolean;
export type OK = boolean;

export interface FSNode {
  name: string;
  isDir: boolean;
}

export type CallbackData =
  | FileData
  | ExitCode
  | ErrorMessage
  | LogEvent
  | ProgressEvent
  | IsFirst
  | OK
  | Error
  | FSNode[]
  | undefined
  | FFMessageKeyFrameListData
  | FFMessageVideoBasicParams

export interface Callbacks {
  [id: number | string]: (data: CallbackData) => void;
}

export type LogEventCallback = (event: LogEvent) => void;
export type ProgressEventCallback = (event: ProgressEvent) => void;

export interface FFMessageEventCallback {
  data: {
    id: number;
    type: string;
    data: CallbackData;
  };
}
