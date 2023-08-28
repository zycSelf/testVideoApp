export const MIME_TYPE_JAVASCRIPT = 'text/javascript';
export const MIME_TYPE_WASM = 'application/wasm';

export const CORE_VERSION = '0.12.1';
export const CORE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`;

export enum FFMessageType {
  LOAD = 'LOAD',
  EXEC = 'EXEC',
  EXEC_FFPROBE = 'EXEC_FFPROBE',
  WRITE_FILE = 'WRITE_FILE',
  WRITE_FILE_FFPROBE = 'WRITE_FILE_FFPROBE',
  READ_FILE = 'READ_FILE',
  READ_FILE_FFPROBE = 'READ_FILE_FFPROBE',
  DELETE_FILE = 'DELETE_FILE',
  DELETE_FFPROBE_FILE = 'DELETE_FFPROBE_FILE',
  RENAME = 'RENAME',
  CREATE_DIR = 'CREATE_DIR',
  LIST_DIR = 'LIST_DIR',
  DELETE_DIR = 'DELETE_DIR',
  DELETE_FFPROBE_DIR = 'DELETE_FFPROBE_DIR',
  ERROR = 'ERROR',

  DOWNLOAD = 'DOWNLOAD',
  PROGRESS = 'PROGRESS',
  LOG = 'LOG',
  EXTRACT_FRAME = 'EXTRACT_FRAME',

  // ADDITIONAL_FONCTION
  GET_VIDEO_BASICPARAMS = 'GET_VIDEO_BASICPARAMS',
  GET_KEYFRAME_LIST = 'GET_KEYFRAME_LIST',
  //
  OFF_SCREEN_CANVAS = 'OFF_SCREEN_CANVAS',
  RENDER_OFF_SCREEN_CANVAS = 'RENDER_OFF_SCREEN_CANVAS',
}
