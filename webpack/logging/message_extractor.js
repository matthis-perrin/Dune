const path = require('path');
const chalk = require('../node_modules/chalk');

module.exports.MessageType = {
  Babel: 'babel',
  Typecheck: 'typecheck',
  Linter: 'linter',
  Other: 'other',
};

module.exports.MessageSeverity = {
  Error: 'error',
  Warning: 'warning',
  Advice: 'advice',
};

// Extract data from the message and returns an object with this shape:
// {
//   type: 'babel' | 'typecheck' | 'linter' | 'other'
//   severity: 'error' | 'warning' | 'advice'
//   message: string
//   tag: string | undefined
//   file: string | undefined
//   line: number | undefined
//   context: string | undefined
// }
module.exports.extractMessage = function(message, root, defaultSeverity) {
  const babelMessage = extractBabelMessage(message, root, defaultSeverity);
  if (babelMessage) {
    return babelMessage;
  }
  const typescriptMessage = extractTypescriptMessage(message, root);
  if (typescriptMessage) {
    return typescriptMessage;
  }
  return {
    type: 'other',
    severity: defaultSeverity,
    message: getMessageContent(message),
  };
};

function extractBabelMessage(message, root, severity) {
  if (
    message.name === 'ModuleBuildError' &&
    message.message &&
    message.message.indexOf('SyntaxError') >= 0
  ) {
    const content = message.error.toString();
    const matches = content.match(/[^:]+: ([^:]+): (.*)\(([^\):]*)[^\)]*\)/);
    if (!matches || matches.length < 4) {
      return null;
    } else {
      const type = 'babel';
      const file = relativeFileName(matches[1], root);
      const message = matches[2];
      const line = matches[3];
      const context = content
        .split('\n')
        .slice(2)
        .join('\n');
      return {type, severity, message, file, line, context};
    }
  } else {
    return null;
  }
}

const PREFIX = '__TsChecker_Start__';
const SUFFIX = '__TsChecker_End__';
const TYPESCRIPT_MESSAGE_REGEX = new RegExp(`(?<=${PREFIX})(.*)(?=${SUFFIX})`, 'g');

const typeMap = {
  diagnostic: 'typecheck',
  lint: 'linter',
};

function extractTypescriptMessage(message, root) {
  // TODO - Extract this and the same from index.js
  try {
    const matches = message.message.match(TYPESCRIPT_MESSAGE_REGEX);
    if (matches && matches.length > 0) {
      // This should have the shape of `NormalizedMessage` defined here
      // https://github.com/Realytics/fork-ts-checker-webpack-plugin/blob/master/src/NormalizedMessage.ts#L22
      const parsedMessage = JSON.parse(matches[0]);
      let {
        type, // 'diagnostic' | 'lint';
        code, // string | number;
        severity, // 'error' | 'warning';
        content, // string;
        file, // string;
        line, // number;
        character, // number;
      } = parsedMessage;
      type = typeMap[type] || type;
      file = file ? relativeFileName(file, root) : undefined;
      const message = content;
      const tag = type === 'typecheck' ? `TS${code}` : code;
      return {type, severity, message, tag, file, line};
    } else {
      return null;
    }
  } catch (err) {
    console.error(`${chalk.black.bgRed('Invalid Typecheck error')}\n${err}\n${message}`);
    return null;
  }
}

function relativeFileName(file, root) {
  return path.relative(root, file);
}

function getMessageContent(message) {
  if (typeof message === 'string') {
    return message;
  } else if (typeof message === 'object') {
    if (message.message) {
      if (message.details) {
        return `${message.message}\n${message.details}`;
      }
      return message.message;
    }
    const attr = ['error', 'warning', 'message'];
    for (let i = 0; i < attr.length; i++) {
      if (message[attr]) {
        if (message[attr].toString) {
          return message[attr].toString();
        }
        return String(message[attr]);
      }
    }
  }
  return String(message);
}
