import App from "../App";
import Track from "../Models/Track";
import Host from "../Models/Host";
import {audioCtx} from "../index";
import PluginsView from "../Views/PluginsView";

/**
 * Controller for the plugins view. This controller is responsible for selecting and removing plugins.
 * It also defines the listeners for the plugins view.
 */
export default class PluginsController {
    app: App;
    pluginsView: PluginsView;

    selectedTrack: Track | undefined;
    hostTrack: Host;

    constructor(app: App) {
        this.app = app;
        this.pluginsView = this.app.pluginsView;

        this.hostTrack = this.app.host;
        this.selectedTrack = undefined;

        this.hideAllControllers();

        this.selectPlugins();
        this.defineResizeListener();
        this.defineMinimizeMaximizeListener();
        this.defineNewPluginBtnListener();
    }

    /**
     * define the listeners when the window is resized.
     */
    defineResizeListener() {
        this.pluginsView.resize();
    }

    /**
     * Define the listeners for the minimize and maximize buttons.
     */
    defineMinimizeMaximizeListener() {
        this.pluginsView.controlRackWindow();
    }

    /**
     * Define the listeners for all the buttons in the plugins view.
     */
    defineNewPluginBtnListener() {
        this.pluginsView.newPlugin.addEventListener("click", async () => {
            if (this.selectedTrack != undefined) {
                this.pluginsView.hideNew();
                await this.selectedTrack.plugin.initPlugin();
                this.app.pluginsController.connectPlugin(this.selectedTrack);
                this.selectPlugins();
            }
        });

        this.pluginsView.removePlugin.addEventListener("click", () => {
            if (this.selectedTrack !== undefined) {
                this.removePlugins(this.selectedTrack);
            }
        });

        this.pluginsView.showPlugin.addEventListener("click", () => {
            this.pluginsView.showHidePlugin();
            this.pluginsView.hideShowPlugin();
            this.pluginsView.showFloatingWindow();
        });

        this.pluginsView.hidePlugin.addEventListener("click", () => {
            this.pluginsView.showShowPlugin();
            this.pluginsView.hideHidePlugin();
            this.pluginsView.hideFloatingWindow();
        });

        this.pluginsView.closeWindowButton.addEventListener("click", () => {
            this.pluginsView.showShowPlugin();
            this.pluginsView.hideHidePlugin();
            this.pluginsView.hideFloatingWindow();
        })
    }

    /**
     * Select the clicked track and show the plugins of the track.
     * @param track
     */
    selectTrack(track: Track) {
        if (this.selectedTrack === undefined) {
            this.selectedTrack = track;
            this.selectedTrack.element.select();
            this.selectPlugins();
        }
        else if (this.selectedTrack.id !== track.id) {
            this.selectedTrack.element.unSelect();
            this.pluginsView.unselectHost();
            this.selectedTrack = track;
            this.selectedTrack.element.select();
            this.selectPlugins();
        }
    }

    /**
     * Select the main track and show the plugins of the main track.
     */
    selectHost() {
        let host = this.app.host;
        if (this.selectedTrack === undefined) {
            this.selectedTrack = host;
            this.pluginsView.selectHost();
            this.selectPlugins();
        }
        else if (this.selectedTrack.id !== host.id) {
            this.selectedTrack.element.unSelect();
            this.selectedTrack = host;
            this.pluginsView.selectHost();
            this.selectPlugins();
        }
    }

    /**
     * Select the plugins of the selected track.
     */
    selectPlugins() {
        if (this.selectedTrack === undefined) {
            this.hideAllControllers();
        }
        else if (!this.selectedTrack.plugin.initialized) {
            this.hideAllControllers();
            this.pluginsView.showNew();
        }
        else {
            this.app.tracksController.trackList.forEach(track => {
                this.pluginsView.movePluginLoadingZone(track);
            })
            this.pluginsView.showPlugins(this.selectedTrack);
            if (this.pluginsView.floating.hidden) {
                this.hideAllControllers();
                this.pluginsView.showShowPlugin();
            }
            else {
                this.hideAllControllers();
                this.pluginsView.showFloatingWindow();
                this.pluginsView.showHidePlugin();
            }
            this.pluginsView.showRemovePlugin();
        }
    }

    /**
     * Hide all the controllers in the plugins view.
     */
    hideAllControllers() {
        this.pluginsView.hideNew();
        this.pluginsView.hideFloatingWindow();
        this.pluginsView.hideShowPlugin();
        this.pluginsView.hideRemovePlugin();
        this.pluginsView.hideHidePlugin();
    }

    /**
     * Remove the plugins of the given track.
     * @param track
     */
    removePlugins(track: Track) {
        track.plugin.instance?._audioNode.clearEvents();
        this.app.pluginsController.disconnectPlugin(track);
        track.plugin.unloadPlugin();
        this.pluginsView.deletePluginView();
        if (this.selectedTrack === track) {
            this.selectPlugins();
        }
    }

    /**
     * Connects the plugin to the track. If the track is the host, it connects the plugin to the host gain node.
     * @param track
     */
    connectPlugin(track: Track) {
        if (track.id === -1) {
            let host = track as Host;
            host.gainNode.disconnect(audioCtx.destination);
            host.gainNode
                .connect(host.plugin.instance!._audioNode)
                .connect(host.audioCtx.destination);
        }
        else {
            track.node!.disconnect(track.pannerNode);
            track.node!
                .connect(track.plugin.instance!._audioNode)
                .connect(track.pannerNode);
            if (track.isMonitored) {
                track.mergerNode.disconnect(track.pannerNode);
                track.mergerNode.connect(track.plugin.instance?._audioNode!);
            }
        }
    }

    /**
     * Disconnects the plugin from the track. If the track is the host, it disconnects the plugin from the host gain node.
     * @param track
     */
    disconnectPlugin(track: Track) {
        if (track.plugin.initialized && track.id === -1) {
            let host = track as Host;
            host.gainNode.disconnect(host.plugin.instance!._audioNode);
            host.gainNode.connect(host.audioCtx.destination);
        }
        else if (track.plugin.initialized) {
            track.node!.disconnect(track.plugin.instance!._audioNode);
            track.node!.connect(track.pannerNode);
            if (track.isMonitored) {
                track.mergerNode.disconnect(track.plugin.instance?._audioNode!);
                track.mergerNode.connect(track.pannerNode);
            }
        }
    }
}