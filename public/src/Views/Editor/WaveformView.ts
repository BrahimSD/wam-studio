import {Container} from "pixi.js";
import EditorView from "./EditorView";
import RegionView from "./RegionView";
import Track from "../../Models/Track";
import {HEIGHT_TRACK} from "../../Env";
import Region from "../../Models/Region";
import TrackElement from "../../Components/TrackElement";

/**
 * Class that extends PIXI.Container.
 * It will contain the PIXI.Graphics that represents the waveform of the current track.
 */
export default class WaveformView extends Container {

    /**
     * Array of RegionView that contains the regions of the track.
     */
    public regionViews: RegionView[];
    /**
     * The unique ID of the track.
     */
    public trackId: number;
    /**
     * The color of the track.
     */
    public color: string;

    /**
     * The main editor of the application.
     */
    private _editorView: EditorView;

    constructor(editor: EditorView, track: Track) {
        super();
        this._editorView = editor;
        this.trackId = track.id;
        this.color = track.color;


        this.regionViews = [];

        this.eventMode = "dynamic";
        this._editorView.viewport.addChild(this);

        this.zIndex = 0;
        this.setPos(track);
    }

    /**
     * Creates a new RegionView and adds it to the array of RegionView.
     * It will initialize the RegionView with the color and the region.
     *
     * @param region - The region that will contain the buffer to draw.
     * @returns The RegionView created.
     */
    public createRegionView(region: Region): RegionView {
        let regionView = new RegionView(this._editorView, this.trackId, region);
        this.regionViews.push(regionView);
        this.addChild(regionView);

        regionView.initializeRegionView(this.color, region);
        return regionView;
    }

    /**
     * Removes the RegionView from the array of RegionView and from the PIXI.Container.
     *
     * @param regionView - The RegionView to remove.
     */
    public removeRegionView(regionView: RegionView): void {
        let index = this.regionViews.indexOf(regionView);
        this.regionViews.splice(index, 1);
        this.removeChild(regionView);
    }

    /**
     * Adds the RegionView to the array of RegionView and to the PIXI.Container.
     *
     * @param regionView - The RegionView to add.
     */
    public addRegionView(regionView: RegionView): void {
        this.regionViews.push(regionView);
        this.addChild(regionView);
    }

    /**
     * Returns the RegionView that has the given regionId.
     *
     * @param regionId - The unique ID of the region.
     * @returns The RegionView that has the given regionId.
     */
    public getRegionViewById(regionId: number): RegionView | undefined {
        return this.regionViews.find(regionView => regionView.id === regionId);
    }

    /**
     * Set the position of the track in the track container taking into account only the track-elements
     *
     * @param track - The track to set the position.
     * @private
     */
    private setPos(track: Track): void {
        let trackContainer = document.getElementById("track-container") as HTMLDivElement;
        let pos = Array.from(trackContainer.children).filter(e => e instanceof TrackElement).indexOf(track.element);

        this.position.x = 0;
        this.position.y = pos*HEIGHT_TRACK+25;
    }

}