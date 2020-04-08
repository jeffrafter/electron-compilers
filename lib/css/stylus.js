'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _detectiveStylus = require('detective-stylus');

var _detectiveStylus2 = _interopRequireDefault(_detectiveStylus);

var _stylusLookup = require('stylus-lookup');

var _stylusLookup2 = _interopRequireDefault(_stylusLookup);

var _compilerBase = require('../compiler-base');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const mimeTypes = ['text/stylus'];

let stylusjs = null;
let nib = null;

function each(obj, sel) {
  for (let k in obj) {
    sel(obj[k], k);
  }
}

/**
 * @access private
 */
class StylusCompiler extends _compilerBase.CompilerBase {
  constructor() {
    super();

    this.compilerOptions = {
      sourcemap: 'inline',
      import: ['nib']
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
      nib = nib || require('nib');
      stylusjs = stylusjs || require('stylus');
      _this2.seenFilePaths[_path2.default.dirname(filePath)] = true;

      let opts = _this2.makeOpts(filePath);

      let code = yield new Promise(function (res, rej) {
        let styl = stylusjs(sourceCode, opts);

        _this2.applyOpts(opts, styl);

        styl.render(function (err, css) {
          if (err) {
            rej(err);
          } else {
            res(css);
          }
        });
      });

      return {
        code, mimeType: 'text/css'
      };
    })();
  }

  makeOpts(filePath) {
    let opts = Object.assign({}, this.compilerOptions, {
      filename: (0, _path.basename)(filePath)
    });

    if (opts.import && !Array.isArray(opts.import)) {
      opts.import = [opts.import];
    }

    if (opts.import && opts.import.indexOf('nib') >= 0) {
      opts.use = opts.use || [];

      if (!Array.isArray(opts.use)) {
        opts.use = [opts.use];
      }

      opts.use.push(nib());
    }

    return opts;
  }

  applyOpts(opts, stylus) {
    each(opts, (val, key) => {
      switch (key) {
        case 'set':
        case 'define':
          each(val, (v, k) => stylus[key](k, v));
          break;
        case 'include':
        case 'import':
        case 'use':
          each(val, v => stylus[key](v));
          break;
      }
    });

    stylus.set('paths', Object.keys(this.seenFilePaths).concat(['.']));
  }

  shouldCompileFileSync(fileName, compilerContext) {
    return true;
  }

  determineDependentFilesSync(sourceCode, filePath, compilerContext) {
    let dependencyFilenames = (0, _detectiveStylus2.default)(sourceCode);
    let dependencies = [];

    for (let dependencyName of dependencyFilenames) {
      dependencies.push((0, _stylusLookup2.default)(dependencyName, _path2.default.basename(filePath), _path2.default.dirname(filePath)));
    }

    return dependencies;
  }

  compileSync(sourceCode, filePath, compilerContext) {
    nib = nib || require('nib');
    stylusjs = stylusjs || require('stylus');
    this.seenFilePaths[_path2.default.dirname(filePath)] = true;

    let opts = this.makeOpts(filePath),
        styl = stylusjs(sourceCode, opts);

    this.applyOpts(opts, styl);

    return {
      code: styl.render(),
      mimeType: 'text/css'
    };
  }

  getCompilerVersion() {
    return require('stylus/package.json').version;
  }
}
exports.default = StylusCompiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jc3Mvc3R5bHVzLmpzIl0sIm5hbWVzIjpbIm1pbWVUeXBlcyIsInN0eWx1c2pzIiwibmliIiwiZWFjaCIsIm9iaiIsInNlbCIsImsiLCJTdHlsdXNDb21waWxlciIsIkNvbXBpbGVyQmFzZSIsImNvbnN0cnVjdG9yIiwiY29tcGlsZXJPcHRpb25zIiwic291cmNlbWFwIiwiaW1wb3J0Iiwic2VlbkZpbGVQYXRocyIsImdldElucHV0TWltZVR5cGVzIiwic2hvdWxkQ29tcGlsZUZpbGUiLCJmaWxlTmFtZSIsImNvbXBpbGVyQ29udGV4dCIsImRldGVybWluZURlcGVuZGVudEZpbGVzIiwic291cmNlQ29kZSIsImZpbGVQYXRoIiwiZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXNTeW5jIiwiY29tcGlsZSIsInJlcXVpcmUiLCJwYXRoIiwiZGlybmFtZSIsIm9wdHMiLCJtYWtlT3B0cyIsImNvZGUiLCJQcm9taXNlIiwicmVzIiwicmVqIiwic3R5bCIsImFwcGx5T3B0cyIsInJlbmRlciIsImVyciIsImNzcyIsIm1pbWVUeXBlIiwiT2JqZWN0IiwiYXNzaWduIiwiZmlsZW5hbWUiLCJBcnJheSIsImlzQXJyYXkiLCJpbmRleE9mIiwidXNlIiwicHVzaCIsInN0eWx1cyIsInZhbCIsImtleSIsInYiLCJzZXQiLCJrZXlzIiwiY29uY2F0Iiwic2hvdWxkQ29tcGlsZUZpbGVTeW5jIiwiZGVwZW5kZW5jeUZpbGVuYW1lcyIsImRlcGVuZGVuY2llcyIsImRlcGVuZGVuY3lOYW1lIiwiYmFzZW5hbWUiLCJjb21waWxlU3luYyIsImdldENvbXBpbGVyVmVyc2lvbiIsInZlcnNpb24iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFHQSxNQUFNQSxZQUFZLENBQUMsYUFBRCxDQUFsQjs7QUFFQSxJQUFJQyxXQUFXLElBQWY7QUFDQSxJQUFJQyxNQUFNLElBQVY7O0FBRUEsU0FBU0MsSUFBVCxDQUFjQyxH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QXZCO0FBQ0EsU0FBS1YsYUFBTCxDQUFtQlcsZUFBS0MsT0FBTCxDQUFhTCxRQUFiLENBQW5CLElBQTZDLElBQTdDOztBQUVBLFFBQUlNLE9BQU8sS0FBS0MsUUFBTCxDQUFjUCxRQUFkLENBQVg7QUFBQSxRQUFvQ1ksT0FBTy9CLFNBQVNrQixVQUFULEVBQXFCTyxJQUFyQixDQUEzQzs7QUFFQSxTQUFLTyxTQUFMLENBQWVQLElBQWYsRUFBcUJNLElBQXJCOztBQUVBLFdBQU87QUFDTEosWUFBTUksS0FBS0UsTUFBTCxFQUREO0FBRUxHLGdCQUFVO0FBRkwsS0FBUDtBQUlEOztBQUVEc0IsdUJBQXFCO0FBQ25CLFdBQU9wQyxRQUFRLHFCQUFSLEVBQStCcUMsT0FBdEM7QUFDRDtBQTNIc0Q7a0JBQXBDckQsYyIsImZpbGUiOiJzdHlsdXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBkZXRlY3RpdmUgZnJvbSAnZGV0ZWN0aXZlLXN0eWx1cyc7XG5pbXBvcnQgbG9va3VwIGZyb20gJ3N0eWx1cy1sb29rdXAnO1xuaW1wb3J0IHtDb21waWxlckJhc2V9IGZyb20gJy4uL2NvbXBpbGVyLWJhc2UnO1xuaW1wb3J0IHtiYXNlbmFtZX0gZnJvbSAncGF0aCc7XG5cbmNvbnN0IG1pbWVUeXBlcyA9IFsndGV4dC9zdHlsdXMnXTtcblxubGV0IHN0eWx1c2pzID0gbnVsbDtcbmxldCBuaWIgPSBudWxsO1xuXG5mdW5jdGlvbiBlYWNoKG9iaiwgc2VsKSB7XG4gIGZvciAobGV0IGsgaW4gb2JqKSB7XG4gICAgc2VsKG9ialtrXSwgayk7XG4gIH1cbn1cblxuLyoqXG4gKiBAYWNjZXNzIHByaXZhdGVcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3R5bHVzQ29tcGlsZXIgZXh0ZW5kcyBDb21waWxlckJhc2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jb21waWxlck9wdGlvbnMgPSB7XG4gICAgICBzb3VyY2VtYXA6ICdpbmxpbmUnLFxuICAgICAgaW1wb3J0OiBbJ25pYiddXG4gICAgfTtcblxuICAgIHRoaXMuc2VlbkZpbGVQYXRocyA9IHt9O1xuICB9XG5cbiAgc3RhdGljIGdldElucHV0TWltZVR5cGVzKCkge1xuICAgIHJldHVybiBtaW1lVHlwZXM7XG4gIH1cblxuICBhc3luYyBzaG91bGRDb21waWxlRmlsZShmaWxlTmFtZSwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBkZXRlcm1pbmVEZXBlbmRlbnRGaWxlcyhzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIHRoaXMuZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXNTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZShzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgbmliID0gbmliIHx8IHJlcXVpcmUoJ25pYicpO1xuICAgIHN0eWx1c2pzID0gc3R5bHVzanMgfHwgcmVxdWlyZSgnc3R5bHVzJyk7XG4gICAgdGhpcy5zZWVuRmlsZVBhdGhzW3BhdGguZGlybmFtZShmaWxlUGF0aCldID0gdHJ1ZTtcblxuICAgIGxldCBvcHRzID0gdGhpcy5tYWtlT3B0cyhmaWxlUGF0aCk7XG5cbiAgICBsZXQgY29kZSA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXMscmVqKSA9PiB7XG4gICAgICBsZXQgc3R5bCA9IHN0eWx1c2pzKHNvdXJjZUNvZGUsIG9wdHMpO1xuXG4gICAgICB0aGlzLmFwcGx5T3B0cyhvcHRzLCBzdHlsKTtcblxuICAgICAgc3R5bC5yZW5kZXIoKGVyciwgY3NzKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXMoY3NzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29kZSwgbWltZVR5cGU6ICd0ZXh0L2NzcydcbiAgICB9O1xuICB9XG5cbiAgbWFrZU9wdHMoZmlsZVBhdGgpIHtcbiAgICBsZXQgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuY29tcGlsZXJPcHRpb25zLCB7XG4gICAgICBmaWxlbmFtZTogYmFzZW5hbWUoZmlsZVBhdGgpXG4gICAgfSk7XG5cbiAgICBpZiAob3B0cy5pbXBvcnQgJiYgIUFycmF5LmlzQXJyYXkob3B0cy5pbXBvcnQpKSB7XG4gICAgICBvcHRzLmltcG9ydCA9IFtvcHRzLmltcG9ydF07XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuaW1wb3J0ICYmIG9wdHMuaW1wb3J0LmluZGV4T2YoJ25pYicpID49IDApIHtcbiAgICAgIG9wdHMudXNlID0gb3B0cy51c2UgfHwgW107XG5cbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShvcHRzLnVzZSkpIHtcbiAgICAgICAgb3B0cy51c2UgPSBbb3B0cy51c2VdO1xuICAgICAgfVxuXG4gICAgICBvcHRzLnVzZS5wdXNoKG5pYigpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0cztcbiAgfVxuICBcbiAgXG4gIGFwcGx5T3B0cyhvcHRzLCBzdHlsdXMpIHtcbiAgICBlYWNoKG9wdHMsICh2YWwsIGtleSkgPT4ge1xuICAgICAgc3dpdGNoKGtleSkge1xuICAgICAgY2FzZSAnc2V0JzpcbiAgICAgIGNhc2UgJ2RlZmluZSc6XG4gICAgICAgIGVhY2godmFsLCAodiwgaykgPT4gc3R5bHVzW2tleV0oaywgdikpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2luY2x1ZGUnOlxuICAgICAgY2FzZSAnaW1wb3J0JzpcbiAgICAgIGNhc2UgJ3VzZSc6XG4gICAgICAgIGVhY2godmFsLCAodikgPT4gc3R5bHVzW2tleV0odikpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHN0eWx1cy5zZXQoJ3BhdGhzJywgT2JqZWN0LmtleXModGhpcy5zZWVuRmlsZVBhdGhzKS5jb25jYXQoWycuJ10pKTtcbiAgfVxuXG4gIHNob3VsZENvbXBpbGVGaWxlU3luYyhmaWxlTmFtZSwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBkZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIGxldCBkZXBlbmRlbmN5RmlsZW5hbWVzID0gZGV0ZWN0aXZlKHNvdXJjZUNvZGUpO1xuICAgIGxldCBkZXBlbmRlbmNpZXMgPSBbXTtcblxuICAgIGZvciAobGV0IGRlcGVuZGVuY3lOYW1lIG9mIGRlcGVuZGVuY3lGaWxlbmFtZXMpIHtcbiAgICAgIGRlcGVuZGVuY2llcy5wdXNoKGxvb2t1cChkZXBlbmRlbmN5TmFtZSwgcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksIHBhdGguZGlybmFtZShmaWxlUGF0aCkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICB9XG5cbiAgY29tcGlsZVN5bmMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIG5pYiA9IG5pYiB8fCByZXF1aXJlKCduaWInKTtcbiAgICBzdHlsdXNqcyA9IHN0eWx1c2pzIHx8IHJlcXVpcmUoJ3N0eWx1cycpO1xuICAgIHRoaXMuc2VlbkZpbGVQYXRoc1twYXRoLmRpcm5hbWUoZmlsZVBhdGgpXSA9IHRydWU7XG5cbiAgICBsZXQgb3B0cyA9IHRoaXMubWFrZU9wdHMoZmlsZVBhdGgpLCBzdHlsID0gc3R5bHVzanMoc291cmNlQ29kZSwgb3B0cyk7XG5cbiAgICB0aGlzLmFwcGx5T3B0cyhvcHRzLCBzdHlsKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBzdHlsLnJlbmRlcigpLFxuICAgICAgbWltZVR5cGU6ICd0ZXh0L2NzcydcbiAgICB9O1xuICB9XG5cbiAgZ2V0Q29tcGlsZXJWZXJzaW9uKCkge1xuICAgIHJldHVybiByZXF1aXJlKCdzdHlsdXMvcGFja2FnZS5qc29uJykudmVyc2lvbjtcbiAgfVxufVxuIl19