<template>
  <div class="video-block-container">
    <div class="video-block-picntext-container">
      <div class="video-block-pic">
        <v-img
          :src="thumbnailsrc"
          lazy-src="../assets/logo.svg"
          aspect-ratio="1"
          contain
          height="144"
        />
      </div>
      <div class="video-block-text">{{ name }}</div>
    </div>
    <v-container>
      <v-row dense>
        <v-col style="text-align: center;">
          <v-icon @click="playFile">mdi-play</v-icon>
        </v-col>
        <v-col style="text-align: center;">
          <v-icon @click="toggleWatched" v-if="!watched" color="red">mdi-eye-outline</v-icon>
          <v-icon @click="toggleWatched" v-else color="green">mdi-eye</v-icon>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { remote, shell } from "electron";

export default {
  name: "VideoBlock",

  props: {
    filepath: {
      type: String,
      required: true
    }
  },

  data: () => ({
    name: "",
    thumbnailsrc: "",
    watched: false
  }),

  created: function() {
    //get file name from path
    const path = remote.require("path");
    const fs = remote.require("fs");
    this.name = path.parse(this.filepath).name;

    //Generate Thumbnail
    const ffmpeg = remote.require("fluent-ffmpeg");
    const ffmpegPath = remote.require("ffmpeg-static-electron");
    const ffprobPath = remote.require("ffprobe-static-electron");
    ffmpeg.setFfmpegPath(
      ffmpegPath.path.replace("app.asar", "app.asar.unpacked")
    );
    ffmpeg.setFfprobePath(
      ffprobPath.path.replace("app.asar", "app.asar.unpacked")
    );

    ffmpeg(this.filepath)
      .screenshots({
        timestamps: ["27%"],
        filename: "%f-thumbnail.png",
        folder: path.dirname(this.filepath),
        size: "256x144"
      })
      .on("end", () => {
        //Set Thumbnail
        this.thumbnailsrc = `file://${this.filepath}-thumbnail.png`;
      });

    //Get and/or create persistent data
    fs.open(
      path.join(path.dirname(this.filepath), "mediadata.json"),
      "r",
      (err, fd) => {
        if (err) {
          if (err.code === "ENOENT") {
            //json data does not exist - create it!
            let jdata = {};
            let data = JSON.stringify(jdata);
            fs.writeFile(
              path.join(path.dirname(this.filepath), "mediadata.json"),
              data,
              err => {
                if (err) {
                  throw err;
                }
              }
            );
            return;
          } else {
            throw err;
          }
          return;
        }

        //JSON file Exists, read it!
        let rawdata = fs.readFileSync(
          path.join(path.dirname(this.filepath), "mediadata.json")
        );
        let jdata = JSON.parse(rawdata);

        if (!jdata.hasOwnProperty(path.basename(this.filepath))) {
          //No data for this file
          jdata[path.basename(this.filepath)] = false;
          let data = JSON.stringify(jdata);
          fs.writeFile(
            path.join(path.dirname(this.filepath), "mediadata.json"),
            data,
            err => {
              if (err) throw err;
            }
          );
        } else {
          this.watched = jdata[path.basename(this.filepath)];
        }
      }
    );
  },

  methods: {
    toggleWatched: function() {
      const path = remote.require("path");
      const fs = remote.require("fs");

      let rawdata = fs.readFileSync(
        path.join(path.dirname(this.filepath), "mediadata.json")
      );
      let jdata = JSON.parse(rawdata);
      if (jdata.hasOwnProperty(path.basename(this.filepath))) {
        jdata[path.basename(this.filepath)] = !jdata[
          path.basename(this.filepath)
        ];
        this.watched = jdata[path.basename(this.filepath)];
        let data = JSON.stringify(jdata);
        fs.writeFile(
          path.join(path.dirname(this.filepath), "mediadata.json"),
          data,
          err => {
            if (err) throw err;
          }
        );
      } else {
        if (!jdata.hasOwnProperty(path.basename(this.filepath))) {
          //No data for this file
          jdata[path.basename(this.filepath)] = true;
          this.watched = jdata[path.basename(this.filepath)];
          let data = JSON.stringify(jdata);
          fs.writeFile(
            path.join(path.dirname(this.filepath), "mediadata.json"),
            data,
            err => {
              if (err) throw err;
            }
          );
        } else {
          this.watched = jdata[path.basename(this.filepath)];
        }
      }
    },

    setWatched: function(vaule) {
      const path = remote.require("path");
      const fs = remote.require("fs");

      let rawdata = fs.readFileSync(
        path.join(path.dirname(this.filepath), "mediadata.json")
      );
      let jdata = JSON.parse(rawdata);
      if (jdata.hasOwnProperty(path.basename(this.filepath))) {
        jdata[path.basename(this.filepath)] = vaule;
        this.watched = jdata[path.basename(this.filepath)];
        let data = JSON.stringify(jdata);
        fs.writeFile(
          path.join(path.dirname(this.filepath), "mediadata.json"),
          data,
          err => {
            if (err) throw err;
          }
        );
      } else {
        if (!jdata.hasOwnProperty(path.basename(this.filepath))) {
          //No data for this file
          jdata[path.basename(this.filepath)] = vaule;
          this.watched = jdata[path.basename(this.filepath)];
          let data = JSON.stringify(jdata);
          fs.writeFile(
            path.join(path.dirname(this.filepath), "mediadata.json"),
            data,
            err => {
              if (err) throw err;
            }
          );
        } else {
          this.watched = vaule;
        }
      }
    },

    playFile: function() {
      this.setWatched(true);
      this.addToRecentlyWatched();
      shell.openPath(this.filepath);
    },

    addToRecentlyWatched: function() {
      const path = remote.require("path");
      this.$emit("add-to-recently-watched", {
        path: path.dirname(this.filepath),
        name: this.name
      });
    }
  }
};
</script>

<style lang="scss">
.video-block-container {
  margin: 10px;
  min-width: 256px;
  min-height: 144px;
}

.video-block-picntext-container:hover .video-block-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.video-block-picntext-container {
  position: relative;
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.video-block-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  text-align: center;
  display: none;
  background: rgba($color: #000000, $alpha: 0.66);
  text-shadow: 1px 1px black;
  overflow: hidden;
}
</style>
