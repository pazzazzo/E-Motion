const path = require('path');

jest.mock('../src/classes/Database', () => {
    return jest.fn().mockImplementation(() => ({
        load: jest.fn((cb) => cb(null)),
        data: {}
    }));
});

jest.mock('@google-cloud/text-to-speech', () => {
    return {
        TextToSpeechClient: jest.fn().mockImplementation(() => ({
            synthesizeSpeech: jest.fn(() => Promise.resolve([{ audioContent: Buffer.from('') }]))
        }))
    };
});

const MediaLoader = require('../src/classes/MediaLoader');
let mediaLoader;

describe('MediaLoader', () => {
    beforeEach(() => {
        AudioContext.prototype.decodeAudioData = jest.fn((data, success) => {
            success(Buffer.from(data));
        });
        mediaLoader = new MediaLoader();
    });

    test('datagraphPath resolves correctly', () => {
        const expected = path.join(__dirname, '..', 'src', 'datagraph.json');
        expect(mediaLoader.datagraphPath).toBe(expected);
    });

    test('preinit loads sound and voice buffers', (done) => {
        mediaLoader.on('preloaded', () => {
            expect(mediaLoader.getSounds().length).toBeGreaterThan(0);
            expect(mediaLoader.getVoices().length).toBeGreaterThan(0);
            done();
        });
        mediaLoader.preinit();
    });

    test('soundsList matches getSounds result', (done) => {
        mediaLoader.on('preloaded', () => {
            expect(mediaLoader.soundsList).toEqual(mediaLoader.getSounds());
            done();
        });
        mediaLoader.preinit();
    });
});