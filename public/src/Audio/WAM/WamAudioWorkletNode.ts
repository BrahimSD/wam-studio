import { WebAudioModule } from "@webaudiomodules/api";
import {addFunctionModule, WamNode} from "@webaudiomodules/sdk";
import getProcessor from "./WamProcessor";

export default class WamAudioWorkletNode extends WamNode {

    static override async addModules(audioCtx: AudioContext, moduleId: any) {
        const {audioWorklet} = audioCtx;
        await super.addModules(audioCtx, moduleId);
        await addFunctionModule(audioWorklet, getProcessor, moduleId);
    }

    constructor(module: WebAudioModule) {
        super(module,
            {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                outputChannelCount: [2]
            });
    }

    /**
     * Send the audio to the audio worklet.
     * @param audio
     */
    setAudio(audio: Float32Array[]) {
        this.port.postMessage({audio});
    }

    /**
     * Remove the audio from the audio worklet.
     */
    removeAudio() {
        this.port.postMessage({"removeAudio": true})
    }

    play() {
        const playingParam = this.parameters.get("playing");
        if (playingParam) {
            playingParam.value = 1;
        } else {
            console.error('Parameter "playing" does not exist.');
        }
    }

    pause() {
        const playingParam = this.parameters.get("playing");
        if (playingParam) {
            playingParam.value = 0;
        } else {
            console.error('Parameter "playing" does not exist.');
        }
    }

    loop(active: boolean) {
        const loopingParam = this.parameters.get("loop");
        if (loopingParam) {
            loopingParam.value = active ? 1 : 0;
        } else {
            console.error('Parameter "looping" does not exist.');
        }
    }
}