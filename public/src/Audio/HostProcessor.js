
// @ts-nocheck
const audioWorkletGlobalScope = globalThis;

const { registerProcessor } = audioWorkletGlobalScope;
const PLAYHEAD_COUNT_MAX = 4;
const COUNT_BLOCK = 8;


class AudioPlayerProcessor extends AudioWorkletProcessor {

    /**
     * @property {Function} parameterDescriptors Get the custom parameters of the processor.
     *
     * @returns {AudioParamDescriptor[]}
     */
    static get parameterDescriptors() {
        return [{
            name: "playing",
            minValue: 0,
            maxValue: 1,
            defaultValue: 0
        }, {
            name: "loop",
            minValue: 0,
            maxValue: 1,
            defaultValue: 0
        }];
    }
    
    audio = [];
    playhead = 0;
    playheadCount = 0;
    blockCount = 0;
    loopStart = 0;
    loopEnd = 0;

    
    constructor(options) {
        super(options);

        this.port.onmessage = (e) => {
            if (e.data.audio) {
                this.audio = e.data.audio;
            }
            else if (e.data.playhead) {
                this.playhead = e.data.playhead;
            }
            else if (e.data.loop) {
                this.loopStart = e.data.loopStart;
                this.loopEnd = e.data.loopEnd;
            }
        };
    }

    process(inputs, outputs, parameters) {
        if (!this.audio) return true;

        // Initializing the buffer with the given outputs and the audio length.
        const bufferSize = outputs[0][0].length;

        for (let i = 0; i < bufferSize; i++) {
            const playing = !!(i < parameters.playing.length ? parameters.playing[i] : parameters.playing[0]);
            const loop = !!(i < parameters.loop.length ? parameters.loop[i] : parameters.loop[0]);
            if (!playing) continue; // Not playing
            const audioLength = this.audio[0].length;

            if (loop && this.playhead === this.loopEnd) {
                if (loop) this.playhead = this.loopStart; // Loop just enabled, reset playhead
                else continue; // EOF without loop
            }

            this.playhead++;
        }

        this.playheadCount++;
        if (this.playheadCount >= PLAYHEAD_COUNT_MAX) {
            this.port.postMessage({playhead: this.playhead});
            this.playheadCount = 0;
        }
        this.calculateMax(inputs[0][0])
        return true;
    }

    /**
     * Calculate the max volume of the audio buffer.
     * It will send the max volume to the main thread every COUNT_BLOCK blocks.
     *
     * @param output {Float32Array} The audio buffer.
     */
    calculateMax(output) {
        if (output !== undefined) {
            for (let i = 0; i < output.length; i++) {
                this.max = Math.max(this.max, output[i]);
            }
            this.blockCount++;
        }
        else {
            this.max = 0;
            this.blockCount++;
        }
        if (this.blockCount >= COUNT_BLOCK) {
            this.port.postMessage({volume: this.max});
            this.max = 0;
            this.blockCount = 0;
        }

    }
}

try {
    registerProcessor("host-processor", AudioPlayerProcessor);
} catch (error) {
    console.warn(error);
}
