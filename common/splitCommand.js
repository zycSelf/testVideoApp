function splitCommand(str) {
    return str.split(" ")
}
console.log(splitCommand(`ffmpeg -y -i video.mp4 -vf boxBlur=2:1:cr=0:ar=0 video_blur.mp4`))