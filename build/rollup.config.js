import babel from 'rollup-plugin-babel'

export default {
  entry: 'src/index.js',
  dest: 'dist/objValidation.js',
  format: 'umd',
  moduleName: 'ObjValidation',
  plugins: [ babel() ]
}
