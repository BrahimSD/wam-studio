const template = document.createElement("template");
template.innerHTML = `
<style>
:host {
    
    width: 100%;
      height: 52px;
      padding: 1px;
      display: flex;
      flex-direction: column;
      font-family: Roboto;
      overflow: hidden;
      z-index: 1;
      position: relative;
      -webkit-font-smoothing: antialiased;  
      padding-right: 10px;
      border-right: solid 1px rgb(111, 111, 111);
      background-color:transparent;
}
.tempo-section {
    border-color: rgba(255,255,255,0.05);
  }
  
  .tempo-input {
    color: lightgrey;
      display: inline-block;
      border: none;
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      font-family: "Unica One";
      font-size: 28px;
      height: 52px;
      line-height: 52px;
      width: 56px;
      text-align: right;
      margin-left:-5px;
  }
  
  .tempo-input:focus {
    outline-width: 0;
 }

  .tempo-label {
    color: lightgrey;
    font-family: "Roboto Condensed";
    font-size: 14px;
    margin: 0;
    padding: 0;
    border: 0;
  }
  
  .tempo-arrows {
    display: inline-flex;
      flex-direction: column;
      position: relative;
      top: -10px;
      margin-left: -3px;
  }
  
  .tempo-arrowButton {
    padding-bottom: 0;
    color: lightgrey;
    border: none ;
    background-color: transparent;
    width: 24px;
    height: 24px;
    
  }
  
  .icon-tempo-arrow-down {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='lightgrey' class='bi bi-arrow-up-square' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.5 9.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z'/%3E%3C/svg%3E");
  
    transform:rotate(180deg) translate(9px, 4px) scale(1.2, 1.2);;
  
    width:24px;
    height:100%;
    margin-left:-2px;
  
    background-repeat:no-repeat;
    color:#33cca0;
    display:inline-block;
  }
  .icon-tempo-arrow-up {
    transform:translate(1px, 4px) scale(1.2, 1.2);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='lightgrey' class='bi bi-arrow-up-square' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.5 9.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z'/%3E%3C/svg%3E");
    width:24px;
    height:100%;
    margin-left:-2px;
  background-repeat:no-repeat;
    color:#33cca0;
    display:inline-block;
  }
  
  #tempo:invalid {
    color:red;
  }
</style>

<div id="container">
  <div class="tempo-section">
    <input class="tempo-input" value="120" id="tempo" 
           pattern="[0-9]+" maxlength=3> 
    <span class="tempo-label">bpm</span> 
    <div class="tempo-arrows">
      <button class="tempo-arrowButton" id="upArrowButton">
        <i class="icon-tempo-arrow-up"></i>
      </button> 
      <button class="tempo-arrowButton" id="downArrowButton">
        <i class="icon-tempo-arrow-down"></i>
      </button>
    </div>
  </div>
</div>
`;

export default class TempoSelectorElement extends HTMLElement {
  tempoInput?: HTMLInputElement;
  upArrowButton?: HTMLButtonElement;
  downArrowButton?: HTMLButtonElement;

  currentTempo: number = 120;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    if (this.shadowRoot !== null) {
      this.shadowRoot.innerHTML = template.innerHTML;

      this.defineTrackElementListeners();
    }
  }
  
  get tempo(): number {
    return this.currentTempo;
  }

  set tempo(newTempo: number) {
    this.currentTempo = newTempo;
    this.tempoInput!.value = newTempo.toString();
  }

  defineTrackElementListeners() {
    this.tempoInput = this.shadowRoot!.querySelector(
      "#tempo"
    ) as HTMLInputElement;

    this.tempoInput.onchange = (event: any) => {
      console.log(event.target.validity)
      if (!event.target?.validity.valid) return;

      const newTempo = event.target.value;

      // value entered is a number, check range and if
      // ok change the tempo, adjust the grid, etc.
      if (newTempo > 0 && newTempo < 300) {
        console.log("new tempo = " + newTempo);
        this.currentTempo = newTempo;
      }
    };

    this.upArrowButton = this.shadowRoot!.querySelector(
      "#upArrowButton"
    ) as HTMLButtonElement;
    this.upArrowButton.onclick = () => {
      this.currentTempo++;
      this.tempoInput!.value = this.currentTempo.toString();
    };

    this.downArrowButton = this.shadowRoot!.querySelector(
      "#downArrowButton"
    ) as HTMLButtonElement;
    this.downArrowButton.onclick = () => {
      if (this.currentTempo) {
        this.currentTempo--;
        this.tempoInput!.value = this.currentTempo.toString();
      }
    };
  }
}