#!/bin/bash

PLUGINS_DIR="/Users/reorx/Documents/Plugins-Playground/.obsidian/plugins"
PLUGIN_DIR_NAME="obsidian-paste-image-enhance"

mkdir -p "$PLUGINS_DIR/$PLUGIN_DIR_NAME"
rsync -a build/* manifest.json "$PLUGINS_DIR/$PLUGIN_DIR_NAME"
touch "$PLUGINS_DIR/$PLUGIN_DIR_NAME/.hotreload"
