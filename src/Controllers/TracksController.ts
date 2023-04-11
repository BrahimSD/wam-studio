import Track from "../Models/Track";
import TracksView from "../Views/TracksView";
import App from "../App";
import {audioCtx} from "../index";
import WamEventDestination from "../Audio/WAM/WamEventDestination";
import WamAudioWorkletNode from "../Audio/WAM/WamAudioWorkletNode";
import OperableAudioBuffer from "../Audio/OperableAudioBuffer";
import {MAX_DURATION_SEC, RATIO_MILLS_BY_PX} from "../Utils";
import TrackElement from "../Components/TrackElement";
import Plugin from "../Models/Plugin";

/**
 * Controller for the track view. This controller is responsible for adding and removing tracks from the track view.
 */
export default class TracksController {
    
    app: App;
    tracksView: TracksView;
    audioCtx: AudioContext;
    trackIdCount: number;
    trackList: Track[];

    constructor(app: App) {
        this.app = app;
        this.tracksView = this.app.tracksView;
        this.audioCtx = audioCtx;
        this.trackIdCount = 1;
        this.trackList = [];

        this.defineNewTrackCallback();
    }

    defineNewTrackCallback() {
        this.tracksView.newTrackDiv.addEventListener('click', () => {
            this.app.tracksController.newEmptyTrack()
                .then(track => {
                    this.initTrackComponents(track);
                });
        });
    }

    /**
     * It adds a new track to the track view. the color of the track is also changed.
     * It also defines the listeners for the track.
     * 
     * @param track Track to be added to the track view.
     */
    addNewTrackInit(track: Track) {
        this.tracksView.addTrack(track.element);
        this.tracksView.changeColor(track);
        this.defineTrackListener(track); 
    }

    /**
     * Used to add a list of tracks to the track view. It calls the addNewTrackInit() for each track.
     * 
     * @param tracks List of tracks to be added to the track view.
     */
    addNewTrackList(tracks: Track[]) {
        for (const track in tracks) {
            if (Object.prototype.hasOwnProperty.call(tracks, track)) {
                const element = tracks[track];
                this.initTrackComponents(element);
            }
        }
    }

    initTrackComponents(track: Track) {
        this.app.tracksController.addNewTrackInit(track);
        this.app.automationView.addAutomationBpf(track.id);
        this.app.waveFormController.addWaveformToTrack(track);
    }

    /**
     * Removes a track from the track view. It also removes the track from the audio controller.
     * 
     * @param track Track to be removed from the track view.
     */
    removeTrack(track: Track) {
        this.app.pluginsController.removePlugins(track);
        this.tracksView.removeTrack(track.element);
        this.app.tracksController.deleteTrack(track);
        this.app.waveFormController.removeWaveformOfTrack(track);
        this.app.automationView.removeAutomationBpf(track.id);
    }

    /**
     * Defines the listeners for the track. It defines the listeners for the close, solo, mute, volume and balance sliders.
     * @param track
     */
    defineTrackListener(track: Track) {
        track.element.addEventListener("click", () => {
            if (!track.removed) {
                this.app.pluginsController.selectTrack(track);
            }
        })

        track.element.closeBtn.onclick = () => {
            track.removed = true;
            this.removeTrack(track);
        }

        track.element.soloBtn.onclick = () => {
            track.isSolo = !track.isSolo;

            if (track.isSolo) {
                this.app.tracksController.setSolo(track);
                track.element.solo();
            }
            else {
                this.app.tracksController.unsetSolo(track);
                track.element.unsolo();
            }
        }

        track.element.muteBtn.onclick = () => {
            if (track.isMuted) {
                track.unmute();
                track.element.unmute();
            }
            else {
                track.mute();
                track.element.mute();
            }
            track.isMuted = !track.isMuted;
        }

        track.element.volumeSlider.oninput = () => {
            let value = parseInt(track.element.volumeSlider.value) / 100;
            track.setVolume(value);
        }

        track.element.balanceSlider.oninput = () => {
            let value = parseFloat(track.element.balanceSlider.value);
            track.setBalance(value);
        }

        track.element.color.onclick = () => {
            this.tracksView.changeColor(track);
            this.app.editorView.changeWaveFormColor(track);
        }
        track.element.automationBtn.onclick = async (e) => {
            await this.app.automationController.openAutomationMenu(track);
            e.stopImmediatePropagation();
        }
        track.element.armBtn.onclick = () => {
            this.app.recorderController.clickArm(track);
        }
        track.element.monitoringBtn.onclick = () => {
            this.app.recorderController.clickMonitoring(track);
        }
    }

    /**
     * Create a new TracksView for all files given in parameters with the given information. Fetching audio files and initialize
     * the audio nodes and the canvas.
     *
     * @param url the url of the audio file
     * @returns the new tracks that have been created
     */
    async newTrackUrl(url: string) {
        let wamInstance = await WamEventDestination.createInstance(this.app.host.hostGroupId, this.audioCtx);
        let node = wamInstance.audioNode as WamAudioWorkletNode;

        let response = await fetch(url);
        let audioArrayBuffer = await response.arrayBuffer();
        let audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);

        let operableAudioBuffer = Object.setPrototypeOf(audioBuffer, OperableAudioBuffer.prototype) as OperableAudioBuffer;

        node.setAudio(operableAudioBuffer.toArray());

        // @ts-ignore
        let track = this.createTrack(node);
        track.addBuffer(operableAudioBuffer);
        let urlSplit = url.split("/");
        track.element.name = urlSplit[urlSplit.length - 1];
        return track;
    }



    async newEmptyTrack() {
        let wamInstance = await WamEventDestination.createInstance(this.app.host.hostGroupId, this.audioCtx);
        let node = wamInstance.audioNode as WamAudioWorkletNode;

        let track = this.createTrack(node);
        track.element.name = `Track ${track.id}`;
        return track;
    }

    /**
     * Create the track with the given file. It verifies the type of the file and then create the track.
     *
     * It returns undefined if the file is not an audio file and if the duration of the file is too long.
     *
     * @param file
     */
    async newTrackWithFile(file: File) {
        if (file.type === "audio/ogg" || file.type === "audio/wav" || file.type === "audio/mpeg" || file.type === "audio/x-wav") {
            let wamInstance = await WamEventDestination.createInstance(this.app.host.hostGroupId, this.audioCtx);
            let node = wamInstance.audioNode as WamAudioWorkletNode;

            let audioArrayBuffer = await file.arrayBuffer();
            let audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);
            if (audioBuffer.duration > MAX_DURATION_SEC) {
                console.warn("Audio file too long, max duration is " + MAX_DURATION_SEC + " seconds");
                return undefined;
            }
            let operableAudioBuffer = Object.setPrototypeOf(audioBuffer, OperableAudioBuffer.prototype) as OperableAudioBuffer;

            node.setAudio(operableAudioBuffer.toArray());

            // @ts-ignore
            let track = this.createTrack(node);
            track.addBuffer(operableAudioBuffer);
            track.element.name = file.name;
            return track;
        }
        else {
            console.warn("File type not supported");
            return undefined;
        }
    }

    /**
     * Create a new TracksView with the given audio node. Initialize the audio nodes and the canvas.
     *
     * @param node
     * @returns the created track
     */
    createTrack(node: WamAudioWorkletNode) {
        let trackElement = document.createElement("track-element") as TrackElement;
        trackElement.trackId = this.trackIdCount;

        let track = new Track(this.trackIdCount, trackElement, node);
        track.plugin  = new Plugin(this.app);
        track.gainNode.connect(this.app.host.gainNode);

        this.trackList.push(track);

        this.trackIdCount++;
        return track;
    }

    /**
     * Remove the given track from the track list and disconnect the audio node.
     *
     * @param track the track to remove
     */
    deleteTrack(track: Track) {
        let trackIndex = this.trackList.indexOf(track);
        this.trackList.splice(trackIndex, 1);
        track.node!.removeAudio();
        track.node!.disconnectEvents();
        track.node!.disconnect();
    }

    /**
     * Jump to the given position in px.
     *
     * @param pos the position in px
     */
    jumpTo(pos: number) {
        this.app.host.playhead = (pos * RATIO_MILLS_BY_PX) /1000 * audioCtx.sampleRate
        this.trackList.forEach((track) => {
            track.node!.port.postMessage({playhead: this.app.host.playhead+1})
        });

        this.app.host.hostNode?.port.postMessage({playhead: this.app.host.playhead+1});
    }

    /**
     * Mute or unmute all tracks except the given one.
     *
     * @param trackToUnsolo the track to unsolo.
     */

    unsetSolo(trackToUnsolo: Track) {
        let isHostSolo = false;

        this.trackList.forEach(track => {
            if (track.isSolo) {
                isHostSolo = true;
            }
        });

        if (!isHostSolo) {
            this.trackList.forEach(track => {
                if (!track.isSolo) {
                    if (track.isMuted) {
                        track.muteSolo();
                    }
                    else {
                        track.unmute();
                    }
                }
            });
        } else {
            trackToUnsolo.muteSolo();
        }
    }

    /**
     * Mute all tracks except the given one.
     *
     * @param trackToSolo the track to solo.
     */
    setSolo(trackToSolo: Track) {
        this.trackList.forEach((track) => {
            if (track !== trackToSolo && !track.isSolo) {
                track.muteSolo();
            }
        });
        if (!trackToSolo.isMuted) {
            trackToSolo.unmute();
        }
    }


    getTrack(trackId: number) {
        return this.trackList.find(track => track.id === trackId);
    }

    clearAllTracks() {
        for (let track of this.trackList) {
            this.removeTrack(track);
        }
    }
}
