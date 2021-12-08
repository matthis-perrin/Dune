import * as Lint from 'tslint';
import * as ts from 'typescript';

export class Rule extends Lint.Rules.AbstractRule {
  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(new EventHandlerNameWalker(sourceFile, this.getOptions()));
  }
}

interface Callback {
  isPrivateBound: boolean;
  node: ts.Node;
}

interface EventAttribute {
  callbackName: string;
  text: string;
}

class EventHandlerNameWalker extends Lint.RuleWalker {
  private readonly callbackRegistry: {[callbackName: string]: Callback} = {};
  private readonly callbacksToCheck: EventAttribute[] = [];

  public visitJsxAttribute(node: ts.JsxAttribute): void {
    const attributeName = node.name.escapedText.toString();
    const eventName = this.getCallbackNameForAttribute(attributeName);
    if (eventName && node.initializer) {
      const attributeValue = node.initializer.getText();
      const callbackMatch = attributeValue.match(/^{this\.([^\.]+)}$/);
      if (callbackMatch) {
        const callbackName = callbackMatch[1];
        const isCorrectName =
          callbackName.match(new RegExp(`^handle[a-zA-Z]*${eventName}$`)) !== null;
        if (!isCorrectName) {
          this.addFailureAtNode(
            node,
            `Invalid callback name "${callbackName}" for attribute ${attributeName}. For consistency reason, please use "handle${eventName}" or "handle[...]${eventName}"`
          );
        } else {
          this.callbacksToCheck.push({callbackName, text: node.getText()});
        }
      }
    }
    super.visitJsxAttribute(node);
  }

  public visitPropertyDeclaration(node: ts.PropertyDeclaration): void {
    const methodName = node.name.getText();
    const isPrivateBound = node.getText().match(/private [^ ]+ = \([^\)]*\)[^=]*=> \{/) !== null;
    this.callbackRegistry[methodName] = {isPrivateBound, node};
    super.visitPropertyDeclaration(node);
  }

  public visitMethodDeclaration(node: ts.MethodDeclaration): void {
    const methodName = node.name.getText();
    this.callbackRegistry[methodName] = {isPrivateBound: false, node};
    super.visitMethodDeclaration(node);
  }

  public visitEndOfFileToken(node: ts.EndOfFileToken): void {
    for (const callbackToCheck of this.callbacksToCheck) {
      const callback = this.callbackRegistry[callbackToCheck.callbackName];
      if (!(callback && callback.isPrivateBound)) {
        this.addFailureAtNode(
          callback.node,
          `The method "${callbackToCheck.callbackName}" should be private and bound if passed as an event handler: "${callbackToCheck.text}"`
        );
      }
    }
    super.visitEndOfFileToken(node);
  }

  private getCallbackNameForAttribute(attributeName: string): string | undefined {
    const callbackNameMatch = attributeName.match(/^on([A-Z][a-zA-Z]*)$/);
    if (callbackNameMatch) {
      return callbackNameMatch[1];
    }
    return undefined;
  }
}
