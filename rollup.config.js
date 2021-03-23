import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import eslint from '@rollup/plugin-eslint';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'build',
    format: 'es',
  },
  plugins: [eslint(), resolve(), typescript(), commonjs()],
};
