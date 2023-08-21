import App from "../../App";
import PlayheadView from "../../Views/Editor/PlayheadView";


export default class PlayheadController {

    app: App;
    view: PlayheadView;
    movingPlayhead: boolean;

    constructor(app: App) {
        this.app = app;
        this.view = app.editorView.playhead;
        this.movingPlayhead = false;
        this.bindEvents();
    }

    bindEvents() {
        console.log("bind events")
        this.view.track.on("pointerup", (e) => {
            this.app.tracksController.jumpTo(e.data.global.x);
            this.app.automationController.applyAllAutomations();
            this.movingPlayhead = false;
            this.app.hostController.resumeUpdateInteravel();
        });

        this.view.track.on("pointerupoutside", (e) => {
            let pos = e.data.global.x + this.app.editorView.viewport.left;
            if (pos < 0) pos = 0;
            this.app.tracksController.jumpTo(pos);
            this.app.automationController.applyAllAutomations();
            this.movingPlayhead = false;
            this.app.hostController.resumeUpdateInteravel();
        });

        this.view.track.on("pointerdown", (e) => {
            let pos = e.data.global.x + this.app.editorView.viewport.left;
            this.app.hostController.pauseUpdateInterval();
            this.movingPlayhead = true;
            this.view.movePlayheadFromPosition(pos);
        });

        this.view.track.on("globalpointermove", (e) => {
            if (this.movingPlayhead) {
                let pos = e.data.global.x + this.app.editorView.viewport.left;
                if (pos < 0) pos = 0;
                this.view.movePlayheadFromPosition(pos);
                this.app.hostView.updateTimerFromXPos(pos);
            }
        });
    }
}

