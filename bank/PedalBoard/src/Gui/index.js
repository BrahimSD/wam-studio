// This file is the factory for the GUI part.
// The imporant thing here is the createElement async method
// This file must be an es module in order to be loaded with the SDK (with dynamic imports)
import Gui from "./Gui.js";

export { Gui };

/**
 * A mandatory method if you want a gui for your plugin
 * @param {WebAudioModule} plugin - the plugin instance
 * @returns {Elem} - the HTML element that contains the GUI
 */
export async function createElement(plugin, ...args) {
  // here we return the WebComponent GUI but it could be
  // any DOM node
  let gui = new Gui(plugin, ...args);
  // await gui.loaded;
  return gui;
}
