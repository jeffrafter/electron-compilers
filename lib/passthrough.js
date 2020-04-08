'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _compilerBase = require('./compiler-base');

var _mimeTypes = require('@paulcbetts/mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const inputMimeTypes = ['text/plain', 'image/svg+xml'];

/**
 * @access private
 * 
 * This class is used for binary files and other files that should end up in 
 * your cache directory, but aren't actually compiled
 */
class PassthroughCompiler extends _compilerBase.SimpleCompilerBase {
  constructor() {
    super();
  }

  static getInputMimeTypes() {
    return inputMimeTypes;
  }

  compileSync(sourceCode, filePath) {
    return {
      code: sourceCode,
      mimeType: _mimeTypes2.default.lookup(filePath)
    };
  }

  getCompilerVersion() {
    return require(_path2.default.join(__dirname, '..', 'package.json')).version;
  }
}
exports.default = PassthroughCompiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wYXNzdGhyb3VnaC5qcyJdLCJuYW1lcyI6WyJpbnB1dE1pbWVUeXBlcyIsIlBhc3N0aHJvdWdoQ29tcGlsZXIiLCJTaW1wbGVDb21waWxlckJhc2UiLCJjb25zdHJ1Y3RvciIsImdldElucHV0TWltZVR5cGVzIiwiY29tcGlsZVN5bmMiLCJzb3VyY2VDb2RlIiwiZmlsZVBhdGgiLCJjb2RlIiwibWltZVR5cGUiLCJtaW1lVHlwZXMiLCJsb29rdXAiLCJnZXRDb21waWxlclZlcnNpb24iLCJyZXF1aXJlIiwicGF0aCIsImpvaW4iLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOzs7Ozs7QUFFQSxNQUFNQSxpQkFBaUIsQ0FBQyxZQUFELEVBQWUsZUFBZixDQUF2Qjs7QUFHQTs7Ozs7O0FBTWUsTUFBTUMsbUJBQU4sU0FBa0NDLGdDQUFsQyxDQUFxRDtBQUNsRUMsZ0JBQWM7QUFDWjtBQUNEOztBQUVELFNBQU9DLGlCQUFQLEdBQTJCO0FBQ3pCLFdBQU9KLGNBQVA7QUFDRDs7QUFFREssY0FBWUMsVUFBWixFQUF3QkMsUUFBeEIsRUFBa0M7QUFDaEMsV0FBTztBQUNMQyxZQUFNRixVQUREO0FBRUxHLGdCQUFVQyxvQkFBVUMsTUFBVixDQUFpQkosUUFBakI7QUFGTCxLQUFQO0FBSUQ7O0FBRURLLHVCQUFxQjtBQUNuQixXQUFPQyxRQUFRQyxlQUFLQyxJQUFMLENBQVVDLFNBQVYsRUFBcUIsSUFBckIsRUFBMkIsY0FBM0IsQ0FBUixFQUFvREMsT0FBM0Q7QUFDRDtBQWxCaUU7a0JBQS9DaEIsbUIiLCJmaWxlIjoicGFzc3Rocm91Z2guanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7U2ltcGxlQ29tcGlsZXJCYXNlfSBmcm9tICcuL2NvbXBpbGVyLWJhc2UnO1xuaW1wb3J0IG1pbWVUeXBlcyBmcm9tICdAcGF1bGNiZXR0cy9taW1lLXR5cGVzJztcblxuY29uc3QgaW5wdXRNaW1lVHlwZXMgPSBbJ3RleHQvcGxhaW4nLCAnaW1hZ2Uvc3ZnK3htbCddO1xuXG5cbi8qKlxuICogQGFjY2VzcyBwcml2YXRlXG4gKiBcbiAqIFRoaXMgY2xhc3MgaXMgdXNlZCBmb3IgYmluYXJ5IGZpbGVzIGFuZCBvdGhlciBmaWxlcyB0aGF0IHNob3VsZCBlbmQgdXAgaW4gXG4gKiB5b3VyIGNhY2hlIGRpcmVjdG9yeSwgYnV0IGFyZW4ndCBhY3R1YWxseSBjb21waWxlZFxuICovIFxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGFzc3Rocm91Z2hDb21waWxlciBleHRlbmRzIFNpbXBsZUNvbXBpbGVyQmFzZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBzdGF0aWMgZ2V0SW5wdXRNaW1lVHlwZXMoKSB7XG4gICAgcmV0dXJuIGlucHV0TWltZVR5cGVzO1xuICB9XG5cbiAgY29tcGlsZVN5bmMoc291cmNlQ29kZSwgZmlsZVBhdGgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogc291cmNlQ29kZSxcbiAgICAgIG1pbWVUeXBlOiBtaW1lVHlwZXMubG9va3VwKGZpbGVQYXRoKVxuICAgIH07XG4gIH1cbiAgXG4gIGdldENvbXBpbGVyVmVyc2lvbigpIHtcbiAgICByZXR1cm4gcmVxdWlyZShwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAncGFja2FnZS5qc29uJykpLnZlcnNpb247XG4gIH1cbn1cbiJdfQ==