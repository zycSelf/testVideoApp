'use client';
import Image from 'next/image';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  useEffect(() => {
    initFFmpeg();
  }, []);
  const initFFmpeg = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
    const ffmpeg = ffmpegRef.current;
    if (ffmpeg) {
      await ffmpeg.load({
        coreURL: baseURL + '/ffmpeg-core.js',
        wasmURL: baseURL + '/ffmpeg-core.wasm',
      });
      const status = await ffmpegRef.current.load({
        wasmURL: '/ffmpeg/ffmpeg-core.wasm',
        coreURL: '/ffmpeg/ffmpeg-core.js',
      });
      await ffmpeg.on('log', ({ message }) => {
        if (messageRef.current) {
          messageRef.current.innerText = message;
        }
      });
      setLoaded(true);
    }
  };
  const transcode = async () => {
    console.log('transcode');
    const ffmpeg = ffmpegRef.current;
    const videoFile = await fetchFile('/test.mp4');
    console.log(videoFile);
    const inputFile = await ffmpeg.writeFile('/input.avi', videoFile);
    console.log(inputFile);
    const outputFile = await ffmpeg.exec(['-i', '/input.avi', '/output.mp4']).then((data) => {
      console.log(data);
      return data;
    });
    console.log(outputFile);
    const data = await ffmpeg.readFile('/output.mp4');
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
    }
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {loaded ? (
        <div>
          <video style={{ maxWidth: 300 }} ref={videoRef} controls></video>
          <button onClick={transcode}>Transcode avi to mp4</button>
          <div ref={messageRef}>true</div>
        </div>
      ) : (
        <div>loading</div>
      )}
    </main>
  );
}
