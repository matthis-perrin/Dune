// Node imports
const path = require('path');
const fs = require('fs');

// Paths
const WEBPACK = path.resolve(__dirname);
const NODE_MODULES = path.join(WEBPACK, 'node_modules');

nodeModules = moduleName => path.join(NODE_MODULES, moduleName);
const {argv} = require(nodeModules('yargs'));
const targetDirectory = argv._[0] || '.';
const {ts, hbs, inlineCss, lintOnly, lib, noLint, lintAutoFix, dist = 'dist', noDevServer} = argv;

const ROOT = path.join(process.cwd(), targetDirectory);
const ENV = path.join(ROOT, '../env');
const DIST = path.join(ROOT, dist);
const SRC = path.join(ROOT, 'src');
const TSCONFIG_PATH = path.join(ROOT, 'tsconfig.json');
const TSLINT_PATH = path.join(ROOT, 'tslint.json');

// node_modules imports
const CleanCSS = require(nodeModules('clean-css'));
const CleanWebpackPlugin = require(nodeModules('clean-webpack-plugin'));
const CompressionPlugin = require(nodeModules('compression-webpack-plugin'));
const CopyWebpackPlugin = require(nodeModules('copy-webpack-plugin'));
const DisableOutputWebpackPlugin = require(nodeModules('disable-output-webpack-plugin'));
const DotenvWebpack = require(nodeModules('dotenv-webpack'));
const express = require(nodeModules('express'));
const ForkTsCheckerWebpackPlugin = require(nodeModules('fork-ts-checker-webpack-plugin'));
const glob = require(nodeModules('glob'));
const HtmlWebpackPlugin = require(nodeModules('html-webpack-plugin'));
const TsconfigPathsPlugin = require(nodeModules('tsconfig-paths-webpack-plugin'));
const middleware = require(nodeModules('webpack-dev-middleware'));
const nodeExternals = require(nodeModules('webpack-node-externals'));
const webpack = require(nodeModules('webpack'));

// Relative imports
const {logStats} = require('./logger');

// const CircularDependencyPlugin = require('circular-dependency-plugin');
// const circularDependencyPlugin = new CircularDependencyPlugin({
//   // exclude detection of files based on a RegExp
//   exclude: /node_modules/,
//   // add errors to webpack instead of warnings
//   failOnError: false,
//   // set the current working directory for displaying module paths
//   cwd: process.cwd(),
// });
// // Web only
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const {HotModuleReplacementPlugin} = require('webpack');
// const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

// Params processing
const Mode = {
  PRODUCTION: 'production',
  DEVELOPMENT: 'development',
};

const Target = {
  NODE: 'node',
  WEB: 'web',
  ELECTRON_MAIN: 'electron-main',
};

function checkParam(name, expectedValues) {
  const value = argv[name];
  if (expectedValues.indexOf(value) === -1) {
    throw new Error(
      `Invalid value for parameter --${name}, got "${value}", expected one of ${expectedValues
        .map(v => `"${v}"`)
        .join(', ')}`
    );
  }
  return value;
}

const mode = checkParam('mode', Object.values(Mode));
const target = lintOnly ? undefined : checkParam('target', Object.values(Target));

const isProd = mode === Mode.PRODUCTION;
const isDev = mode === Mode.DEVELOPMENT;
const isNode = target === Target.NODE || target === Target.ELECTRON_MAIN;
const isWeb = target === Target.WEB;
const isElectronMain = target === Target.ELECTRON_MAIN;
const isLib = !!lib;

// Webpack config generation
function getWebpackConfig() {
  const PREFIX = '__TsChecker_Start__';
  const SUFFIX = '__TsChecker_End__';
  const tsconfigPathsPlugin = new TsconfigPathsPlugin({configFile: TSCONFIG_PATH});
  const dotenvWebpackPlugin = new DotenvWebpack({path: path.join(ENV, `${mode}.env`)});
  const forkTsCheckerWebpackPlugin = new ForkTsCheckerWebpackPlugin({
    async: false,
    tsconfig: TSCONFIG_PATH,
    compilerOptions: {},
    silent: true,
    tslint: TSLINT_PATH,
    tslint: !noLint,
    tslintAutoFix: isProd || lintAutoFix,
    // watch: ROOT, // Not sure if that useful
    formatter: msg => `${PREFIX}${JSON.stringify(msg)}${SUFFIX}`,
    // We should use `ForkTsCheckerWebpackPlugin.TWO_CPU_FREE` instead to speed up typecheck.
    // Or maybe even `ForkTsCheckerWebpackPlugin.ONE_CPU_FREE`.
    // But for now we need to stay with only 1 worker because some tslint rules will fail for
    // some reason. See https://github.com/Realytics/fork-ts-checker-webpack-plugin/issues/135.
    workers: 1,
  });
  const cleanWebpackPlugin = new CleanWebpackPlugin({
    cleanAfterEveryBuildPatterns: ['!images/**/*'],
  });
  const progressPlugin = new webpack.ProgressPlugin();

  const externals = [];
  if (isNode) {
    const nodeExternalsPlugin = nodeExternals({modulesDir: path.join(ROOT, 'node_modules')});
    externals.push(nodeExternalsPlugin);
  }

  // Babel target
  // const targets = isWeb ? '>0.5%' : 'node 10.5.0';
  const targets = isWeb ? 'chrome >= 73' : 'node 10.5.0';

  // Babel presets
  const babelPresetEnv = [
    nodeModules('@babel/preset-env'),
    {useBuiltIns: false, targets, modules: 'commonjs'},
  ];
  const babelPresetTypescript = [nodeModules('@babel/preset-typescript')];
  const babelPresets = [babelPresetEnv, babelPresetTypescript];
  if (isWeb) {
    const babelPresetReact = [nodeModules('@babel/preset-react')];
    babelPresets.push(babelPresetReact);
  }

  // Babel plugins
  const babelPluginClassProperties = [nodeModules('@babel/plugin-proposal-class-properties')];
  const babelPluginObjectRestSpread = [nodeModules('@babel/plugin-proposal-object-rest-spread')];
  const babelPlugins = [babelPluginClassProperties, babelPluginObjectRestSpread];

  const babelLoader = {
    test: /\.tsx?$/,
    exclude: /node_modules/,
    loader: nodeModules('babel-loader'),
    options: {
      presets: babelPresets,
      plugins: babelPlugins,
    },
  };

  const noopLoader = {
    test: /.*/,
    loader: nodeModules('null-loader'),
  };

  let loaders = lintOnly ? [noopLoader] : [babelLoader];
  let plugins = [progressPlugin];
  if (lintOnly) {
    const disableOutputWebpackPlugin = new DisableOutputWebpackPlugin();
    plugins = plugins.concat([forkTsCheckerWebpackPlugin, disableOutputWebpackPlugin]);
  } else {
    plugins = plugins.concat([dotenvWebpackPlugin, forkTsCheckerWebpackPlugin]);
  }

  if (hbs) {
    const handlebarsLoader = {
      test: /\.hbs$/,
      loader: nodeModules('handlebars-loader'),
    };
    loaders.push(handlebarsLoader);

    let inlineCssOption;
    if (inlineCss) {
      const cleanCSS = new CleanCSS();
      inlineCssOption = cleanCSS.minify(fs.readFileSync(path.join(ROOT, inlineCss))).styles;
    }

    const htmlWebpackPlugin = new HtmlWebpackPlugin({
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
      template: path.join(ROOT, hbs),
      inlineCss: inlineCssOption,
    });
    plugins.push(htmlWebpackPlugin);
  }

  if (isWeb) {
    plugins.push(
      cleanWebpackPlugin,
      new CopyWebpackPlugin([
        {
          from: path.join(SRC, 'images'),
          to: path.join(DIST, 'images'),
        },
      ])
    );
  }

  // if (isWeb && isProd) {
  //   const compressionPlugin = new CompressionPlugin({
  //     test: /\.js$/,
  //     deleteOriginalAssets: true,
  //   });
  //   plugins.push(compressionPlugin);
  // }

  const optimization = {};
  if (isWeb) {
    optimization.splitChunks = {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'initial',
        },
      },
    };
  }

  const performance = {
    hints: false,
  };

  const devtool = isWeb && isProd ? 'hidden-source-map' : 'eval-source-map';
  const outputFilename = isWeb ? '[name].[contenthash].js' : '[name].js';

  const devServer = {};
  if (!noDevServer && isWeb && isDev) {
    devServer.contentBase = DIST;
  }

  const entry = {};
  const entryPoints = glob.sync(path.join(ROOT, ts));
  entryPoints.forEach(f => (entry[path.basename(f, path.extname(f))] = f));

  const output = {filename: outputFilename, path: DIST};
  if (isLib) {
    output.libraryTarget = 'commonjs2';
  }

  const module = {rules: loaders};
  const resolve = {extensions: ['.ts', '.tsx', '.js'], plugins: [tsconfigPathsPlugin]};
  const context = ROOT;

  return {
    mode,
    target: isWeb ? 'electron-renderer' : target,
    entry,
    output,
    module,
    externals,
    plugins,
    optimization,
    performance,
    resolve,
    devtool,
    devServer,
    context,
  };
}

// Handler called everytime the webpack build finishes
function webpackBuildHandler(err, stats) {
  if (err) {
    console.error(err);
  } else if (stats) {
    logStats(stats, path.join(ROOT, '..'));
  }
}

// Create a dev server to do incremental builds and serve web assets
function startDevServer(compiler) {
  const app = express();
  const port = 3000;
  console.log(`Starting dev server on ${port}.`);
  app.use(
    middleware(compiler, {
      reporter: function reporter(middlewareOptions, options) {
        if (options.stats) {
          webpackBuildHandler(undefined, options.stats);
        } else {
          console.log('Compiling...');
        }
      },
    })
  );
  app.listen(port);
}

// Create and run the webpack compiler
const compiler = webpack(getWebpackConfig());
if (isDev) {
  if (isWeb && !noDevServer) {
    startDevServer(compiler);
  } else {
    compiler.watch({}, webpackBuildHandler);
  }
} else {
  compiler.run(webpackBuildHandler);
}
