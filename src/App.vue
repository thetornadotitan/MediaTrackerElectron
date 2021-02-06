<template>
  <v-app>
    <v-main>
      <!-- Provides the application the proper gutter -->
      <v-navigation-drawer disable-resize-watcher app permanent>
        <v-expansion-panels
          class="ma-0 pa-0"
          accordion
          multiple
          :value="[0, 1, 2]"
        >
          <v-expansion-panel>
            <v-expansion-panel-header
              >Folder Navigator</v-expansion-panel-header
            >
            <v-expansion-panel-content>
              <v-btn
                block
                v-for="item in currentTreeList"
                :key="item.name"
                v-on:click="generateFolderList(item)"
              >
                <div>{{ item.name }}</div>
              </v-btn>
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-header
              >Recently Watched</v-expansion-panel-header
            >
            <v-expansion-panel-content
              ><v-btn
                block
                v-for="item in currentRecentlyWatchedList"
                :key="item.name"
                v-on:click="generateFolderList(item)"
              >
                <div>{{ item.name }}</div>
              </v-btn></v-expansion-panel-content
            >
          </v-expansion-panel>
        </v-expansion-panels>
      </v-navigation-drawer>
      <v-container fluid>
        <v-row dense align="center" justify="center">
          <v-col>
            <v-breadcrumbs :items="breadcrumbs" large>
              <template v-slot:item="{ item }">
                <v-breadcrumbs-item
                  v-on:click="generateFolderList({ path: item.path })"
                  >{{ item.text.toUpperCase() }}</v-breadcrumbs-item
                >
              </template>
            </v-breadcrumbs>
          </v-col>
          <!-- <v-col cols="auto">
            <v-btn>
              <v-icon>mdi-folder-search</v-icon>
            </v-btn>
          </v-col>-->
        </v-row>
        <v-row dense>
          <v-col>
            <div class="video-blocks-container">
              <VideoBlock
                v-for="item in currentFileList"
                :key="item"
                :filepath="item"
                v-on:add-to-recently-watched="addToRecentlyWatch($event)"
              />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
//import HelloWorld from './components/HelloWorld';
import { remote } from "electron";
import VideoBlock from "./components/VideoBlock";

export default {
  name: "App",

  components: {
    //HelloWorld,
    VideoBlock,
  },

  data: () => ({
    favs: [],
    recents: [],
    currentTreeList: [],
    currentFileList: [],
    currentRecentlyWatchedList: [],
    breadcrumbs: [],
    supportedFileTypes: [
      ".flv",
      ".f4v",
      ".f4p",
      ".f4a",
      ".f4b",
      ".nsv",
      ".roq",
      ".mxf",
      ".3g2",
      ".3gp",
      ".svi",
      ".m4v",
      ".mpg",
      ".mpeg",
      ".m2v",
      ".mpg",
      ".mp2",
      ".mpeg",
      ".mpe",
      ".mpv",
      ".mp4",
      ".m4p",
      ".m4v",
      ".amv",
      ".asf",
      ".rmvb",
      ".rm",
      ".yuv",
      ".wmv",
      ".mov",
      ".qt",
      ".MTS",
      ".M2TS",
      ".TS",
      ".avi",
      ".mng",
      ".gifv",
      ".gif",
      ".drc",
      ".ogv",
      ".ogg",
      ".vob",
      ".flv",
      ".mkv",
      ".webm",
      ".bik",
    ],
  }),

  mounted: async function() {
    this.generateDriveList();
    this.loadRecentlyWatched();
  },

  methods: {
    generateDriveList: async function() {
      let result = [];
      let drivelist = remote.require("drivelist");
      this.breadcrumbs = [];
      const drives = await drivelist.list();
      drives.forEach((drive) => {
        drive.mountpoints.forEach((point) => {
          result.push({
            name: point.path,
            path: point.path,
          });
        });
      });
      this.currentTreeList = result;
    },

    generateFolderList: async function(passedItem) {
      const path = remote.require("path");
      const fs = remote.require("fs");

      this.currentFileList = [];

      let passedPath = passedItem.path;
      let result = [];
      let breadResult = [];

      if (passedItem.isDrive) {
        passedItem.isDrive();
        return;
      }

      /*check if one directory up pints to the same place, if it does this mean we are as high in one drive as we can go.
      Therefore, the button should take us back to the drivelist.*/
      if (
        path.resolve(passedPath) == path.resolve(path.join(passedPath, ".."))
      ) {
        result.push({
          name: "Back to Drives",
          path: path.join(passedPath, ".."),
          isDrive: this.generateDriveList,
        });
      } else {
        result.push({
          name: "..",
          path: path.join(passedPath, ".."),
        });
      }

      let nextPath = passedPath;

      while (nextPath.length > 0) {
        if (nextPath == path.join(nextPath, "..")) {
          breadResult.unshift({
            text: nextPath,
            path: nextPath,
          });
          nextPath = "";
          continue;
        }

        breadResult.unshift({
          text: nextPath.split(path.sep).pop(),
          path: nextPath,
        });
        nextPath = path.join(nextPath, "..");
      }

      this.breadcrumbs = breadResult;

      await fs.readdir(passedPath, (err, files) => {
        if (err) {
          console.error("READDIR DID BAD");
          console.error(err);
        }

        //files.forEach(async (file) => {
        for (let file of files) {
          try {
            let itemPath = path.join(passedPath, file);
            let fileStats = fs.statSync(itemPath);
            if (fileStats.isDirectory()) {
              result.push({
                name: file,
                path: itemPath,
              });
            } else {
              //Is a file
              if (fileStats.isFile()) {
                //check if is video
                if (this.supportedFileTypes.includes(path.extname(file))) {
                  //add to fileList
                  this.currentFileList.push(path.join(passedPath, file));
                }
              }
            }
          } catch (e) {
            if (e.message.includes("EBUSY")) {
              //Handle Gracefully
            } else if (e.message.includes("EPERM")) {
              //Handle Gracefully
            } else {
              console.error(e);
            }
          }
        }
      });

      this.currentTreeList = result;
    },

    logItem: function(item) {
      console.log(item);
    },

    loadRecentlyWatched() {
      const path = remote.require("path");
      const fs = remote.require("fs");
      const appPath = path.dirname(remote.app.getPath("exe"));

      fs.open(path.join(appPath, "appData.json"), "r", (err, fd) => {
        if (err) {
          if (err.code === "ENOENT") {
            //json data does not exist - create it!
            let data = JSON.stringify(this.currentRecentlyWatchedList);
            fs.writeFile(path.join(appPath, "appData.json"), data, (err) => {
              if (err) {
                throw err;
              }
            });
            return;
          } else {
            throw err;
          }
          return;
        }

        //JSON file Exists, read it!
        let rawdata = fs.readFileSync(path.join(appPath, "appData.json"));
        let jdata = JSON.parse(rawdata);
        //-----
        jdata = jdata.filter((item) => {
          if (fs.existsSync(item.path)) {
            return true;
          }
          return false;
        });
        //-----
        this.currentRecentlyWatchedList = jdata;
        let data = JSON.stringify(this.currentRecentlyWatchedList);
        fs.writeFile(path.join(appPath, "appData.json"), data, (err) => {
          if (err) {
            throw err;
          }
        });
      });
    },

    addToRecentlyWatch(v) {
      const path = remote.require("path");
      const fs = remote.require("fs");
      const appPath = path.dirname(remote.app.getPath("exe"));

      let found = false;
      let foundI = -1;
      for (let i = 0; i < this.currentRecentlyWatchedList.length; i++) {
        let item = this.currentRecentlyWatchedList[i];
        if (item.path + item.name === v.path + v.name) {
          found = true;
          foundI = i;
          break;
        }
      }

      if (found) {
        this.currentRecentlyWatchedList.splice(foundI, 1);
        this.currentRecentlyWatchedList.unshift(v);
      } else {
        this.currentRecentlyWatchedList.unshift(v);
        if (this.currentRecentlyWatchedList.length > 10) {
          this.currentRecentlyWatchedList.splice(
            this.currentRecentlyWatchedList.length - 1,
            1
          );
        }
      }

      let data = JSON.stringify(this.currentRecentlyWatchedList);
      fs.writeFile(path.join(appPath, "appData.json"), data, (err) => {
        if (err) {
          throw err;
        }
      });
    },
  },
};
</script>

<style lang="scss">
.v-expansion-panel-content__wrap {
  padding: 0px !important;
}

.video-blocks-container {
  display: flex;
  flex-wrap: wrap;
}
</style>
