/**
 * @name BlurMedia
 * @description Blurs images and videos until you hover over them.
 * @version 1.0.0
 * @author 2155X
 * @authorId 198532905767534593
 * @website https://github.com/Mantas-2155X/BlurMedia/tree/main
 * @source https://raw.githubusercontent.com/Mantas-2155X/BlurMedia/main/BlurMedia.plugin.js
 */

module.exports = (_ => {
    const changeLog = {

    };

    return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
        constructor (meta) {for (let key in meta) this[key] = meta[key];}
        getName () {return this.name;}
        getAuthor () {return this.author;}
        getVersion () {return this.version;}
        getDescription () {return `The Library Plugin needed for ${this.name} is missing. Open the Plugin Settings to download it. \n\n${this.description}`;}

        downloadLibrary () {
            BdApi.Net.fetch("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js").then(r => {
                if (!r || r.status != 200) throw new Error();
                else return r.text();
            }).then(b => {
                if (!b) throw new Error();
                else return require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
            }).catch(error => {
                BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
            });
        }

        load () {
            if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
            if (!window.BDFDB_Global.downloadModal) {
                window.BDFDB_Global.downloadModal = true;
                BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${this.name} is missing. Please click "Download Now" to install it.`, {
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
                    onConfirm: _ => {
                        delete window.BDFDB_Global.downloadModal;
                        this.downloadLibrary();
                    }
                });
            }
            if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
        }
        start () {this.load();}
        stop () {}
        getSettingsPanel () {
            let template = document.createElement("template");
            template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${this.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
            template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
            return template.content.firstElementChild;
        }
    } : (([Plugin, BDFDB]) => {
        const {DOM, Webpack} = window.BdApi;
        const WrapperClasses = Webpack.getModule(m => m.wrapperPlaying);

        return class BlurMedia extends Plugin {
            onLoad () {
                console.warn(WrapperClasses);
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

                this.modulePatches = {
                    before: [
                        "LazyImage"
                    ]
                };
            }

            onStart () {
                DOM.addStyle(this.name, this.styleTemplate);

                BDFDB.PatchUtils.forceAllUpdates(this);
                BDFDB.MessageUtils.rerenderAll();
            }

            onStop () {
                DOM.removeStyle(this.name);

                BDFDB.PatchUtils.forceAllUpdates(this);
                BDFDB.MessageUtils.rerenderAll();
            }

            processLazyImage(e) {
                if (e.methodname == "render") {
                    if (!e.instance.props.className) {
                        e.instance.props.className = "blur";
                        return;
                    }

                    if (e.instance.props.className.endsWith("blur"))
                        return;

                    e.instance.props.className = e.instance.props.className + " blur";
                }
            }
        };
    })(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();
