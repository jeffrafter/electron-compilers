'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mimeTypes = require('@paulcbetts/mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _compilerBase = require('../compiler-base');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const inputMimeTypes = ['text/html'];
let cheerio = null;

const d = require('debug')('electron-compile:inline-html');

const compiledCSS = {
  'text/less': true,
  'text/scss': true,
  'text/sass': true,
  'text/stylus': true
};

/**
 * @access private
 */
class InlineHtmlCompiler extends _compilerBase.CompilerBase {
  constructor(compileBlock, compileBlockSync) {
    super();

    this.compileBlock = compileBlock;
    this.compileBlockSync = compileBlockSync;
  }

  static createFromCompilers(compilersByMimeType) {
    d(`Setting up inline HTML compilers: ${JSON.stringify(Object.keys(compilersByMimeType))}`);

    let compileBlock = (() => {
      var _ref = _asyncToGenerator(function* (sourceCode, filePath, mimeType, ctx) {
        let realType = mimeType;
        if (!mimeType && ctx.tag === 'script') realType = 'application/javascript';

        if (!realType) return sourceCode;

        let compiler = compilersByMimeType[realType] || compilersByMimeType['text/plain'];
        let ext = _mimeTypes2.default.extension(realType);
        let fakeFile = `${filePath}:inline_${ctx.count}.${ext}`;

        d(`Compiling inline block for ${filePath} with mimeType ${mimeType}`);
        if (!(yield compiler.shouldCompileFile(fakeFile, ctx))) return sourceCode;
        return (yield compiler.compileSync(sourceCode, fakeFile, ctx)).code;
      });

      return function compileBlock(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      };
    })();

    let compileBlockSync = (sourceCode, filePath, mimeType, ctx) => {
      let realType = mimeType;
      if (!mimeType && ctx.tag === 'script') realType = 'application/javascript';

      if (!realType) return sourceCode;

      let compiler = compilersByMimeType[realType] || compilersByMimeType['text/plain'];
      let ext = _mimeTypes2.default.extension(realType);
      let fakeFile = `${filePath}:inline_${ctx.count}.${ext}`;

      d(`Compiling inline block for ${filePath} with mimeType ${mimeType}`);
      if (!compiler.shouldCompileFileSync(fakeFile, ctx)) return sourceCode;
      return compiler.compileSync(sourceCode, fakeFile, ctx).code;
    };

    return new InlineHtmlCompiler(compileBlock, compileBlockSync);
  }

  static getInputMimeTypes() {
    return inputMimeTypes;
  }

  shouldCompileFile(fileName, compilerContext) {
    return _asyncToGenerator(function* () {
      return true;
    })();
  }

  determineDependentFiles(sourceCode, filePath, compilerContext) {
    return _asyncToGenerator(function* () {
      return [];
    })();
  }

  each(nodes, selector) {
    return _asyncToGenerator(function* () {
      let acc = [];
      nodes.each(function (i, el) {
        let promise = selector(i, el);
        if (!promise) return false;

        acc.push(promise);
        return true;
      });

      yield Promise.all(acc);
    })();
  }

  eachSync(nodes, selector) {
    // NB: This method is here just so it's easier to mechanically
    // translate the async compile to compileSync
    return nodes.each((i, el) => {
      selector(i, el);
      return true;
    });
  }

  compile(sourceCode, filePath, compilerContext) {
    var _this = this;

    return _asyncToGenerator(function* () {
      cheerio = cheerio || require('cheerio');

      //Leave the attributes casing as it is, because of Angular 2 and maybe other case-sensitive frameworks
      let $ = cheerio.load(sourceCode, { lowerCaseAttributeNames: false });
      let toWait = [];

      let that = _this;
      let styleCount = 0;
      toWait.push(_this.each($('style'), (() => {
        var _ref2 = _asyncToGenerator(function* (i, el) {
          let mimeType = $(el).attr('type') || 'text/plain';

          let thisCtx = Object.assign({
            count: styleCount++,
            tag: 'style'
          }, compilerContext);

          let origText = $(el).text();
          let newText = yield that.compileBlock(origText, filePath, mimeType, thisCtx);

          if (origText !== newText) {
            $(el).text(newText);
            $(el).attr('type', 'text/css');
          }
        });

        return function (_x5, _x6) {
          return _ref2.apply(this, arguments);
        };
      })()));

      let scriptCount = 0;
      toWait.push(_this.each($('script'), (() => {
        var _ref3 = _asyncToGenerator(function* (i, el) {
          let src = $(el).attr('src');
          if (src && src.length > 2) {
            $(el).attr('src', InlineHtmlCompiler.fixupRelativeUrl(src));
            return;
          }

          let thisCtx = Object.assign({
            count: scriptCount++,
            tag: 'script'
          }, compilerContext);

          let mimeType = $(el).attr('type') || 'application/javascript';
          let origText = $(el).text();
          let newText = yield that.compileBlock(origText, filePath, mimeType, thisCtx);

          if (origText !== newText) {
            $(el).text(newText);
            $(el).attr('type', 'application/javascript');
          }
        });

        return function (_x7, _x8) {
          return _ref3.apply(this, arguments);
        };
      })()));

      $('link').map(function (i, el) {
        let href = $(el).attr('href');
        if (href && href.length > 2) {
          $(el).attr('href', InlineHtmlCompiler.fixupRelativeUrl(href));
        }

        // NB: In recent versions of Chromium, the link type MUST be text/css or
        // it will be flat-out ignored. Also I hate myself for hardcoding these.
        let type = $(el).attr('type');
        if (compiledCSS[type]) $(el).attr('type', 'text/css');
      });

      $('x-require').map(function (i, el) {
        let src = $(el).attr('src');

        // File URL? Bail
        if (src.match(/^file:/i)) return;

        // Absolute path? Bail.
        if (src.match(/^([\/]|[A-Za-z]:)/i)) return;

        try {
          $(el).attr('src', _path2.default.resolve(_path2.default.dirname(filePath), src));
        } catch (e) {
          $(el).text(`${e.message}\n${e.stack}`);
        }
      });

      yield Promise.all(toWait);

      return {
        code: $.html(),
        mimeType: 'text/html'
      };
    })();
  }

  shouldCompileFileSync(fileName, compilerContext) {
    return true;
  }

  determineDependentFilesSync(sourceCode, filePath, compilerContext) {
    return [];
  }

  compileSync(sourceCode, filePath, compilerContext) {
    cheerio = cheerio || require('cheerio');

    //Leave the attributes casing as it is, because of Angular 2 and maybe other case-sensitive frameworks
    let $ = cheerio.load(sourceCode, { lowerCaseAttributeNames: false });

    let that = this;
    let styleCount = 0;
    this.eachSync($('style'), (() => {
      var _ref4 = _asyncToGenerator(function* (i, el) {
        let mimeType = $(el).attr('type');

        let thisCtx = Object.assign({
          count: styleCount++,
          tag: 'style'
        }, compilerContext);

        let origText = $(el).text();
        let newText = that.compileBlockSync(origText, filePath, mimeType, thisCtx);

        if (origText !== newText) {
          $(el).text(newText);
          $(el).attr('type', 'text/css');
        }
      });

      return function (_x9, _x10) {
        return _ref4.apply(this, arguments);
      };
    })());

    let scriptCount = 0;
    this.eachSync($('script'), (() => {
      var _ref5 = _asyncToGenerator(function* (i, el) {
        let src = $(el).attr('src');
        if (src && src.length > 2) {
          $(el).attr('src', InlineHtmlCompiler.fixupRelativeUrl(src));
          return;
        }

        let thisCtx = Object.assign({
          count: scriptCount++,
          tag: 'script'
        }, compilerContext);

        let mimeType = $(el).attr('type');

        let oldText = $(el).text();
        let newText = that.compileBlockSync(oldText, filePath, mimeType, thisCtx);

        if (oldText !== newText) {
          $(el).text(newText);
          $(el).attr('type', 'application/javascript');
        }
      });

      return function (_x11, _x12) {
        return _ref5.apply(this, arguments);
      };
    })());

    $('link').map((i, el) => {
      let href = $(el).attr('href');
      if (href && href.length > 2) {
        $(el).attr('href', InlineHtmlCompiler.fixupRelativeUrl(href));
      }

      // NB: In recent versions of Chromium, the link type MUST be text/css or
      // it will be flat-out ignored. Also I hate myself for hardcoding these.
      let type = $(el).attr('type');
      if (compiledCSS[type]) $(el).attr('type', 'text/css');
    });

    $('x-require').map((i, el) => {
      let src = $(el).attr('src');

      // File URL? Bail
      if (src.match(/^file:/i)) return;

      // Absolute path? Bail.
      if (src.match(/^([\/]|[A-Za-z]:)/i)) return;

      try {
        $(el).attr('src', _path2.default.resolve(_path2.default.dirname(filePath), src));
      } catch (e) {
        $(el).text(`${e.message}\n${e.stack}`);
      }
    });

    return {
      code: $.html(),
      mimeType: 'text/html'
    };
  }

  getCompilerVersion() {
    let thisVersion = require('../../package.json').version;
    let compilers = this.allCompilers || [];
    let otherVersions = compilers.map(x => x.getCompilerVersion).join();

    return `${thisVersion},${otherVersions}`;
  }

  static fixupRelativeUrl(url) {
    if (!url.match(/^\/\//)) return url;
    return `https:${url}`;
  }
}
exports.default = InlineHtmlCompiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9odG1sL2lubGluZS1odG1sLmpzIl0sIm5hbWVzIjpbImlucHV0TWltZVR5cGVzIiwiY2hlZXJpbyIsImQiLCJyZXF1aXJlIiwiY29tcGlsZWRDU1MiLCJJbmxpbmVIdG1sQ29tcGlsZXIiLCJDb21waWxlckJhc2UiLCJjb25zdHJ1Y3RvciIsImNvbXBpbGVCbG9jayIsImNvbXBpbGVCbG9ja1N5bmMiLCJjcmVhdGVGcm9tQ29tcGlsZXJzIiwiY29tcGlsZXJzQnlNaW1lVHlwZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJPYmplY3QiLCJrZXlzIiwic291cmNlQ29kZSIsImZpbGVQYXRoIiwibWltZVR5cGUiLCJjdHgiLCJyZWFsVHlwZSIsInRhZyIsImNvbXBpbGVyIiwiZXh0IiwibWltZVR5cGVzIiwiZXh0ZW5zaW9uIiwiZmFrZUZpbGUiLCJjb3VudCIsInNob3VsZENvbXBpbGVGaWxlIiwiY29tcGlsZVN5bmMiLCJjb2RlIiwic2hvdWxkQ29tcGlsZUZpbGVTeW5jIiwiZ2V0SW5wdXRNaW1lVHlwZXMiLCJmaWxlTmFtZSIsImNvbXBpbGVyQ29udGV4dCIsImRldGVybWluZURlcGVuZGVudEZpbGVzIiwiZWFjaCIsIm5vZGVzIiwic2VsZWN0b3IiLCJhY2MiLCJpIiwiZWwiLCJwcm9taXNlIiwicHVzaCIsIlByb21pc2UiLCJhbGwiLCJlYWNoU3luYyIsImNvbXBpbGUiLCIkIiwibG9hZCIsImxvd2VyQ2FzZUF0dHJpYnV0ZU5hbWVzIiwidG9XYWl0IiwidGhhdCIsInN0eWxlQ291bnQiLCJhdHRyIiwidGhpc0N0eCIsImFzc2lnbiIsIm9yaWdUZXh0IiwidGV4dCIsIm5ld1RleHQiLCJzY3JpcHRDb3VudCIsInNyYyIsImxlbmd0aCIsImZpeHVwUmVsYXRpdmVVcmwiLCJtYXAiLCJocmVmIiwidHlwZSIsIm1hdGNoIiwicGF0aCIsInJlc29sdmUiLCJkaXJuYW1lIiwiZSIsIm1lc3NhZ2UiLCJzdGFjayIsImh0bWwiLCJkZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMiLCJvbGRUZXh0IiwiZ2V0Q29tcGlsZXJWZXJzaW9uIiwidGhpc1ZlcnNpb24iLCJ2ZXJzaW9uIiwiY29tcGlsZXJzIiwiYWxsQ29tcGlsZXJzIiwib3RoZXJWZXJzaW9ucyIsIngiLCJqb2luIiwidXJsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLE1BQU1BLGlCQUFpQixDQUFDLFdBQUQsQ0FBdkI7QUFDQSxJQUFJQyxVQUFVLElBQWQ7O0FBRUEsTUFBTUMsSUFBSUMsUUFBUSxPQUFSLEVBQWlCLDhCQUFqQixDQUFWOztBQUVBLE1BQU1DLGNBQWM7QUFDbEIsZUFBYSxJQURLO0FBRWxCLGVBQWEsSUFGSztBQUdsQixlQUFhLElBSEs7QUFJbEIsaUJBQWU7QUFKRyxDQUFwQjs7QUFPQTs7O0FBR2UsTUFBTUMsa0JBQU4sU0FBaUNDLDBCQUFqQyxDQUE4QztBQUMzREMsY0FBWUMsWUFBWixFQUEwQkMsZ0JBQTFCLEVBQTRDO0FBQzFDOztBQUVBLFNBQUtELFlBQUwsR0FBb0JBLFlBQXBCO0FBQ0EsU0FBS0MsZ0JBQUwsR0FBd0JBLGdCQUF4QjtBQUNEOztBQUVELFNBQU9DLG1CQUFQLENBQTJCQyxtQkFBM0IsRUFBZ0Q7QUFDOUNULE1BQUcscUNBQW9DVSxLQUFLQyxTQUFMLENBQWVDLE9BQU9DLElBQVAsQ0FBWUosbUJBQVosQ0FBZixDQUFpRCxFQUF4Rjs7QUFFQSxRQUFJSDtBQUFBLG1DQUFlLFdBQU9RLFVBQVAsRUFBbUJDLFFBQW5CLEVBQTZCQyxRQUE3QixFQUF1Q0MsR0FBdkMsRUFBK0M7QUFDaEUsWUFBSUMsV0FBV0YsUUFBZjtBQUNBLFlBQUksQ0FBQ0EsUUFBRCxJQUFhQyxJQUFJRSxHQUFKLEtBQVksUUFBN0IsRUFBdUNELFdBQVcsd0JBQVg7O0FBRXZDLFlBQUksQ0FBQ0EsUUFBTCxFQUFlLE9BQU9KLFVBQVA7O0FBRWYsWUFBSU0sV0FBV1gsb0JBQW9CUyxRQUFwQixLQUFpQ1Qsb0JBQW9CLFlBQXBCLENB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R0FBSSxFQUFwQjtBQUNEO0FBclEwRDtrQkFBeENoRixrQiIsImZpbGUiOiJpbmxpbmUtaHRtbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IG1pbWVUeXBlcyBmcm9tICdAcGF1bGNiZXR0cy9taW1lLXR5cGVzJztcbmltcG9ydCB7Q29tcGlsZXJCYXNlfSBmcm9tICcuLi9jb21waWxlci1iYXNlJztcblxuY29uc3QgaW5wdXRNaW1lVHlwZXMgPSBbJ3RleHQvaHRtbCddO1xubGV0IGNoZWVyaW8gPSBudWxsO1xuXG5jb25zdCBkID0gcmVxdWlyZSgnZGVidWcnKSgnZWxlY3Ryb24tY29tcGlsZTppbmxpbmUtaHRtbCcpO1xuXG5jb25zdCBjb21waWxlZENTUyA9IHtcbiAgJ3RleHQvbGVzcyc6IHRydWUsXG4gICd0ZXh0L3Njc3MnOiB0cnVlLFxuICAndGV4dC9zYXNzJzogdHJ1ZSxcbiAgJ3RleHQvc3R5bHVzJzogdHJ1ZSxcbn07XG5cbi8qKlxuICogQGFjY2VzcyBwcml2YXRlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIElubGluZUh0bWxDb21waWxlciBleHRlbmRzIENvbXBpbGVyQmFzZSB7XG4gIGNvbnN0cnVjdG9yKGNvbXBpbGVCbG9jaywgY29tcGlsZUJsb2NrU3luYykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNvbXBpbGVCbG9jayA9IGNvbXBpbGVCbG9jaztcbiAgICB0aGlzLmNvbXBpbGVCbG9ja1N5bmMgPSBjb21waWxlQmxvY2tTeW5jO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUZyb21Db21waWxlcnMoY29tcGlsZXJzQnlNaW1lVHlwZSkge1xuICAgIGQoYFNldHRpbmcgdXAgaW5saW5lIEhUTUwgY29tcGlsZXJzOiAke0pTT04uc3RyaW5naWZ5KE9iamVjdC5rZXlzKGNvbXBpbGVyc0J5TWltZVR5cGUpKX1gKTtcblxuICAgIGxldCBjb21waWxlQmxvY2sgPSBhc3luYyAoc291cmNlQ29kZSwgZmlsZVBhdGgsIG1pbWVUeXBlLCBjdHgpID0+IHtcbiAgICAgIGxldCByZWFsVHlwZSA9IG1pbWVUeXBlO1xuICAgICAgaWYgKCFtaW1lVHlwZSAmJiBjdHgudGFnID09PSAnc2NyaXB0JykgcmVhbFR5cGUgPSAnYXBwbGljYXRpb24vamF2YXNjcmlwdCc7XG5cbiAgICAgIGlmICghcmVhbFR5cGUpIHJldHVybiBzb3VyY2VDb2RlO1xuXG4gICAgICBsZXQgY29tcGlsZXIgPSBjb21waWxlcnNCeU1pbWVUeXBlW3JlYWxUeXBlXSB8fCBjb21waWxlcnNCeU1pbWVUeXBlWyd0ZXh0L3BsYWluJ107XG4gICAgICBsZXQgZXh0ID0gbWltZVR5cGVzLmV4dGVuc2lvbihyZWFsVHlwZSk7XG4gICAgICBsZXQgZmFrZUZpbGUgPSBgJHtmaWxlUGF0aH06aW5saW5lXyR7Y3R4LmNvdW50fS4ke2V4dH1gO1xuXG4gICAgICBkKGBDb21waWxpbmcgaW5saW5lIGJsb2NrIGZvciAke2ZpbGVQYXRofSB3aXRoIG1pbWVUeXBlICR7bWltZVR5cGV9YCk7XG4gICAgICBpZiAoIShhd2FpdCBjb21waWxlci5zaG91bGRDb21waWxlRmlsZShmYWtlRmlsZSwgY3R4KSkpIHJldHVybiBzb3VyY2VDb2RlO1xuICAgICAgcmV0dXJuIChhd2FpdCBjb21waWxlci5jb21waWxlU3luYyhzb3VyY2VDb2RlLCBmYWtlRmlsZSwgY3R4KSkuY29kZTtcbiAgICB9O1xuXG4gICAgbGV0IGNvbXBpbGVCbG9ja1N5bmMgPSAoc291cmNlQ29kZSwgZmlsZVBhdGgsIG1pbWVUeXBlLCBjdHgpID0+IHtcbiAgICAgIGxldCByZWFsVHlwZSA9IG1pbWVUeXBlO1xuICAgICAgaWYgKCFtaW1lVHlwZSAmJiBjdHgudGFnID09PSAnc2NyaXB0JykgcmVhbFR5cGUgPSAnYXBwbGljYXRpb24vamF2YXNjcmlwdCc7XG5cbiAgICAgIGlmICghcmVhbFR5cGUpIHJldHVybiBzb3VyY2VDb2RlO1xuXG4gICAgICBsZXQgY29tcGlsZXIgPSBjb21waWxlcnNCeU1pbWVUeXBlW3JlYWxUeXBlXSB8fCBjb21waWxlcnNCeU1pbWVUeXBlWyd0ZXh0L3BsYWluJ107XG4gICAgICBsZXQgZXh0ID0gbWltZVR5cGVzLmV4dGVuc2lvbihyZWFsVHlwZSk7XG4gICAgICBsZXQgZmFrZUZpbGUgPSBgJHtmaWxlUGF0aH06aW5saW5lXyR7Y3R4LmNvdW50fS4ke2V4dH1gO1xuXG4gICAgICBkKGBDb21waWxpbmcgaW5saW5lIGJsb2NrIGZvciAke2ZpbGVQYXRofSB3aXRoIG1pbWVUeXBlICR7bWltZVR5cGV9YCk7XG4gICAgICBpZiAoIWNvbXBpbGVyLnNob3VsZENvbXBpbGVGaWxlU3luYyhmYWtlRmlsZSwgY3R4KSkgcmV0dXJuIHNvdXJjZUNvZGU7XG4gICAgICByZXR1cm4gY29tcGlsZXIuY29tcGlsZVN5bmMoc291cmNlQ29kZSwgZmFrZUZpbGUsIGN0eCkuY29kZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIG5ldyBJbmxpbmVIdG1sQ29tcGlsZXIoY29tcGlsZUJsb2NrLCBjb21waWxlQmxvY2tTeW5jKTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRJbnB1dE1pbWVUeXBlcygpIHtcbiAgICByZXR1cm4gaW5wdXRNaW1lVHlwZXM7XG4gIH1cblxuICBhc3luYyBzaG91bGRDb21waWxlRmlsZShmaWxlTmFtZSwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBkZXRlcm1pbmVEZXBlbmRlbnRGaWxlcyhzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgYXN5bmMgZWFjaChub2Rlcywgc2VsZWN0b3IpIHtcbiAgICBsZXQgYWNjID0gW107XG4gICAgbm9kZXMuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgIGxldCBwcm9taXNlID0gc2VsZWN0b3IoaSxlbCk7XG4gICAgICBpZiAoIXByb21pc2UpIHJldHVybiBmYWxzZTtcblxuICAgICAgYWNjLnB1c2gocHJvbWlzZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuICAgIGF3YWl0IFByb21pc2UuYWxsKGFjYyk7XG4gIH1cblxuICBlYWNoU3luYyhub2Rlcywgc2VsZWN0b3IpIHtcbiAgICAvLyBOQjogVGhpcyBtZXRob2QgaXMgaGVyZSBqdXN0IHNvIGl0J3MgZWFzaWVyIHRvIG1lY2hhbmljYWxseVxuICAgIC8vIHRyYW5zbGF0ZSB0aGUgYXN5bmMgY29tcGlsZSB0byBjb21waWxlU3luY1xuICAgIHJldHVybiBub2Rlcy5lYWNoKChpLGVsKSA9PiB7XG4gICAgICBzZWxlY3RvcihpLGVsKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZShzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgY2hlZXJpbyA9IGNoZWVyaW8gfHwgcmVxdWlyZSgnY2hlZXJpbycpO1xuICAgIFxuICAgIC8vTGVhdmUgdGhlIGF0dHJpYnV0ZXMgY2FzaW5nIGFzIGl0IGlzLCBiZWNhdXNlIG9mIEFuZ3VsYXIgMiBhbmQgbWF5YmUgb3RoZXIgY2FzZS1zZW5zaXRpdmUgZnJhbWV3b3Jrc1xuICAgIGxldCAkID0gY2hlZXJpby5sb2FkKHNvdXJjZUNvZGUsIHtsb3dlckNhc2VBdHRyaWJ1dGVOYW1lczogZmFsc2V9KTtcbiAgICBsZXQgdG9XYWl0ID0gW107XG5cbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgbGV0IHN0eWxlQ291bnQgPSAwO1xuICAgIHRvV2FpdC5wdXNoKHRoaXMuZWFjaCgkKCdzdHlsZScpLCBhc3luYyAoaSwgZWwpID0+IHtcbiAgICAgIGxldCBtaW1lVHlwZSA9ICQoZWwpLmF0dHIoJ3R5cGUnKSB8fCAndGV4dC9wbGFpbic7XG5cbiAgICAgIGxldCB0aGlzQ3R4ID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIGNvdW50OiBzdHlsZUNvdW50KyssXG4gICAgICAgIHRhZzogJ3N0eWxlJ1xuICAgICAgfSwgY29tcGlsZXJDb250ZXh0KTtcblxuICAgICAgbGV0IG9yaWdUZXh0ID0gJChlbCkudGV4dCgpO1xuICAgICAgbGV0IG5ld1RleHQgPSBhd2FpdCB0aGF0LmNvbXBpbGVCbG9jayhvcmlnVGV4dCwgZmlsZVBhdGgsIG1pbWVUeXBlLCB0aGlzQ3R4KTtcblxuICAgICAgaWYgKG9yaWdUZXh0ICE9PSBuZXdUZXh0KSB7XG4gICAgICAgICQoZWwpLnRleHQobmV3VGV4dCk7XG4gICAgICAgICQoZWwpLmF0dHIoJ3R5cGUnLCAndGV4dC9jc3MnKTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICBsZXQgc2NyaXB0Q291bnQgPSAwO1xuICAgIHRvV2FpdC5wdXNoKHRoaXMuZWFjaCgkKCdzY3JpcHQnKSwgYXN5bmMgKGksIGVsKSA9PiB7XG4gICAgICBsZXQgc3JjID0gJChlbCkuYXR0cignc3JjJyk7XG4gICAgICBpZiAoc3JjICYmIHNyYy5sZW5ndGggPiAyKSB7XG4gICAgICAgICQoZWwpLmF0dHIoJ3NyYycsIElubGluZUh0bWxDb21waWxlci5maXh1cFJlbGF0aXZlVXJsKHNyYykpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGxldCB0aGlzQ3R4ID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIGNvdW50OiBzY3JpcHRDb3VudCsrLFxuICAgICAgICB0YWc6ICdzY3JpcHQnXG4gICAgICB9LCBjb21waWxlckNvbnRleHQpO1xuXG4gICAgICBsZXQgbWltZVR5cGUgPSAkKGVsKS5hdHRyKCd0eXBlJykgfHwgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnO1xuICAgICAgbGV0IG9yaWdUZXh0ID0gJChlbCkudGV4dCgpO1xuICAgICAgbGV0IG5ld1RleHQgPSBhd2FpdCB0aGF0LmNvbXBpbGVCbG9jayhvcmlnVGV4dCwgZmlsZVBhdGgsIG1pbWVUeXBlLCB0aGlzQ3R4KTtcblxuICAgICAgaWYgKG9yaWdUZXh0ICE9PSBuZXdUZXh0KSB7XG4gICAgICAgICQoZWwpLnRleHQobmV3VGV4dCk7XG4gICAgICAgICQoZWwpLmF0dHIoJ3R5cGUnLCAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcpO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgICQoJ2xpbmsnKS5tYXAoKGksIGVsKSA9PiB7XG4gICAgICBsZXQgaHJlZiA9ICQoZWwpLmF0dHIoJ2hyZWYnKTtcbiAgICAgIGlmIChocmVmICYmIGhyZWYubGVuZ3RoID4gMikgeyAkKGVsKS5hdHRyKCdocmVmJywgSW5saW5lSHRtbENvbXBpbGVyLmZpeHVwUmVsYXRpdmVVcmwoaHJlZikpOyB9XG5cbiAgICAgIC8vIE5COiBJbiByZWNlbnQgdmVyc2lvbnMgb2YgQ2hyb21pdW0sIHRoZSBsaW5rIHR5cGUgTVVTVCBiZSB0ZXh0L2NzcyBvclxuICAgICAgLy8gaXQgd2lsbCBiZSBmbGF0LW91dCBpZ25vcmVkLiBBbHNvIEkgaGF0ZSBteXNlbGYgZm9yIGhhcmRjb2RpbmcgdGhlc2UuXG4gICAgICBsZXQgdHlwZSA9ICQoZWwpLmF0dHIoJ3R5cGUnKTtcbiAgICAgIGlmIChjb21waWxlZENTU1t0eXBlXSkgJChlbCkuYXR0cigndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIH0pO1xuXG4gICAgJCgneC1yZXF1aXJlJykubWFwKChpLCBlbCkgPT4ge1xuICAgICAgbGV0IHNyYyA9ICQoZWwpLmF0dHIoJ3NyYycpO1xuXG4gICAgICAvLyBGaWxlIFVSTD8gQmFpbFxuICAgICAgaWYgKHNyYy5tYXRjaCgvXmZpbGU6L2kpKSByZXR1cm47XG5cbiAgICAgIC8vIEFic29sdXRlIHBhdGg/IEJhaWwuXG4gICAgICBpZiAoc3JjLm1hdGNoKC9eKFtcXC9dfFtBLVphLXpdOikvaSkpIHJldHVybjtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgJChlbCkuYXR0cignc3JjJywgcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShmaWxlUGF0aCksIHNyYykpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAkKGVsKS50ZXh0KGAke2UubWVzc2FnZX1cXG4ke2Uuc3RhY2t9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBhd2FpdCBQcm9taXNlLmFsbCh0b1dhaXQpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6ICQuaHRtbCgpLFxuICAgICAgbWltZVR5cGU6ICd0ZXh0L2h0bWwnXG4gICAgfTtcbiAgfVxuXG4gIHNob3VsZENvbXBpbGVGaWxlU3luYyhmaWxlTmFtZSwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBkZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbXBpbGVTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICBjaGVlcmlvID0gY2hlZXJpbyB8fCByZXF1aXJlKCdjaGVlcmlvJyk7XG4gICAgXG4gICAgLy9MZWF2ZSB0aGUgYXR0cmlidXRlcyBjYXNpbmcgYXMgaXQgaXMsIGJlY2F1c2Ugb2YgQW5ndWxhciAyIGFuZCBtYXliZSBvdGhlciBjYXNlLXNlbnNpdGl2ZSBmcmFtZXdvcmtzXG4gICAgbGV0ICQgPSBjaGVlcmlvLmxvYWQoc291cmNlQ29kZSwge2xvd2VyQ2FzZUF0dHJpYnV0ZU5hbWVzOiBmYWxzZX0pO1xuXG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIGxldCBzdHlsZUNvdW50ID0gMDtcbiAgICB0aGlzLmVhY2hTeW5jKCQoJ3N0eWxlJyksIGFzeW5jIChpLCBlbCkgPT4ge1xuICAgICAgbGV0IG1pbWVUeXBlID0gJChlbCkuYXR0cigndHlwZScpO1xuXG4gICAgICBsZXQgdGhpc0N0eCA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICBjb3VudDogc3R5bGVDb3VudCsrLFxuICAgICAgICB0YWc6ICdzdHlsZSdcbiAgICAgIH0sIGNvbXBpbGVyQ29udGV4dCk7XG5cbiAgICAgIGxldCBvcmlnVGV4dCA9ICQoZWwpLnRleHQoKTtcbiAgICAgIGxldCBuZXdUZXh0ID0gdGhhdC5jb21waWxlQmxvY2tTeW5jKG9yaWdUZXh0LCBmaWxlUGF0aCwgbWltZVR5cGUsIHRoaXNDdHgpO1xuXG4gICAgICBpZiAob3JpZ1RleHQgIT09IG5ld1RleHQpIHtcbiAgICAgICAgJChlbCkudGV4dChuZXdUZXh0KTtcbiAgICAgICAgJChlbCkuYXR0cigndHlwZScsICd0ZXh0L2NzcycpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgbGV0IHNjcmlwdENvdW50ID0gMDtcbiAgICB0aGlzLmVhY2hTeW5jKCQoJ3NjcmlwdCcpLCBhc3luYyAoaSwgZWwpID0+IHtcbiAgICAgIGxldCBzcmMgPSAkKGVsKS5hdHRyKCdzcmMnKTtcbiAgICAgIGlmIChzcmMgJiYgc3JjLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgJChlbCkuYXR0cignc3JjJywgSW5saW5lSHRtbENvbXBpbGVyLmZpeHVwUmVsYXRpdmVVcmwoc3JjKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbGV0IHRoaXNDdHggPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgY291bnQ6IHNjcmlwdENvdW50KyssXG4gICAgICAgIHRhZzogJ3NjcmlwdCdcbiAgICAgIH0sIGNvbXBpbGVyQ29udGV4dCk7XG5cbiAgICAgIGxldCBtaW1lVHlwZSA9ICQoZWwpLmF0dHIoJ3R5cGUnKTtcblxuICAgICAgbGV0IG9sZFRleHQgPSAkKGVsKS50ZXh0KCk7XG4gICAgICBsZXQgbmV3VGV4dCA9IHRoYXQuY29tcGlsZUJsb2NrU3luYyhvbGRUZXh0LCBmaWxlUGF0aCwgbWltZVR5cGUsIHRoaXNDdHgpO1xuXG4gICAgICBpZiAob2xkVGV4dCAhPT0gbmV3VGV4dCkge1xuICAgICAgICAkKGVsKS50ZXh0KG5ld1RleHQpO1xuICAgICAgICAkKGVsKS5hdHRyKCd0eXBlJywgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgICQoJ2xpbmsnKS5tYXAoKGksIGVsKSA9PiB7XG4gICAgICBsZXQgaHJlZiA9ICQoZWwpLmF0dHIoJ2hyZWYnKTtcbiAgICAgIGlmIChocmVmICYmIGhyZWYubGVuZ3RoID4gMikgeyAkKGVsKS5hdHRyKCdocmVmJywgSW5saW5lSHRtbENvbXBpbGVyLmZpeHVwUmVsYXRpdmVVcmwoaHJlZikpOyB9XG5cbiAgICAgIC8vIE5COiBJbiByZWNlbnQgdmVyc2lvbnMgb2YgQ2hyb21pdW0sIHRoZSBsaW5rIHR5cGUgTVVTVCBiZSB0ZXh0L2NzcyBvclxuICAgICAgLy8gaXQgd2lsbCBiZSBmbGF0LW91dCBpZ25vcmVkLiBBbHNvIEkgaGF0ZSBteXNlbGYgZm9yIGhhcmRjb2RpbmcgdGhlc2UuXG4gICAgICBsZXQgdHlwZSA9ICQoZWwpLmF0dHIoJ3R5cGUnKTtcbiAgICAgIGlmIChjb21waWxlZENTU1t0eXBlXSkgJChlbCkuYXR0cigndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIH0pO1xuXG4gICAgJCgneC1yZXF1aXJlJykubWFwKChpLCBlbCkgPT4ge1xuICAgICAgbGV0IHNyYyA9ICQoZWwpLmF0dHIoJ3NyYycpO1xuXG4gICAgICAvLyBGaWxlIFVSTD8gQmFpbFxuICAgICAgaWYgKHNyYy5tYXRjaCgvXmZpbGU6L2kpKSByZXR1cm47XG5cbiAgICAgIC8vIEFic29sdXRlIHBhdGg/IEJhaWwuXG4gICAgICBpZiAoc3JjLm1hdGNoKC9eKFtcXC9dfFtBLVphLXpdOikvaSkpIHJldHVybjtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgJChlbCkuYXR0cignc3JjJywgcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShmaWxlUGF0aCksIHNyYykpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAkKGVsKS50ZXh0KGAke2UubWVzc2FnZX1cXG4ke2Uuc3RhY2t9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogJC5odG1sKCksXG4gICAgICBtaW1lVHlwZTogJ3RleHQvaHRtbCdcbiAgICB9O1xuICB9XG5cbiAgZ2V0Q29tcGlsZXJWZXJzaW9uKCkge1xuICAgIGxldCB0aGlzVmVyc2lvbiA9IHJlcXVpcmUoJy4uLy4uL3BhY2thZ2UuanNvbicpLnZlcnNpb247XG4gICAgbGV0IGNvbXBpbGVycyA9IHRoaXMuYWxsQ29tcGlsZXJzIHx8IFtdO1xuICAgIGxldCBvdGhlclZlcnNpb25zID0gY29tcGlsZXJzLm1hcCgoeCkgPT4geC5nZXRDb21waWxlclZlcnNpb24pLmpvaW4oKTtcblxuICAgIHJldHVybiBgJHt0aGlzVmVyc2lvbn0sJHtvdGhlclZlcnNpb25zfWA7XG4gIH1cblxuICBzdGF0aWMgZml4dXBSZWxhdGl2ZVVybCh1cmwpIHtcbiAgICBpZiAoIXVybC5tYXRjaCgvXlxcL1xcLy8pKSByZXR1cm4gdXJsO1xuICAgIHJldHVybiBgaHR0cHM6JHt1cmx9YDtcbiAgfVxufVxuIl19