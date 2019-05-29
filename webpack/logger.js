const chalk = require('./node_modules/chalk');
const prettyBytes = require('./node_modules/pretty-bytes');
const pad = require('./node_modules/pad');

const {extractMessage, MessageType, MessageSeverity} = require('./logging/message_extractor');

//
// CONSTANTS
//

// Colors and styles used by the logger
const ERROR_COLOR = chalk.red;
const WARNING_COLOR = chalk.yellow;
const ADVICE_COLOR = chalk.hex('#FFFFFF');
const TITLE_COLOR = chalk.underline.hex('#FFFFFF');
const FILE_COLOR = chalk.hex('#1AB2FF');
const LINE_NUMBER_COLOR = chalk.hex('#999999');
const TAG_COLOR = chalk.dim;
const EMITTED_ICON_COLOR = chalk.green;

// Color mapping for a severity
const MessageSeverityColor = {
  [MessageSeverity.Error]: ERROR_COLOR,
  [MessageSeverity.Warning]: WARNING_COLOR,
  [MessageSeverity.Advice]: ADVICE_COLOR,
};

// Order of importance for message types and severities
const MessageTypeOrder = [
  MessageType.Babel,
  MessageType.Typecheck,
  MessageType.Linter,
  MessageType.Other,
];
const MessageSeverityOrder = [
  MessageSeverity.Error,
  MessageSeverity.Warning,
  MessageSeverity.Advice,
];

//
// FORMATTING UTILITIES
//

function quantity(str, count) {
  return count > 1 ? `${count} ${str}s` : `${count} ${str}`;
}

function joinList(list) {
  if (list.length > 2) {
    list.slice(-1).join(', ') + list[list.length - 1];
  }
  return list.join(' and ');
}

const capitalize = str => str.charAt(0).toUpperCase() + str.toLowerCase().substring(1);

//
// PRINTING LOGIC
//

function printAssets(assets) {
  const assetsCount = assets.length;
  if (assetsCount === 0) {
    return;
  }
  console.log(TITLE_COLOR(`${quantity('asset', assetsCount)}:`));
  const maxNameLength = assets.reduce((maxLength, asset) => Math.max(maxLength, asset.length), 0);
  assets.forEach(asset => {
    const {name, size, emitted} = asset;
    const nameStr = FILE_COLOR(pad(maxNameLength, name));
    const sizeStr = prettyBytes(size);
    const emittedStr = emitted ? `${sizeStr} ${EMITTED_ICON_COLOR('✔')}` : 'not emitted';
    console.log(`${nameStr} ${emittedStr}`);
  });
}

function printMessagesSummary(messages) {
  console.log(TITLE_COLOR(`Found ${quantity('problem', messages.length)}:`));
  // Count messages by severity then by type
  const messageBySeverityByType = {};
  messages.forEach(m => {
    const {severity, type} = m;
    if (!messageBySeverityByType[severity]) {
      messageBySeverityByType[severity] = {};
    }
    if (!messageBySeverityByType[severity][type]) {
      messageBySeverityByType[severity][type] = 0;
    }
    messageBySeverityByType[severity][type]++;
  });
  // Create a summary for each severity and count total
  const summariesBySeverity = {};
  const severities = Object.keys(messageBySeverityByType);
  severities.forEach(severity => {
    const types = Object.keys(messageBySeverityByType[severity]);
    const sortedTypes = types.sort(
      (t1, t2) => MessageTypeOrder.indexOf(t1) - MessageTypeOrder.indexOf(t2)
    );
    let total = 0;
    const summaries = [];
    sortedTypes.forEach(type => {
      const count = messageBySeverityByType[severity][type];
      total += count;
      summaries.push(`${count} ${type}`);
    });
    summariesBySeverity[severity] = summaries;
    messageBySeverityByType[severity]['total'] = total;
  });
  // Create the final summary
  const sortedSeverities = severities.sort(
    (s1, s2) => MessageSeverityOrder.indexOf(s1) - MessageSeverityOrder.indexOf(s2)
  );
  const summary = joinList(
    sortedSeverities.map(severity => {
      const messagesByType = messageBySeverityByType[severity];
      const types = Object.keys(messagesByType);
      const count = messagesByType['total'];
      const quantityLabel = types.length === 1 ? `${types[0]} ${severity}` : severity;
      const color = MessageSeverityColor[severity];
      const quantityStr = color(quantity(quantityLabel, count));

      const details = summariesBySeverity[severity];
      const detailsStr = details.length > 1 ? ` (${joinList(details)})` : '';
      return quantityStr + detailsStr;
    })
  );
  console.log(summary);
}

function printMessages(messages) {
  // Group messages by files
  const messagesByFiles = {};
  const globalMessages = [];
  messages.forEach(m => {
    const {file, severity} = m;
    if (file) {
      if (!messagesByFiles[file]) {
        messagesByFiles[file] = [];
      }
      messagesByFiles[file].push(m);
    } else {
      globalMessages.push(m);
    }
  });

  // Sort the files by name and sort messages within a same file by line number then by severity
  const files = Object.keys(messagesByFiles).sort((f1, f2) => f1.localeCompare(f2));
  files.forEach(f => {
    messagesByFiles[f].sort((msg1, msg2) => {
      if (msg1.line === undefined) {
        if (msg2.line === undefined) {
          return (
            MessageSeverityOrder.indexOf(msg1.severity) -
            MessageSeverityOrder.indexOf(msg2.severity)
          );
        }
        return -1;
      } else {
        if (msg2.line === undefined) {
          return 1;
        }
        if (msg1.line === msg2.line) {
          return (
            MessageSeverityOrder.indexOf(msg1.severity) -
            MessageSeverityOrder.indexOf(msg2.severity)
          );
        }
        return msg1.line - msg2.line;
      }
    });
  });

  // Print messages by files
  files.forEach((file, index) => {
    const messages = messagesByFiles[file];
    const longestLineNumber = messages.reduce(
      (max, msg) => Math.max(max, msg.line === undefined ? 10 : msg.line),
      0
    );
    console.log(FILE_COLOR(file));
    const maxSeverityLength = messages.reduce((len, msg) => Math.max(len, msg.severity.length), 0);
    // Sort by line then by severity
    messages.forEach(msg => {
      const lineNumber = pad(
        `L${msg.line === undefined ? '??' : msg.line}`,
        longestLineNumber.toString().length + 1
      ); // +1 for the "L"
      const {message, severity, type} = msg;
      const tag = msg.tag ? `(${type}: ${msg.tag})` : `(${type})`;

      const severityStr = MessageSeverityColor[severity](
        pad(severity.toUpperCase(), maxSeverityLength)
      );
      const lineStr = LINE_NUMBER_COLOR(lineNumber);
      const messageStr = message;
      const tagStr = TAG_COLOR(tag);
      console.log(`${severityStr} ${lineStr} ${messageStr} ${tagStr}`);
      if (msg.context) {
        console.log(msg.context);
      }
    });
    if (index < files.length - 1) {
      console.log();
    }
  });

  // Print global messages
  if (globalMessages.length > 0) {
    printSectionSeparator();
    const sortedFlobalMessages = globalMessages.sort(
      (s1, s2) => MessageSeverityOrder.indexOf(s1) - MessageSeverityOrder.indexOf(s2)
    );
    console.log(
      sortedFlobalMessages.map(m => MessageSeverityColor[m.severity](m.message)).join('\n\n')
    );
  }
}

function printSectionSeparator() {
  console.log();
}

//
// ENTRY POINT
//

module.exports.logStats = function(stats, root) {
  const {errors, warnings} = stats.compilation;
  const {assets} = stats.toJson({assets: true});

  let allMessages = [];
  allMessages = allMessages.concat(errors.map(err => extractMessage(err, root, 'error')));
  allMessages = allMessages.concat(warnings.map(warn => extractMessage(warn, root, 'warning')));

  printSectionSeparator();
  printAssets(assets);

  if (allMessages.length > 0) {
    printSectionSeparator();
    printMessagesSummary(allMessages);
    printSectionSeparator();
    printMessages(allMessages);
  }
  printSectionSeparator();
};
