import Track from "../Models/Track";
import TrackView from "../Views/TrackView";
import App from "../App";

/**
 * Controller for the track view. This controller is responsible for adding and removing tracks from the track view.
 */
export default class TrackController {
    
    app: App;
    trackView: TrackView;

    constructor(app: App) {
        this.app = app;
        this.trackView = this.app.trackView;

        this.defineNewtrackCallback();
    }

    defineNewtrackCallback() {
        this.trackView.newTrackDiv.onclick = () => {
            // this.addNewTrack();
        }
    }

    /**
     * It adds a new track to the track view. the color of the track is also changed.
     * It also defines the listeners for the track.
     * 
     * @param track Track to be added to the track view.
     */
    addNewTrackInit(track: Track) {
        this.trackView.addTrack(track.element);
        this.trackView.changeColor(track);
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
                
                this.app.trackController.addNewTrackInit(element);
                this.app.editorController.addWaveFormToTrack(element);
            }
        }
    }

    /**
     * Removes a track from the track view. It also removes the track from the audio controller.
     * 
     * @param track Track to be removed from the track view.
     */
    removeTrack(track: Track) {
        this.trackView.removeTrack(track.element);
        this.app.tracks.removeTrack(track);
        this.app.editorController.removeWafeFormOfTrack(track);
    }

    defineTrackListener(track: Track) {
        track.element.closeBtn.onclick = () => {
            this.removeTrack(track);
        }

        track.element.soloBtn.onclick = () => {
            track.isSolo = !track.isSolo;

            if (track.isSolo) {
                this.app.tracks.setSolo(track);
                track.element.solo();
            }
            else {
                this.app.tracks.unsetSolo(track);
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
            console.log("Volume change: TODO");
        }

        track.element.balanceSlider.oninput = () => {
            console.log("Balance change: TODO");
        }

        track.element.color.onclick = () => {
            this.trackView.changeColor(track);
        }
    }

}