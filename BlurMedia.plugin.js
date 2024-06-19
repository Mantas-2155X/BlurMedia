/**
 * @name BlurMedia
 * @description Blurs images and videos until you hover over them.
 * @version 1.0.0
 * @author 2155X
 * @authorId 198532905767534593
 * @website https://github.com/Mantas-2155X/BlurMedia/tree/main
 * @source https://raw.githubusercontent.com/Mantas-2155X/BlurMedia/main/BlurMedia.plugin.js
 */
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/
const config = {
    info: {
        name: "BlurMedia",
        authors: [
            {
                name: "2155X",
                discord_id: "198532905767534593",
                github_username: "Mantas-2155X",
            }
        ],
        version: "1.0.1",
        description: "Blurs images and videos until you hover over them.",
        github: "https://github.com/Mantas-2155X/BlurMedia/tree/main",
        github_raw: "https://raw.githubusercontent.com/Mantas-2155X/BlurMedia/main/BlurMedia.plugin.js"
    },
    main: "index.js"
};
class Dummy {
    constructor() {this._config = config;}
    start() {}
    stop() {}
}
 
if (!global.ZeresPluginLibrary) {
    BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.name ?? config.info.name} is missing. Please click Download Now to install it.`, {
        confirmText: "Download Now",
        cancelText: "Cancel",
        onConfirm: () => {
            require("request").get("https://betterdiscord.app/gh-redirect?id=9", async (err, resp, body) => {
                if (err) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                if (resp.statusCode === 302) {
                    require("request").get(resp.headers.location, async (error, response, content) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), content, r));
                    });
                }
                else {
                    await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                }
            });
        }
    });
}
 
module.exports = !global.ZeresPluginLibrary ? Dummy : (([Plugin, Api]) => {
    const plugin = (Plugin, Api) => {
    const {DOM, Webpack, Patcher} = window.BdApi;

    const SelectedChannelStore = Webpack.getModule(m => m.getCurrentlySelectedChannelId);
    const InlineMediaWrapper = Webpack.getModule(m => m.toString().includes("renderAccessory"));
    const WrapperClasses = Webpack.getModule(m => m.wrapperPlaying);
    const Events = require("events");
    const Dispatcher = new Events();

    /* globals BdApi:false */
    return class BlurMedia extends Plugin {
        constructor(meta) {
            super();
            this.meta = meta;
            this.styleTemplate = `
            .${WrapperClasses.wrapperPlaying.split(" ").join(".")} video,
            .${WrapperClasses.wrapperControlsHidden.split(" ").join(".")} video,
            .blur:hover img,
            .blur:hover video,
            a:hover + div > .blur {
                transition: 0ms cubic-bezier(.2, .11, 0, 1) !important;
                filter: blur(0px) !important;
            }
            .blur img,
            .blur video {
                filter: blur(50px) !important;
                transition: 0ms cubic-bezier(.2, .11, 0, 1) !important;
            }`;

            this.channelChange = this.channelChange.bind(this);
        }

        onStart() {
            Patcher.after(this.meta.name, InlineMediaWrapper.prototype, "render", (thisObject, _, retVal) => {
                if (!retVal.props.className) {
                    retVal.props.className = "blur";
                    return;
                }

                if (retVal.props.className.endsWith("blur"))
                    return;

                retVal.props.className = retVal.props.className + " blur";
            });

            Patcher.after(this.meta.name, InlineMediaWrapper.prototype, "componentDidMount", (thisObject) => {
                if (thisObject.cancelBlurListener)
                    return;

                const listener = () => thisObject.forceUpdate();

                Dispatcher.on("blur", listener);
                thisObject.cancelBlurListener = () => Dispatcher.off("blur", listener);
            });

            Patcher.after(this.meta.name, InlineMediaWrapper.prototype, "componentWillUnmount", (thisObject) => {
                if (!thisObject.cancelBlurListener)
                    return;

                thisObject.cancelBlurListener();
                delete thisObject.cancelBlurListener;
            });

            DOM.addStyle(this.meta.name, this.styleTemplate);
            SelectedChannelStore.addChangeListener(this.channelChange);

            this.promises = {state: {cancelled: false}, cancel() {this.state.cancelled = true;}};
        }
        
        onStop() {
            DOM.removeStyle(this.meta.name);
            SelectedChannelStore.removeChangeListener(this.channelChange);
        }

        channelChange() {
            Dispatcher.emit("blur");
        }
    };
};
     return plugin(Plugin, Api);
})(global.ZeresPluginLibrary.buildPlugin(config));
/*@end@*/
