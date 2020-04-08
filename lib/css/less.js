'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _detectiveLess = require('detective-less');

var _detectiveLess2 = _interopRequireDefault(_detectiveLess);

var _compilerBase = require('../compiler-base');

var _toutsuite = require('toutsuite');

var _toutsuite2 = _interopRequireDefault(_toutsuite);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const mimeTypes = ['text/less'];
let lessjs = null;

/**
 * @access private
 */
class LessCompiler extends _compilerBase.CompilerBase {
  constructor() {
    super();

    this.compilerOptions = {
      sourceMap: { sourceMapFileInline: true }
    };

    this.seenFilePaths = {};
  }

  static getInputMimeTypes() {
    return mimeTypes;
  }

  shouldCompileFile(fileName, compilerContext) {
    return _asyncToGenerator(function* () {
      return true;
    })();
  }

  determineDependentFiles(sourceCode, filePath, compilerContext) {
    var _this = this;

    return _asyncToGenerator(function* () {
      return _this.determineDependentFilesSync(sourceCode, filePath, compilerContext);
    })();
  }

  compile(sourceCode, filePath, compilerContext) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      lessjs = lessjs || _this2.getLess();

      let thisPath = _path2.default.dirname(filePath);
      _this2.seenFilePaths[thisPath] = true;

      let paths = Object.keys(_this2.seenFilePaths);

      if (_this2.compilerOptions.paths) {
        paths.push(..._this2.compilerOptions.paths);
      }

      let opts = Object.assign({}, _this2.compilerOptions, {
        paths: paths,
        filename: _path2.default.basename(filePath)
      });

      let result = yield lessjs.render(sourceCode, opts);
      let source = result.css;

      // NB: If you compile a file that is solely imports, its
      // actual content is '' yet it is a valid file. '' is not
      // truthy, so we're going to replace it with a string that
      // is truthy.
      if (!source && typeof source === 'string') {
        source = ' ';
      }

      return {
        code: source,
        mimeType: 'text/css'
      };
    })();
  }

  shouldCompileFileSync(fileName, compilerContext) {
    return true;
  }

  determineDependentFilesSync(sourceCode, filePath, compilerContext) {
    let dependencyFilenames = (0, _detectiveLess2.default)(sourceCode);
    let dependencies = [];

    for (let dependencyName of dependencyFilenames) {
      dependencies.push(_path2.default.join(_path2.default.dirname(filePath), dependencyName));
    }

    return dependencies;
  }

  compileSync(sourceCode, filePath, compilerContext) {
    lessjs = lessjs || this.getLess();

    let source;
    let error = null;

    let thisPath = _path2.default.dirname(filePath);
    this.seenFilePaths[thisPath] = true;

    let paths = Object.keys(this.seenFilePaths);

    if (this.compilerOptions.paths) {
      paths.push(...this.compilerOptions.paths);
    }

    let opts = Object.assign({}, this.compilerOptions, {
      paths: paths,
      filename: _path2.default.basename(filePath),
      fileAsync: false, async: false, syncImport: true
    });

    (0, _toutsuite2.default)(() => {
      lessjs.render(sourceCode, opts, (err, out) => {
        if (err) {
          error = err;
        } else {
          // NB: Because we've forced less to work in sync mode, we can do this
          source = out.css;
        }
      });
    });

    if (error) {
      throw error;
    }

    // NB: If you compile a file that is solely imports, its
    // actual content is '' yet it is a valid file. '' is not
    // truthy, so we're going to replace it with a string that
    // is truthy.
    if (!source && typeof source === 'string') {
      source = ' ';
    }

    return {
      code: source,
      mimeType: 'text/css'
    };
  }

  getLess() {
    let ret;
    (0, _toutsuite2.default)(() => ret = require('less'));
    return ret;
  }

  getCompilerVersion() {
    return require('less/package.json').version;
  }
}
exports.default = LessCompiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jc3MvbGVzcy5qcyJdLCJuYW1lcyI6WyJtaW1lVHlwZXMiLCJsZXNzanMiLCJMZXNzQ29tcGlsZXIiLCJDb21waWxlckJhc2UiLCJjb25zdHJ1Y3RvciIsImNvbXBpbGVyT3B0aW9ucyIsInNvdXJjZU1hcCIsInNvdXJjZU1hcEZpbGVJbmxpbmUiLCJzZWVuRmlsZVBhdGhzIiwiZ2V0SW5wdXRNaW1lVHlwZXMiLCJzaG91bGRDb21waWxlRmlsZSIsImZpbGVOYW1lIiwiY29tcGlsZXJDb250ZXh0IiwiZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXMiLCJzb3VyY2VDb2RlIiwiZmlsZVBhdGgiLCJkZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMiLCJjb21waWxlIiwiZ2V0TGVzcyIsInRoaXNQYXRoIiwicGF0aCIsImRpcm5hbWUiLCJwYXRocyIsIk9iamVjdCIsImtleXMiLCJwdXNoIiwib3B0cyIsImFzc2lnbiIsImZpbGVuYW1lIiwiYmFzZW5hbWUiLCJyZXN1bHQiLCJyZW5kZXIiLCJzb3VyY2UiLCJjc3MiLCJjb2RlIiwibWltZVR5cGUiLCJzaG91bGRDb21waWxlRmlsZVN5bmMiLCJkZXBlbmRlbmN5RmlsZW5hbWVzIiwiZGVwZW5kZW5jaWVzIiwiZGVwZW5kZW5jeU5hbWUiLCJqb2luIiwiY29tcGlsZVN5bmMiLCJlcnJvciIsImZpbGVBc3luYyIsImFzeW5jIiwic3luY0ltcG9ydCIsImVyciIsIm91dCIsInJldCIsInJlcXVpcmUiLCJnZXRDb21waWxlclZlcnNpb24iLCJ2ZXJzaW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBRUEsTUFBTUEsWUFBWSxDQUFDLFdBQUQsQ0FBbEI7QUFDQSxJQUFJQyxTQUFTLElBQWI7O0FBRUE7OztBQUdlLE1BQU1DLFlBQU4sU0FBMkJDLDBCQUEzQixDQUF3QztBQUNyREMsZ0JBQWM7QUFDWjs7QUFFQSxTQUFLQyxlQUFMLEdBQXVCO0FB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QUFPSCxPQUFPSSxNQUFQLENBQWMsRUFBZCxFQUFrQixLQUFLdEIsZUFBdkIsRUFBd0M7QUFDakRpQixhQUFPQSxLQUQwQztBQUVqRE0sZ0JBQVVSLGVBQUtTLFFBQUwsQ0FBY2QsUUFBZCxDQUZ1QztBQUdqRDRCLGlCQUFXLEtBSHNDLEVBRy9CQyxPQUFPLEtBSHdCLEVBR2pCQyxZQUFZO0FBSEssS0FBeEMsQ0FBWDs7QUFNQSw2QkFBVSxNQUFNO0FBQ2Q1QyxhQUFPOEIsTUFBUCxDQUFjakIsVUFBZCxFQUEwQlksSUFBMUIsRUFBZ0MsQ0FBQ29CLEdBQUQsRUFBTUMsR0FBTixLQUFjO0FBQzVDLFlBQUlELEdBQUosRUFBUztBQUNQSixrQkFBUUksR0FBUjtBQUNELFNBRkQsTUFFTztBQUNMO0FBQ0FkLG1CQUFTZSxJQUFJZCxHQUFiO0FBQ0Q7QUFDRixPQVBEO0FBUUQsS0FURDs7QUFXQSxRQUFJUyxLQUFKLEVBQVc7QUFDVCxZQUFNQSxLQUFOO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFJLENBQUNWLE1BQUQsSUFBVyxPQUFPQSxNQUFQLEtBQWtCLFFBQWpDLEVBQTJDO0FBQ3pDQSxlQUFTLEdBQVQ7QUFDRDs7QUFFRCxXQUFPO0FBQ0xFLFlBQU1GLE1BREQ7QUFFTEcsZ0JBQVU7QUFGTCxLQUFQO0FBSUQ7O0FBRURqQixZQUFVO0FBQ1IsUUFBSThCLEdBQUo7QUFDQSw2QkFBVSxNQUFNQSxNQUFNQyxRQUFRLE1BQVIsQ0FBdEI7QUFDQSxXQUFPRCxHQUFQO0FBQ0Q7O0FBRURFLHVCQUFxQjtBQUNuQixXQUFPRCxRQUFRLG1CQUFSLEVBQTZCRSxPQUFwQztBQUNEO0FBbElvRDtrQkFBbENqRCxZIiwiZmlsZSI6Imxlc3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBkZXRlY3RpdmUgZnJvbSAnZGV0ZWN0aXZlLWxlc3MnO1xuaW1wb3J0IHtDb21waWxlckJhc2V9IGZyb20gJy4uL2NvbXBpbGVyLWJhc2UnO1xuaW1wb3J0IHRvdXRTdWl0ZSBmcm9tICd0b3V0c3VpdGUnO1xuXG5jb25zdCBtaW1lVHlwZXMgPSBbJ3RleHQvbGVzcyddO1xubGV0IGxlc3NqcyA9IG51bGw7XG5cbi8qKlxuICogQGFjY2VzcyBwcml2YXRlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExlc3NDb21waWxlciBleHRlbmRzIENvbXBpbGVyQmFzZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNvbXBpbGVyT3B0aW9ucyA9IHtcbiAgICAgIHNvdXJjZU1hcDogeyBzb3VyY2VNYXBGaWxlSW5saW5lOiB0cnVlIH1cbiAgICB9O1xuXG4gICAgdGhpcy5zZWVuRmlsZVBhdGhzID0ge307XG4gIH1cblxuICBzdGF0aWMgZ2V0SW5wdXRNaW1lVHlwZXMoKSB7XG4gICAgcmV0dXJuIG1pbWVUeXBlcztcbiAgfVxuXG4gIGFzeW5jIHNob3VsZENvbXBpbGVGaWxlKGZpbGVOYW1lLCBjb21waWxlckNvbnRleHQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGRldGVybWluZURlcGVuZGVudEZpbGVzKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICByZXR1cm4gdGhpcy5kZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCk7XG4gIH1cblxuICBhc3luYyBjb21waWxlKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICBsZXNzanMgPSBsZXNzanMgfHwgdGhpcy5nZXRMZXNzKCk7XG5cbiAgICBsZXQgdGhpc1BhdGggPSBwYXRoLmRpcm5hbWUoZmlsZVBhdGgpO1xuICAgIHRoaXMuc2VlbkZpbGVQYXRoc1t0aGlzUGF0aF0gPSB0cnVlO1xuXG4gICAgbGV0IHBhdGhzID0gT2JqZWN0LmtleXModGhpcy5zZWVuRmlsZVBhdGhzKTtcblxuICAgIGlmICh0aGlzLmNvbXBpbGVyT3B0aW9ucy5wYXRocykge1xuICAgICAgcGF0aHMucHVzaCguLi50aGlzLmNvbXBpbGVyT3B0aW9ucy5wYXRocyk7XG4gICAgfVxuXG4gICAgbGV0IG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmNvbXBpbGVyT3B0aW9ucywge1xuICAgICAgcGF0aHM6IHBhdGhzLFxuICAgICAgZmlsZW5hbWU6IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpXG4gICAgfSk7XG5cbiAgICBsZXQgcmVzdWx0ID0gYXdhaXQgbGVzc2pzLnJlbmRlcihzb3VyY2VDb2RlLCBvcHRzKTtcbiAgICBsZXQgc291cmNlID0gcmVzdWx0LmNzcztcblxuICAgIC8vIE5COiBJZiB5b3UgY29tcGlsZSBhIGZpbGUgdGhhdCBpcyBzb2xlbHkgaW1wb3J0cywgaXRzXG4gICAgLy8gYWN0dWFsIGNvbnRlbnQgaXMgJycgeWV0IGl0IGlzIGEgdmFsaWQgZmlsZS4gJycgaXMgbm90XG4gICAgLy8gdHJ1dGh5LCBzbyB3ZSdyZSBnb2luZyB0byByZXBsYWNlIGl0IHdpdGggYSBzdHJpbmcgdGhhdFxuICAgIC8vIGlzIHRydXRoeS5cbiAgICBpZiAoIXNvdXJjZSAmJiB0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJykge1xuICAgICAgc291cmNlID0gJyAnO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBzb3VyY2UsXG4gICAgICBtaW1lVHlwZTogJ3RleHQvY3NzJ1xuICAgIH07XG4gIH1cblxuICBzaG91bGRDb21waWxlRmlsZVN5bmMoZmlsZU5hbWUsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXNTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICBsZXQgZGVwZW5kZW5jeUZpbGVuYW1lcyA9IGRldGVjdGl2ZShzb3VyY2VDb2RlKTtcbiAgICBsZXQgZGVwZW5kZW5jaWVzID0gW107XG5cbiAgICBmb3IgKGxldCBkZXBlbmRlbmN5TmFtZSBvZiBkZXBlbmRlbmN5RmlsZW5hbWVzKSB7XG4gICAgICBkZXBlbmRlbmNpZXMucHVzaChwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSwgZGVwZW5kZW5jeU5hbWUpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICB9XG5cbiAgY29tcGlsZVN5bmMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIGxlc3NqcyA9IGxlc3NqcyB8fCB0aGlzLmdldExlc3MoKTtcblxuICAgIGxldCBzb3VyY2U7XG4gICAgbGV0IGVycm9yID0gbnVsbDtcblxuICAgIGxldCB0aGlzUGF0aCA9IHBhdGguZGlybmFtZShmaWxlUGF0aCk7XG4gICAgdGhpcy5zZWVuRmlsZVBhdGhzW3RoaXNQYXRoXSA9IHRydWU7XG5cbiAgICBsZXQgcGF0aHMgPSBPYmplY3Qua2V5cyh0aGlzLnNlZW5GaWxlUGF0aHMpO1xuXG4gICAgaWYgKHRoaXMuY29tcGlsZXJPcHRpb25zLnBhdGhzKSB7XG4gICAgICBwYXRocy5wdXNoKC4uLnRoaXMuY29tcGlsZXJPcHRpb25zLnBhdGhzKTtcbiAgICB9XG5cbiAgICBsZXQgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuY29tcGlsZXJPcHRpb25zLCB7XG4gICAgICBwYXRoczogcGF0aHMsXG4gICAgICBmaWxlbmFtZTogcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksXG4gICAgICBmaWxlQXN5bmM6IGZhbHNlLCBhc3luYzogZmFsc2UsIHN5bmNJbXBvcnQ6IHRydWVcbiAgICB9KTtcblxuICAgIHRvdXRTdWl0ZSgoKSA9PiB7XG4gICAgICBsZXNzanMucmVuZGVyKHNvdXJjZUNvZGUsIG9wdHMsIChlcnIsIG91dCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgZXJyb3IgPSBlcnI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTkI6IEJlY2F1c2Ugd2UndmUgZm9yY2VkIGxlc3MgdG8gd29yayBpbiBzeW5jIG1vZGUsIHdlIGNhbiBkbyB0aGlzXG4gICAgICAgICAgc291cmNlID0gb3V0LmNzcztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIC8vIE5COiBJZiB5b3UgY29tcGlsZSBhIGZpbGUgdGhhdCBpcyBzb2xlbHkgaW1wb3J0cywgaXRzXG4gICAgLy8gYWN0dWFsIGNvbnRlbnQgaXMgJycgeWV0IGl0IGlzIGEgdmFsaWQgZmlsZS4gJycgaXMgbm90XG4gICAgLy8gdHJ1dGh5LCBzbyB3ZSdyZSBnb2luZyB0byByZXBsYWNlIGl0IHdpdGggYSBzdHJpbmcgdGhhdFxuICAgIC8vIGlzIHRydXRoeS5cbiAgICBpZiAoIXNvdXJjZSAmJiB0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJykge1xuICAgICAgc291cmNlID0gJyAnO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBzb3VyY2UsXG4gICAgICBtaW1lVHlwZTogJ3RleHQvY3NzJ1xuICAgIH07XG4gIH1cblxuICBnZXRMZXNzKCkge1xuICAgIGxldCByZXQ7XG4gICAgdG91dFN1aXRlKCgpID0+IHJldCA9IHJlcXVpcmUoJ2xlc3MnKSk7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIGdldENvbXBpbGVyVmVyc2lvbigpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnbGVzcy9wYWNrYWdlLmpzb24nKS52ZXJzaW9uO1xuICB9XG59XG4iXX0=