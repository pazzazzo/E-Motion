const { AudioContext } = require('web-audio-api');

AudioContext.prototype.decodeAudioData = jest.fn((data) => {
  return new Promise((resolve) => {
    resolve(Buffer.from(data));
  });
});

global.AudioContext = AudioContext;