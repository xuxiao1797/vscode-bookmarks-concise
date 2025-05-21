"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
class Bookmark extends vscode.TreeItem {
    id;
    name;
    url;
    constructor(id, name, url) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.id = id;
        this.name = name;
        this.url = url;
        this.tooltip = `${this.url}`;
        this.description = this.url;
        this.command = {
            command: "bookmark.open",
            title: "Open Bookmark",
            arguments: [this.url],
        };
    }
}
class BookmarksProvider {
    _bookmarks = [];
    _context;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor(context) {
        this._context = context;
        this._loadBookmarks();
    }
    // 加载存储的书签
    _loadBookmarks() {
        const saved = this._context.globalState.get("bookmarks-saved");
        const url = vscode.window.activeTextEditor?.document.fileName || "";
        let name = "";
        if (!name) {
            const indexs = url.lastIndexOf("\\");
            name = url.substring(indexs + 1, url.length) || url;
        }
        this._bookmarks = saved || [{ id: Date.now().toString(), name, url }];
        // 如果首次使用，保存初始数据
        if (!saved) {
            this._saveBookmarks();
        }
    }
    // 保存书签到globalState
    _saveBookmarks() {
        this._context.globalState.update("bookmarks-saved", this._bookmarks);
    }
    // 添加书签
    addBookmark(name, url) {
        const newBookmark = {
            id: Date.now().toString(),
            name,
            url,
        };
        this._bookmarks.push(newBookmark);
        this._saveBookmarks();
        this.refresh();
    }
    // 删除书签
    deleteBookmark(id) {
        this._bookmarks = this._bookmarks.filter((b) => b.id !== id);
        this._saveBookmarks();
        this.refresh();
    }
    // 刷新视图
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        return Promise.resolve(this._bookmarks.map((b) => new Bookmark(b.id, b.name, b.url)));
    }
}
function activate(context) {
    const provider = new BookmarksProvider(context);
    // 注册视图
    vscode.window.registerTreeDataProvider("bookmarkView", provider);
    // 打开书签命令
    context.subscriptions.push(vscode.commands.registerCommand("bookmark.open", (url) => {
        vscode.workspace
            .openTextDocument(url)
            .then((doc) => {
            // 在VSCode编辑窗口展示读取到的文本
            vscode.window.showTextDocument(doc);
        }, (err) => {
            vscode.window.showInformationMessage("Open File Failed");
            console.log(`Open ${url} error, ${err}.`);
        })
            .then(undefined, (err) => {
            vscode.window.showInformationMessage("Open File Failed");
            console.log(`Open ${url} error, ${err}.`);
        });
    }));
    // 添加书签命令
    context.subscriptions.push(vscode.commands.registerCommand("bookmark.add", async () => {
        let name = await vscode.window.showInputBox({
            prompt: "Enter bookmark name",
        });
        const url = vscode.window.activeTextEditor?.document.fileName || "";
        if (!name) {
            const indexs = url.lastIndexOf("\\");
            name = url.substring(indexs + 1, url.length) || url;
        }
        if (name && url) {
            provider.addBookmark(name, url);
        }
    }));
    // 删除书签命令
    context.subscriptions.push(vscode.commands.registerCommand("bookmark.delete", (node) => {
        provider.deleteBookmark(node.id);
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map