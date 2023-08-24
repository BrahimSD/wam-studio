import HostView from "../Views/HostView";
import App from "../App";
import songs from "../../static/songs.json"
import {audioCtx} from "../index";
import {focusWindow} from "./StaticController";
import {SONGS_FILE_URL} from "../Env";

/**
 * Class to control the audio. It contains all the listeners for the audio controls.
 * It also contains the audio context and the list of tracks. It is used to play, pause, record, mute, loop, etc.
 */
export default class HostController {

    app: App;
    audioCtx: AudioContext;
    hostView: HostView;

    playing: boolean = false;
    looping: boolean = false;
    muted: boolean = false;
    pauseInterval = false;

    timerInterval: NodeJS.Timer | undefined;
    lastExecutedZoom = 0

    vuMeter: VuMeter;

    private readonly THROTTLE_TIME = 10;

    constructor(app: App) {
        this.app = app;
        this.hostView = app.hostView;
        this.audioCtx = audioCtx;
        
        this.defineControls();
    }

    /**
     * Define all the listeners for the audio controls.
     */
    defineControls() {
        this.definePlayListener();
        this.defineBackListener();
        this.defineRecordListener();
        this.defineLoopListener();
        this.defineVolumeListener();
        this.defineMuteListener();
        this.defineSongsDemoListener();
        this.defineTimerListener();
        this.defineMenuListener();
        this.app.pluginsView.mainTrack.addEventListener("click", () => {
            this.app.pluginsController.selectHost();
        });
    } 

    /**
     * Define the listener for the timer.
     * It updates the playhead position and the timer.
     */
    defineTimerListener() {
        let lastPos = this.app.host.playhead;
        this.timerInterval = setInterval(() => {
            let newPos = this.app.host.playhead;
            if (lastPos !== newPos) {
                lastPos = newPos;
                if (!this.pauseInterval) {
                    this.app.editorView.playhead.movePlayhead(newPos);
                    this.hostView.updateTimer(newPos);
                }
            }
        }, 1000/60)
    }

    /**
     * Define the listener for the mute button.
     * It mutes or unmutes the host.
     */
    defineMuteListener() {
        this.hostView.muteBtn.onclick = () => {
            if (this.muted) {
                this.app.host.unmuteHost();
            }
            else {
                this.app.host.muteHost();
            }
            this.muted = !this.muted;
            this.hostView.pressMuteButton(this.muted);
        }
    }

    /**
     * Define the listener for the volume slider. It controls the volume of the host.
     */
    defineVolumeListener() {
        this.hostView.volumeSlider.oninput = () => {
            
            let value = parseInt(this.hostView.volumeSlider.value) / 100;
            this.app.host.setVolume(value);
        }
    }

    /**
     * Define the listener for the loop button. It loops or unloops the host.
     */
    defineLoopListener() {
        this.hostView.loopBtn.onclick = () => {
            if (this.looping) {
                this.app.tracksController.trackList.forEach((track) => {
                    //@ts-ignore
                    track.node.parameters.get("loop").value = 0;
                });
                //@ts-ignore
                this.app.host.hostNode.parameters.get("loop").value = 0;
            }
            else {
                this.app.tracksController.trackList.forEach((track) => {
                    //@ts-ignore
                    track.node.parameters.get("loop").value = 1;
                });
                //@ts-ignore
                this.app.host.hostNode.parameters.get("loop").value = 1;
            }
            this.looping = !this.looping;
            this.hostView.pressLoopButton(this.looping);
        }
    }


    defineRecordListener() {
        this.hostView.recordBtn.onclick = () => {
            this.app.recorderController.clickRecord();
        }
    }

    /**
     * Define the listener for the back button. It goes back to the first beat.
     * 
     */
    defineBackListener() {
        this.hostView.backBtn.onclick = () => {
            this.app.tracksController.jumpTo(1);
            this.app.automationController.applyAllAutomations();
        }
    }

    /**
     * Define the listener for the play button. It plays or pauses the host.
     */
    definePlayListener() {
        this.hostView.playBtn.onclick = () => {
            this.clickOnPlayButton();
        }
    }

    /**
     * Define the listeners for the demo songs in the menu.
     */
    defineSongsDemoListener() {
        songs.forEach((song) => {
            let name = song.name;
            let el = this.hostView.createNewSongItem(name);
            el.onclick = async () => {
                for (let trackSong of song.songs) {
                    const url = SONGS_FILE_URL + trackSong;
                    let track = await this.app.tracksController.newEmptyTrack(url);
                    track.url = url;
                    this.app.tracksController.initTrackComponents(track);
                }
                for (let track of this.app.tracksController.trackList) {
                    this.app.tracksController.loadTrackUrl(track);
                }
            }
        });
    }

    defineMenuListener() {
        this.hostView.importSongs.addEventListener('click', () => {
            this.hostView.newTrackInput.click();
        });
        this.hostView.newTrackInput.addEventListener('change', (e) => {
            // @ts-ignore
            for (let i = 0; i < e.target.files.length; i++) {
                // @ts-ignore
                let file = e.target.files[i];
                if (file !== undefined) {
                    this.app.tracksController.newTrackWithFile(file)
                        .then(track => {
                            if (track !== undefined) {
                                this.app.tracksController.initTrackComponents(track);
                                track.element.progressDone();
                            }
                        });
                }

            }
        });
        this.app.hostView.saveBtn.onclick = async () => {
            await this.app.projectController.openSaveProject();
        }
        this.app.hostView.loadBtn.onclick = async () => {
            await this.app.projectController.openLoadProject();
        }
        this.app.hostView.loginBtn.onclick = async () => {
            await this.app.projectController.openLogin();
        }
        this.app.hostView.aboutBtn.onclick = async () => {
            this.app.hostView.aboutWindow.hidden = false;
            focusWindow(this.app.hostView.aboutWindow);
        }
        this.app.hostView.aboutCloseBtn.onclick = () => {
            this.app.hostView.aboutWindow.hidden = true;
        }
        this.app.hostView.zoomInBtn.onclick = async () => {
            this.app.editorController.zoomIn();
        }
        this.app.hostView.zoomOutBtn.onclick = async () => {
            this.app.editorController.zoomOut();
        }
        window.addEventListener('wheel', (e) => {
            const currentTime = Date.now();
            if (currentTime - this.lastExecutedZoom < this.THROTTLE_TIME) return;

            this.lastExecutedZoom = currentTime;

            const isMac = navigator.platform.toUpperCase().includes('MAC');
            if (isMac && e.metaKey || !isMac && e.ctrlKey) {
                const zoomIn = e.deltaY > 0;
                if (zoomIn) this.app.editorController.zoomIn(e.deltaY);
                else this.app.editorController.zoomOut(e.deltaY*-1);
            }
        });
    }


    /**
     * Pause the timer interval. Used when the user is jumping to a specific beat.
     */
    pauseUpdateInterval() {
        this.pauseInterval = true;
    }

    /**
     * Resume the timer interval. Used when the user is jumping to a specific beat.
     */
    resumeUpdateInteravel() {
        this.pauseInterval = false;
    }

    initVuMeter() {
        this.vuMeter = new VuMeter(this.hostView.vuMeterCanvas, 30, 157);
    }

    clickOnPlayButton(stop: boolean = false) {
        if (this.playing) {
            for (let track of this.app.tracksController.trackList) {
                track.plugin.instance?._audioNode.clearEvents();
                //@ts-ignore
                track.node.parameters.get("playing").value = 0;
                clearInterval(this.timerInterval!!);
            }
            if (this.app.recorderController.recording) {
                this.app.recorderController.stopRecordingAllTracks();
                this.hostView.pressRecordingButton(false);
            }
            //@ts-ignore
            this.app.host.hostNode.parameters.get("playing").value = 0;
        }
        else {
            this.app.automationController.applyAllAutomations();
            this.app.tracksController.trackList.forEach(async (track) => {
                if (track.modified) track.updateBuffer(this.audioCtx, this.app.host.playhead);
                //@ts-ignore
                track.node.parameters.get("playing").value = 1;
                this.defineTimerListener();
            });
            //@ts-ignore
            this.app.host.hostNode.parameters.get("playing").value = 1;
        }
        this.playing = !this.playing;
        this.hostView.pressPlayButton(this.playing, stop);
    }

    stopAll() {
        this.app.tracksController.trackList.forEach(async (track) => {
            //@ts-ignore
            track.node.parameters.get("playing").value = 0;
        });
    }
}


class VuMeter {

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, height: number, width: number) {
        this.canvas = canvas;
        this.canvas.height = height;
        this.canvas.width = width;
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        let gradient = this.ctx.createLinearGradient(0,0, width, height);
        gradient.addColorStop(0, "#08ff00");
        gradient.addColorStop(0.33, "#fffb00");
        gradient.addColorStop(0.66, "#ff7300");
        gradient.addColorStop(1, "#ff0000");

        this.ctx.fillStyle = gradient;
        this.ctx.clearRect(0,0,width,height);
    }

    update(value: number) {
        value = Math.min(value, 1);
        this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
        this.ctx.fillRect(0, 0, value*this.canvas.width, this.canvas.height);
    }
}