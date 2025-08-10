const esbuild = require('esbuild');
const path = require('path');

async function build() {
  try {
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: 'dist/bundle.js',
      format: 'cjs',
      // External dependencies that shouldn't be bundled
      external: [
        // Native modules that can't be bundled
        'fsevents',
        'node-gyp-build',
        '@node-rs/*',
        // Keep essentia external due to WASM
        'essentia.js',
        'audio-decode',
        'audio-loader'
      ],
      // Copy required files
      loader: {
        '.wasm': 'file',
        '.node': 'file'
      },
      minify: false,
      sourcemap: false,
      metafile: true,
      logLevel: 'info',
    });
    
    console.log('✅ Bundle created successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();