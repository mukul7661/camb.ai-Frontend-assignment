import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Switch,
  Slider,
  Grid,
  Typography,
  Paper,
} from "@material-ui/core";
import { WaveFile } from "wavefile";
import { FFmpeg } from "@ffmpeg/ffmpeg";

import { fetchFile } from "@ffmpeg/util";

const ffmpeg = new FFmpeg({ log: true });

const initFFmpeg = async () => {
  await ffmpeg.load();
};

initFFmpeg();
const AudioMerger = ({ audioPills }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRefs = useRef([]);
  const intervalRef = useRef(null);
  const [isAudioAvailable, setIsAudioAvailable] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const currentAudioIndexRef = useRef([]);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    const mergeAndPlayAudioClips = async () => {
      try {
        const arrayOfArrayOfUrls = audioPills?.map((item) =>
          item?.items?.map((item1) => item1?.audioUrl)
        );

        currentAudioIndexRef.current = Array.from(
          Array(arrayOfArrayOfUrls.length),
          () => 0
        );
        console.log(
          "arrayOfArrayOfUrls",
          arrayOfArrayOfUrls,
          currentAudioIndexRef.current
        );

        if (arrayOfArrayOfUrls && arrayOfArrayOfUrls.length > 0) {
          handleStop();
          audioRefs.current = arrayOfArrayOfUrls.map((arrayOfUrls, index1) =>
            arrayOfUrls?.map((url, index2) => {
              const audioElement = new Audio(url);
              audioElement.load();

              audioElement.addEventListener("ended", () => {
                if (index2 < audioRefs.current.length - 1) {
                  currentAudioIndexRef.current =
                    currentAudioIndexRef.current.map((index) => {
                      if (index === index2) {
                        return index + 1;
                      }
                      return index;
                    });
                  playNextAudio(currentAudioIndexRef.current);
                } else {
                  handleStop();
                }
              });

              return audioElement;
            })
          );

          //   setTotalDuration(
          //     audioRefs.current.reduce(
          //       (total, audioElement) => total + audioElement.duration,
          //       0
          //     )
          //   );

          setIsAudioAvailable(true);
        } else {
          setIsAudioAvailable(false);
        }
      } catch (error) {
        console.error("Error loading audio:", error);
        setIsAudioAvailable(false);
      }
    };
    mergeAndPlayAudioClips();
  }, [audioPills]);

  const playNextAudio = (indexArray) => {
    indexArray.map((index, idx) => {
      if (audioRefs.current[idx][index]) {
        audioRefs.current[idx][index].play();
      }
      return null;
    });
  };

  const handlePlayPause = () => {
    if (audioRefs.current.length > 0) {
      if (!isPlaying) {
        setIsPlaying(true);
        playNextAudio(currentAudioIndexRef.current);
        startProgressInterval();
      } else {
        setIsPlaying(false);
        clearInterval(intervalRef.current);
        audioRefs.current.forEach((audioElementArray) => {
          audioElementArray?.map((audioElement) => audioElement.pause());
        });
      }
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setProgress(0);
    clearInterval(intervalRef.current);
    currentAudioIndexRef.current = Array.from(
      Array(currentAudioIndexRef.current.length),
      () => 0
    );
    audioRefs.current.forEach((audioElementArray) => {
      audioElementArray?.map((audioElement) => {
        audioElement.pause();
        audioElement.currentTime = 0;
      });
    });
  };

  const handleSeek = (event, newValue) => {
    if (audioRefs.current.length > 0) {
      audioRefs.current.forEach((audioElementArray) => {
        audioElementArray.map((audioElement) => {
          audioElement.pause();
          audioElement.currentTime = 0;
        });
      });
      let currentPos = 0,
        duration = 0;
      audioRefs.current.map((audioElementArray, index) => {
        let currentPosTemp = 0,
          tempDuration = 0;
        audioElementArray.map((audioElement) => {
          currentPosTemp += audioElement.currentTime;
          tempDuration += audioElement.duration;
          // currentPos += audioElement.currentTime;
          // duration += audioElement.duration;
          return null;
        });
        currentPos = Math.max(currentPosTemp, currentPos);
        duration = Math.max(duration, tempDuration);
      });

      let selectedDuration = duration * (newValue / 100);

      audioRefs.current.map((audioElementArray, index1) => {
        let selectedDurationTemp = selectedDuration;
        audioElementArray.map((audioElement, index) => {
          if (selectedDuration <= audioElement.duration) {
            audioElement.currentTime = selectedDuration;
            if (selectedDuration !== 0) {
              currentAudioIndexRef.current[index1] = index;
              if (isPlaying) {
                playNextAudio(currentAudioIndexRef.current);
              }
            }
            selectedDuration = 0;
          } else {
            audioElement.currentTime = audioElement.duration;
            selectedDuration -= audioElement.duration;
          }
          console.log(audioElement.currentTime);
          return null;
        });
        selectedDuration = selectedDurationTemp;
      });

      setProgress(newValue);
    }
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    audioRefs.current.forEach((audioElementArr) => {
      audioElementArr.forEach((audioElement) => {
        audioElement.volume = newValue / 100;
      });
    });
  };

  const startProgressInterval = () => {
    intervalRef.current = setInterval(() => {
      setProgress((prevProgress) => {
        let currentPos = 0,
          duration = 0;
        audioRefs.current.map((audioElementArray, index) => {
          let currentPosTemp = 0,
            tempDuration = 0;
          audioElementArray.map((audioElement) => {
            currentPosTemp += audioElement.currentTime;
            tempDuration += audioElement.duration;
            // currentPos += audioElement.currentTime;
            // duration += audioElement.duration;
            return null;
          });
          currentPos = Math.max(currentPosTemp, currentPos);
          duration = Math.max(duration, tempDuration);
        });
        const newProgress = (currentPos / duration) * 100;
        return newProgress;
      });
    }, 100);
  };

  const handleDownload = async () => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    let audioproduced = [false, false, false];

    for (let i = 0; i < audioRefs.current.length; i++) {
      const buffers = await Promise.all(
        audioRefs.current.map((audioElementArray) =>
          audioElementArray.map(async (audioElement) => {
            const response = await fetch(audioElement.src);
            const arrayBuffer = await response.arrayBuffer();
            return await audioContext.decodeAudioData(arrayBuffer);
          })
        )[i]
      );
      if (buffers.length === 0) {
        continue;
      }

      audioproduced[i] = true;

      const totalDuration = buffers.reduce(
        (total, buffer) => total + buffer.duration,
        0
      );

      const mergedBuffer = audioContext.createBuffer(
        buffers[0].numberOfChannels,
        Math.ceil(totalDuration * audioContext.sampleRate),
        audioContext.sampleRate
      );

      let offset = 0;
      buffers.forEach((buffer) => {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          mergedBuffer
            .getChannelData(channel)
            .set(buffer.getChannelData(channel), offset);
        }
        offset += buffer.duration * audioContext.sampleRate;
      });
      const wav = new WaveFile();

      wav.fromScratch(
        1,
        audioContext.sampleRate,
        "32f",
        mergedBuffer.getChannelData(0)
      );
      const wavBuffer = wav.toBuffer();

      const blob = new Blob([wavBuffer], { type: "audio/wav" });

      const url = URL.createObjectURL(blob);

      await ffmpeg.writeFile(`merged_audio_${i}.wav`, await fetchFile(url));
    }

    if (audioproduced[0] && audioproduced[1]) {
      await ffmpeg.exec([
        "-i",
        "merged_audio_0.wav",
        "-i",
        "merged_audio_1.wav",
        "-filter_complex",
        "[0:a][1:a]amix=inputs=2:duration=first[aout]",
        "-map",
        "[aout]",
        "output.wav",
      ]);
    } else if (audioproduced[0]) {
      await ffmpeg.exec([
        "-i",
        "merged_audio_0.wav",
        "-filter:a",
        "volume=0.5",
        "output.wav",
      ]);
    } else if (audioproduced[1]) {
      await ffmpeg.exec([
        "-i",
        "merged_audio_1.wav",
        "-filter:a",
        "volume=0.5",
        "output.wav",
      ]);
    }

    const data = await ffmpeg.readFile("output.wav");
    const blob = new Blob([data.buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "final_overlapped_audio.wav";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Grid container direction="column" alignItems="center" spacing={2}>
      <Grid item>
        <Typography variant="h5">Audio Player</Typography>
      </Grid>
      <Grid item>
        <Paper style={{ padding: "20px" }}>
          <Slider
            value={progress}
            onChange={handleSeek}
            aria-labelledby="continuous-slider"
            disabled={!isAudioAvailable}
          />
          <Grid container justify="center" spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePlayPause}
                disabled={!isAudioAvailable}
              >
                {isPlaying ? "Pause" : "Play"}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleStop}
                disabled={!isAudioAvailable}
              >
                Stop
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="default"
                onClick={handleDownload}
                disabled={!isAudioAvailable}
              >
                Download
              </Button>
            </Grid>
            {/* <Grid item>
              <Switch
                checked={isPlaying}
                onChange={handlePlayPause}
                color="primary"
                name="playPauseSwitch"
                inputProps={{ "aria-label": "toggle play/pause" }}
                disabled={!isAudioAvailable}
              />
            </Grid> */}
            <Grid>
              <Slider
                style={{
                  width: "100px",
                }}
                value={volume}
                onChange={handleVolumeChange}
                aria-labelledby="continuous-slider"
                disabled={!isAudioAvailable}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AudioMerger;
