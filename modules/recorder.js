// modules/recorder.js
// Uses Web Speech API for transcription
import { Haptics } from './haptics.js';

export const Recorder = {
  recognition: null,
  isRecording: false,
  onResultCallback: null,
  onEndCallback: null,

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in this browser. Try Chrome or Safari.");
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false; // Set to true if we want live preview
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isRecording = true;
      Haptics.recordingStart();
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (this.onResultCallback) {
        this.onResultCallback(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      Haptics.error();
      if (this.onEndCallback) this.onEndCallback();
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      if (this.onEndCallback) this.onEndCallback();
    };

    return true;
  },

  start(onResult, onEnd) {
    if (!this.recognition) {
       if (!this.init()) return;
    }
    this.onResultCallback = onResult;
    this.onEndCallback = onEnd;
    
    try {
        this.recognition.start();
    } catch (e) {
        // If already started
        console.warn(e);
    }
  },

  stop() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      Haptics.recordingStop();
    }
  }
};
