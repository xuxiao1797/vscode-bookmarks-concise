import * as vscode from "vscode";

// 定义书签数据类型接口
interface BookmarkData {
  id: string;
  name: string;
  url: string;
}

class Bookmark extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly url: string
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);

    this.tooltip = `${this.url}`;
    this.description = this.url;
    this.command = {
      command: "bookmark.open",
      title: "Open Bookmark",
      arguments: [this.url],
    };
  }
}

class BookmarksProvider implements vscode.TreeDataProvider<Bookmark> {
  private _bookmarks: BookmarkData[] = [];
  private _context: vscode.ExtensionContext;

  private _onDidChangeTreeData = new vscode.EventEmitter<
    Bookmark | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._loadBookmarks();
  }

  // 加载存储的书签
  private _loadBookmarks() {
    const saved =
      this._context.globalState.get<BookmarkData[]>("bookmarks-saved");
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
  private _saveBookmarks() {
    this._context.globalState.update("bookmarks-saved", this._bookmarks);
  }

  // 添加书签
  public addBookmark(name: string, url: string) {
    const newBookmark: BookmarkData = {
      id: Date.now().toString(),
      name,
      url,
    };

    this._bookmarks.push(newBookmark);
    this._saveBookmarks();
    this.refresh();
  }

  // 删除书签
  public deleteBookmark(id: string) {
    this._bookmarks = this._bookmarks.filter((b) => b.id !== id);
    this._saveBookmarks();
    this.refresh();
  }

  // 刷新视图
  public refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: Bookmark): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<Bookmark[]> {
    return Promise.resolve(
      this._bookmarks.map((b) => new Bookmark(b.id, b.name, b.url))
    );
  }
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new BookmarksProvider(context);

  // 注册视图
  vscode.window.registerTreeDataProvider("bookmarkView", provider);

  // 打开书签命令
  context.subscriptions.push(
    vscode.commands.registerCommand("bookmark.open", (url: string) => {
      vscode.workspace
        .openTextDocument(url)
        .then(
          (doc) => {
            // 在VSCode编辑窗口展示读取到的文本
            vscode.window.showTextDocument(doc);
          },
          (err) => {
            vscode.window.showInformationMessage("Open File Failed");
            console.log(`Open ${url} error, ${err}.`);
          }
        )
        .then(undefined, (err) => {
          vscode.window.showInformationMessage("Open File Failed");
          console.log(`Open ${url} error, ${err}.`);
        });
    })
  );

  // 添加书签命令
  context.subscriptions.push(
    vscode.commands.registerCommand("bookmark.add", async () => {
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
    })
  );

  // 删除书签命令
  context.subscriptions.push(
    vscode.commands.registerCommand("bookmark.delete", (node: Bookmark) => {
      provider.deleteBookmark(node.id);
    })
  );
}

export function deactivate() {}
