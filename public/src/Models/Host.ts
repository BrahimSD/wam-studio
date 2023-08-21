import {app, audioCtx} from "..";
import App from "../App";
import AudioPlayerNode from "../Audio/AudioNode";
import OperableAudioBuffer from "../Audio/OperableAudioBuffer";
import Track from "./Track";
import TrackElement from "../Components/TrackElement";
import Plugin from "./Plugin";
import {BACKEND_URL} from "../Env";
import {MAX_DURATION_SEC} from "../Utils/Variables";

/**
 * Host class that contains the master track.
 * It is used to control the global volume and the playhead.
 */
export default class Host extends Track {

    app: App;
    audioCtx: AudioContext;
    hostGroupId: string = "";

    oldGlobalVolume: number;
    globalVolume: number;
    timer: number;
    playhead: number;

    latency: number = 0;

    hostNode: AudioPlayerNode | undefined;
    override gainNode: GainNode;
    pluginWAM: any;
    
    constructor(app: App) {
        super(-1, new TrackElement(), undefined);
        this.app = app;
        this.audioCtx = audioCtx;
        this.globalVolume = 0.5;
        this.oldGlobalVolume = 0.0;
        this.timer = 0;
        this.playhead = 0;

        this.plugin = new Plugin(app);
        
        this.gainNode = this.audioCtx.createGain()
        this.setVolume(1);    
        this.gainNode.connect(this.audioCtx.destination);
    }

    /**
     * Initialize the host node. It is used to control the global volume and the playhead.
     * It is asynchronous because it needs to load the WAM SDK and the AudioPlayerNode.
     */
    async initWAM() {
        const {default: WAM} = await import(/* webpackIgnore: true */BACKEND_URL+"/src/index.js");
        this.pluginWAM = WAM;

        const {default: initializeWamHost} = await import("@webaudiomodules/sdk/src/initializeWamHost");
        const {default: AudioPlayerNode} = await import("../Audio/AudioNode");
        await this.audioCtx.audioWorklet.addModule(new URL('../Audio/HostProcessor.js', import.meta.url));

        const [hostGroupId] = await initializeWamHost(audioCtx);
        this.hostGroupId = hostGroupId;

        let audio = audioCtx.createBuffer(2, 3600 * audioCtx.sampleRate, audioCtx.sampleRate)
        const operableAudioBuffer = Object.setPrototypeOf(audio, OperableAudioBuffer.prototype) as OperableAudioBuffer;
        
        this.hostNode = new AudioPlayerNode(this.audioCtx, 2);
        this.hostNode.setAudio(operableAudioBuffer.toArray());
        this.app.hostController.initVuMeter();

        this.hostNode.port.onmessage = ev => {
            if (ev.data.playhead) {
                this.playhead = ev.data.playhead;
            }
            else if (ev.data.volume >= 0) {
                let vol = ev.data.volume;
                let sensitivity = 2.3;
                this.app.hostController.vuMeter.update(Math.abs(vol) * sensitivity);
            }

        }
        this.gainNode.connect(this.hostNode);
    }

    updateBufferDuration() {
        if (this.hostNode) {
            let audio = audioCtx.createBuffer(2, MAX_DURATION_SEC * audioCtx.sampleRate, audioCtx.sampleRate)
            const operableAudioBuffer = Object.setPrototypeOf(audio, OperableAudioBuffer.prototype) as OperableAudioBuffer;
            this.hostNode.setAudio(operableAudioBuffer.toArray());
        }
    }

    /**
     * Set the global volume of the host.
     * 
     * @param value the new global volume
     */
    override setVolume(value: number) {
        this.globalVolume = value;
        this.gainNode.gain.value = this.globalVolume;
    }

    /**
     * Mute the host. It save the old global volume and set the global volume to 0.
     */
    muteHost() {
        this.oldGlobalVolume = this.globalVolume;
        this.setVolume(0);
    }

    /**
     * Unmute the host. It set the global volume to the old global volume.
     */
    unmuteHost() {
        this.setVolume(this.oldGlobalVolume);
    }
}