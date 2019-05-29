import path from 'path';
import * as Lint from 'tslint';
import * as ts from 'typescript';

type ImportNode = ts.NamespaceImport | ts.ImportDeclaration | ts.ExportSpecifier;

export class Rule extends Lint.Rules.AbstractRule {
  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    const options = new Set(this.ruleArguments.map(String));
    return this.applyWithWalker(new CustomOrderedImportsWalker(sourceFile, this.ruleName, options));
  }
}

interface ImportLine {
  moduleName: string;
  node?: ImportNode;
}

class CustomOrderedImportsWalker extends Lint.AbstractWalker<Set<string>> {
  private firstImport: ImportNode | undefined;
  private lastImport: ImportNode | undefined;
  private readonly importLines: ImportLine[] = [];

  private readonly relativeImports: ImportLine[] = [];
  private readonly externalImports: ImportLine[] = [];
  private readonly projectImports: {[project: string]: ImportLine[]} = {};

  public walk(sourceFile: ts.SourceFile): void {
    this.handleNode(sourceFile);
  }

  private handleNode(node: ts.Node): void {
    if (
      node.kind === ts.SyntaxKind.NamespaceImport ||
      node.kind === ts.SyntaxKind.ImportDeclaration
    ) {
      this.visitImportDeclaration(node as ImportNode);
    } else if (node.kind === ts.SyntaxKind.ExportSpecifier) {
      if (node.getText().indexOf(' from ') !== -1) {
        this.visitImportDeclaration(node as ImportNode);
      }
    } else if (node.kind === ts.SyntaxKind.EndOfFileToken) {
      this.visitEndOfFileToken(node as ts.EndOfFileToken);
    }
    for (const child of node.getChildren()) {
      this.handleNode(child);
    }
  }

  // Parse and save the import lines in their respective arrays
  public visitImportDeclaration(node: ImportNode): void {
    // Save the empty lines in the "importLines" array
    const prefixLength = node.getStart() - node.getFullStart();
    const prefix = node.getFullText().slice(0, prefixLength);
    if (prefix.indexOf('\n\n') >= 0 || prefix.indexOf('\r\n\r\n') >= 0) {
      this.importLines.push({moduleName: '\n'});
    }

    if (!this.firstImport) {
      this.firstImport = node;
    }
    this.lastImport = node;
    const moduleName = this.getModuleName(node);
    const importLine: ImportLine = {node, moduleName};

    const projectMatch = moduleName.match(/^@([^/]+)\//);
    const project = projectMatch && `@${projectMatch[1]}`;
    if (project && !this.options.has(project)) {
      if (!this.projectImports[project]) {
        this.projectImports[project] = [];
      }
      this.projectImports[project].push(importLine);
    } else if (moduleName.indexOf('.') === 0) {
      this.relativeImports.push(importLine);
    } else {
      this.externalImports.push(importLine);
    }

    this.importLines.push({node, moduleName});
  }

  public visitEndOfFileToken(node: ts.EndOfFileToken): void {
    if (this.relativeImports.length > 0) {
      for (const relativeImport of this.relativeImports) {
        if (relativeImport.node) {
          const fileName = node.getSourceFile().fileName;
          const folder = path.join(fileName, '..');
          const pathToModule = path.join(folder, relativeImport.moduleName);
          const root = path.resolve(__dirname, '../../');

          const importWithPrefix = pathToModule.replace(`${root}/`, '@');
          const [project, ...rest] = importWithPrefix.split('/');
          const restWithoutPrefix = rest[0] === 'src' ? rest.slice(1) : rest;
          const newModuleName = path.join(project, restWithoutPrefix.join('/'));

          const replacement = relativeImport.node
            .getText()
            .replace(relativeImport.moduleName, newModuleName);
          const projectWithSlash = `${project}/`;
          if (!this.projectImports[projectWithSlash]) {
            this.projectImports[projectWithSlash] = [];
          }
          this.projectImports[projectWithSlash].push({
            moduleName: newModuleName,
            // tslint:disable-next-line:no-object-literal-type-assertion
            node: {getText: () => replacement} as ts.ImportDeclaration,
          });
        }
      }
    }

    const importsByGroup = [this.externalImports];
    Object.keys(this.projectImports)
      .sort()
      .map(project => importsByGroup.push(this.projectImports[project]));
    const onlySingleImports = importsByGroup.filter(imports => imports.length > 1).length === 0;
    const join = onlySingleImports ? '\n' : '\n\n';
    const expectedImports = importsByGroup
      .map(imports =>
        imports
          .sort((i1, i2) => i1.moduleName.localeCompare(i2.moduleName))
          .map(i => i.node && this.getExpectedImport(i.node))
          .join('\n')
      )
      .filter(Boolean)
      .join(join);

    const currentImports = this.importLines
      .map(l => (l.moduleName === '\n' ? '' : l.node && l.node.getText()))
      .join('\n')
      .replace(/(.*)(\r)?\n+$/g, '$1');

    if (currentImports !== expectedImports && this.firstImport && this.lastImport) {
      const start = this.firstImport.getStart();
      const width = this.lastImport.getEnd() - start;
      const failureMessage = `Imports are not grouped and ordered. Expected: \n${expectedImports}\n`;
      const replacement = new Lint.Replacement(start, width, expectedImports);
      this.addFailureAt(start, width, failureMessage, replacement);
    }
  }

  private getModuleName(node: ImportNode): string {
    const IMPORT_REGEX = /^\s*(import|export)\s+(.*?)\s+from\s+['"](.*?)['"]\s*;?\s*$/ms;
    const match = node.getText().match(IMPORT_REGEX);
    const moduleNameGroupIndex = 3;
    if (match && match.length > moduleNameGroupIndex) {
      return match[moduleNameGroupIndex];
    }
    throw new Error(`Could not parse module name from import:\n${node.getText()}`);
  }

  private getCurlyBracesImport(importLine: string): string | undefined {
    const match = importLine.match(/\{([^\}]+)\}/g);
    return match ? match[0] : undefined;
  }

  private sortCurlyBracesImport(imports: string): string {
    // let shouldLog = false;
    // if (imports === '{BobineFille, BobineMere, Cliche, Perfo, Refente as RefenteModel}') {
    //   shouldLog = true;
    // }
    // if (shouldLog) {
    //   const separators = ['{', '}', ',', '\r\n', '\n', ' as '];
    //   let toSplit = [imports];
    //   separators.forEach(sep => {
    //     let newToSplit: string[] = [];
    //     toSplit.forEach(str => {
    //       newToSplit = newToSplit.concat(str.split(sep));
    //     });
    //     toSplit = newToSplit;
    //   });
    //   console.log(toSplit);
    // }

    // const tokens = imports.split(/[^\{\}(\r?\n)(, *)]+/).filter(Boolean);
    // const subImports = imports
    //   .split(/[\{\}(\r\n)(, *)]+/)
    //   .filter(Boolean)
    //   .map(s => s.trimLeft());
    // const sortedSubImports = subImports.sort((i1, i2) => i1.localeCompare(i2));

    // const sortedImportParts: (string | undefined)[] = [];
    // while (tokens.length > 0 || sortedSubImports.length > 0) {
    //   sortedImportParts.push(tokens.shift());
    //   sortedImportParts.push(sortedSubImports.shift());
    // }

    // return sortedImportParts.filter(Boolean).join('');
    return imports;
  }

  private getExpectedImport(node: ImportNode): string {
    const importLine = node.getText();
    const curlyBracesImport = this.getCurlyBracesImport(importLine);
    if (!curlyBracesImport) {
      return importLine;
    }
    const sortedCurlyBracesImport = this.sortCurlyBracesImport(curlyBracesImport);
    if (curlyBracesImport !== sortedCurlyBracesImport) {
      return importLine.replace(curlyBracesImport, sortedCurlyBracesImport);
    }
    return importLine;
  }
}
