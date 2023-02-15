const template: HTMLTemplateElement = document.createElement("template");

template.innerHTML = /*html*/`

<style>
.icon {
    padding-left: 5px;
    padding-right: 5px;
    -webkit-touch-callout: none; /* iOS Safari */
      -webkit-user-select: none; /* Safari */
       -khtml-user-select: none; /* Konqueror HTML */
         -moz-user-select: none; /* Old versions of Firefox */
          -ms-user-select: none; /* Internet Explorer/Edge */
              user-select: none;
    pointer-events: none;
}

.track-utils {
    display: flex;
    width: 95%;
    height: 100%;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
}

.track-color {
    width: 5%;
    height: 100%;
    cursor: pointer;
}

.track-header {
    display: flex;
    width: 100%;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-around;
    align-items: center;
    min-height: 24px;
    font-family: Helvetica, monospace;
    color: pink;
}

.track-volume {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-around;
    align-items: center; 
    max-height: 20px;
}

.track-balance {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-around;
    align-items: center;
    max-height: 20px;
}

.track-controls {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    max-height: 20px;
}

.track-name {
    color: lightgrey;
    font-familiy: Helvetica, monospace;
    font-weight: bold;
    max-width: 118px;
    min-width: 118px;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 2s linear;
    text-align: center;
    background-color: transparent;
    padding: 0;
    transition: none;
    border: solid 1px transparent;
}

.track-name:hover {
    border: solid 1px lightgrey;
}
.track-name:focus {
    border: none;
    padding: 0;
    outline: none;
    border: solid 1px lightgrey;
}

.track-close {
    padding-right: 5px;
    padding-left: 5px;
}

.track-close:hover {
    filter: invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);
    cursor: pointer;
}

.form-range.tracko {
    width: 80px !important;
}

.letter-icon {
    color: lightgrey;
    padding-left: 10px;
    padding-right: 10px;
    font-size: 15px;
    font-weight: bold;
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; 
}

.mute-icon, .solo-icon {
    color: grey;
    padding-left: 10px;
    padding-right: 10px;
    font-size: 15px;
    font-weight: bold;
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none;  
}

.mute-icon:hover, .solo-icon:hover {
    color: lightgrey;
    cursor: pointer;
}

.control {
    padding-left: 10px;
    padding-right: 10px;
    color: grey;
}

.control:hover {
    /*filter: invert(100%) sepia(0%) saturate(2190%) hue-rotate(165deg) brightness(89%) contrast(86%);*/
    filter: invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);
    cursor: pointer;
}

</style>

<div class="track-utils">
    <div class="track-header">
        <input id="name-input" class="track-name">
    
        <div id="close-btn" class="track-close">
            <img src="/icons/x-circle-fill.svg">
        </div>
    </div>
    <div class="track-volume">
        <div class="icon">
            <img src="icons/volume-down-track.svg">
        </div>
        <input type="range" class="form-range tracko" id="volume-slider">
        <div class="icon">
            <img src="icons/volume-up-track.svg">
        </div>
    </div>
    <div class="track-balance">
        <div class="letter-icon">
            L
        </div>
        <input type="range" min="-1" max="1" step=".1" value="0" class="form-range tracko" id="balance-slider">
        <div class="letter-icon">
            R
        </div>
    </div>
    <div class="track-controls">
        <div id="mute-btn" class="mute-icon">M</div>
        <div id="solo-btn" class="solo-icon">S</div>
        <div id="arm" class="control">
            <img src="icons/mic-fill.svg">
        </div>
        <div id="automation" class="control">
            <img src="icons/graph_6.svg">
        </div>
    </div>
</div>
<div id="color-div" class="track-color">
</div>

`

export default class TrackElement extends HTMLElement {

    trackId: number | undefined;
    name: string;

    constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.name = "";
    }

    connectedCallback() {
        if (this.shadowRoot !== null) {
            this.shadowRoot.innerHTML = template.innerHTML;
            
            this.defineTrackNameListener();
        }
    }

    get closeBtn() {
        return this.shadowRoot?.getElementById("close-btn") as HTMLDivElement;
    }

    get trackNameInput() {
        return this.shadowRoot?.getElementById("name-input") as HTMLInputElement;
    }

    get soloBtn() {
        return this.shadowRoot?.getElementById("solo-btn") as HTMLDivElement;
    }

    get muteBtn() {
        return this.shadowRoot?.getElementById("mute-btn") as HTMLDivElement;
    }

    get volumeSlider() {
        return this.shadowRoot?.getElementById("volume-slider") as HTMLInputElement;
    }

    get balanceSlider() {
        return this.shadowRoot?.getElementById("balance-slider") as HTMLInputElement;
    }

    get color() {
        return this.shadowRoot?.getElementById("color-div") as HTMLDivElement;
    }

    get automationBtn() {
        return this.shadowRoot?.getElementById("automation") as HTMLDivElement;
    }


    defineTrackNameListener() {
        this.trackNameInput.value = this.name;

        this.trackNameInput.addEventListener("keyup", (ev: KeyboardEvent) => {
            if (ev.code === "Enter" && ev.target !== null) {
                ev.preventDefault;
                (document.activeElement as HTMLElement).blur();
            }
        });
    }

    mute() {
        this.muteBtn.style.color = "red";
    }
    unmute() {
        this.muteBtn.style.color = "grey"
    }

    solo() {
        this.soloBtn.style.color = "lightgreen";
    }
    unsolo() {
        this.soloBtn.style.color = "grey";
    }

    setName(arg0: string) {
        this.trackNameInput.value = arg0;
    }

    select() {
        this.style.borderColor = "lightgray";
    }

    unSelect() {
        this.style.borderColor = "black";
    }
}
