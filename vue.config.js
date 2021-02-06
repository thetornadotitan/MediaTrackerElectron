module.exports = {
  transpileDependencies: ["vuetify"],
  configureWebpack: {
    externals: {
      "fluent-ffmpeg": "require('fluent-ffmpeg')",
      "ffmpeg-static-electron": "require('ffmpeg-static-electron')",
      "ffprobe-static-electron": "require('ffprobe-static-electron')",
    },
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      externals: [
        "fluent-ffmpeg",
        "ffmpeg-static-electron",
        "ffprobe-static-electron",
      ],
    },
  },
};
