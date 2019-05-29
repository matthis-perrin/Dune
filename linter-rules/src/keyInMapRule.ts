import * as Lint from 'tslint';
import * as ts from 'typescript';

export class Rule extends Lint.Rules.AbstractRule {
  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    const options = new Set(this.ruleArguments.map(String));
    return this.applyWithWalker(new KeyInMapWalker(sourceFile, this.ruleName, options));
  }
}

class KeyInMapWalker extends Lint.AbstractWalker<Set<string>> {
  public walk(sourceFile: ts.SourceFile): void {
    this.handleNode(sourceFile);
  }

  private handleNode(node: ts.Node): void {
    if (node.kind === ts.SyntaxKind.TaggedTemplateExpression) {
      this.visitTaggedTemplateExpression(node as ts.TaggedTemplateExpression);
    } else if (node.kind === ts.SyntaxKind.CallExpression) {
      this.visitCallExpression(node as ts.CallExpression);
    }
    for (const child of node.getChildren()) {
      this.handleNode(child);
    }
  }

  private getFirstJSXFragment(node: ts.Node): {node: ts.JsxFragment; depth: number} | undefined {
    let bestMatch = undefined as {node: ts.JsxFragment; depth: number} | undefined;
    for (const child of node.getChildren()) {
      if (child.kind === ts.SyntaxKind.JsxFragment) {
        return {node: child as ts.JsxFragment, depth: 0};
      }
      const firstMatch = this.getFirstJSXFragment(child);
      if (firstMatch) {
        firstMatch.depth++;
        if (bestMatch && bestMatch.depth > firstMatch.depth) {
          bestMatch = firstMatch;
        } else if (!bestMatch) {
          bestMatch = firstMatch;
        }
      }
    }
    return bestMatch;
  }

  private getJSXAttributes(node: ts.Node, firstRun: boolean = true): string[] {
    let attributes = [] as string[];
    if ([ts.SyntaxKind.JsxSpreadAttribute, ts.SyntaxKind.JsxAttribute].indexOf(node.kind) !== -1) {
      const texts = node.getText().split('=');
      if (texts.length > 1) {
        attributes.push(texts[0]);
      }
    } else if (!firstRun && node.kind === ts.SyntaxKind.JsxFragment) {
      return attributes;
    }
    for (const child of node.getChildren()) {
      attributes = attributes.concat(this.getJSXAttributes(child, false));
    }
    return attributes;
  }

  private visitTaggedTemplateExpression(node: ts.TaggedTemplateExpression): void {
    if (node.getText().match(/\.map/)) {
      if (
        node.getSourceFile().fileName ===
        '/Users/matthis/Desktop/plex-downloader/client/src/js/components/core/Dropdown.tsx'
      ) {
        const fragment = this.getFirstJSXFragment(node);
        if (fragment) {
          this.handleAttributesForNode(node, this.getJSXAttributes(fragment.node));
        }
      }
    }
  }

  private visitCallExpression(node: ts.CallExpression): void {
    const expression = node.expression.getText();
    if (expression.match(/\.map$/)) {
      const firstArgument = node.arguments[0];
      if (firstArgument.kind === ts.SyntaxKind.ArrowFunction) {
        const callback = firstArgument as ts.ArrowFunction;
        if (callback.body.kind === ts.SyntaxKind.ParenthesizedExpression) {
          const callbackBody = callback.body as ts.ParenthesizedExpression;
          if (callbackBody.expression.kind === ts.SyntaxKind.JsxElement) {
            const returnedJSXElement = callbackBody.expression as ts.JsxElement;
            const attributes = returnedJSXElement.openingElement.attributes.properties;
            const attributeNames = attributes.map(a => a.name);
            const identifiedAttributeNames = attributeNames.filter(
              a => a && a.kind === ts.SyntaxKind.Identifier
            ) as ts.Identifier[];
            const attributesAsString = identifiedAttributeNames.map(a => a.getText());
            this.handleAttributesForNode(node, attributesAsString);
          }
        }
      }
    }
  }

  private handleAttributesForNode(node: ts.Node, attributes: string[]): void {
    if (attributes.indexOf('key') === -1) {
      this.addFailureAtNode(
        node,
        'Missing "key" attribute when rendering a JSX element within a "map" call'
      );
    }
  }
}
