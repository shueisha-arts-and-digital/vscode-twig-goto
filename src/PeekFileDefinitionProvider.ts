import * as vscode from 'vscode';

export default class PeekFileDefinitionProvider implements vscode.DefinitionProvider {
  resourceAppPaths: string[] = [];
  resourcePagePaths: string[] = [];

  constructor(resourcePagePaths: string[] = []) {
    this.resourcePagePaths = resourcePagePaths;
  }

  getResourceName(document: vscode.TextDocument, position: vscode.Position): String[] {
    const range = document.getWordRangeAtPosition(position, /['"]([^'"]*?)['"]/);
    const selectedText = document.getText(range);
    const resourceParts = selectedText.match(/['"]([^'"]*?)['"]/);
    if (resourceParts === null) { return []; }
    const filepath = resourceParts[1];

    let file = '';
    const possibleFileNames: String[] = [];
    this.resourcePagePaths.forEach((resourcePagePath) => {
      file = resourcePagePath + "/" + filepath;
      possibleFileNames.push(file);
    });

    return possibleFileNames;
  }

  searchFilePath(fileName: String): Thenable<vscode.Uri[]> {
    return vscode.workspace.findFiles(`${fileName}`); // Returns promise
  }

  async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<any[] | vscode.Location | vscode.Location[] | undefined> {
    const resourceNames = this.getResourceName(document, position);
    const searchPathActions = resourceNames.map(this.searchFilePath);
    const searchPromises = Promise.all(searchPathActions); // pass array of promises
    const paths = await searchPromises;

    // @ts-ignore
    const filePaths: any[] = [].concat.apply([], paths);
    if (!filePaths.length) {
      return undefined;
    }

    const allPaths: any[] = [];
    filePaths.forEach((filePath) => {
      allPaths.push(new vscode.Location(vscode.Uri.file(filePath.path), new vscode.Position(0, 0)));
    });

    return allPaths;
  }
}
