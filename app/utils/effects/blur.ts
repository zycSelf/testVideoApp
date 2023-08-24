export const blurEffect = {
  time: 2,
  splitName: `split_${new Date().getTime()}.mp4`,
  outputName: `output_${new Date().getTime()}.mp4`,
  getSplitArgs: function (startTime: string, endTime: string, fileName: string) {
    return {
      args: [
        '-y',
        '-ss',
        startTime,
        '-to',
        endTime,
        '-i',
        fileName,
        '-vcodec',
        'copy',
        '-acodec',
        '-copy',
        this.splitName,
      ],
      outputName: this.splitName,
    };
  },
  getFilterArgs: function (width: number, height: number) {
    return {
      args: ['-y', '-i', this.splitName, '-vf', 'boxblur=2:1:cr=0:ar=0', this.outputName],
      outputName: this.outputName,
    };
  },
};
