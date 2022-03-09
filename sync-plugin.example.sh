#!/bin/bash

PLUGINS_DIR=""
PLUGIN_DIR_NAME="obsidian-daily-notes-new-tab"

mkdir -p "$PLUGINS_DIR/$PLUGIN_DIR_NAME"
rsync -a main.js manifest.json "$PLUGINS_DIR/$PLUGIN_DIR_NAME"
touch "$PLUGINS_DIR/$PLUGIN_DIR_NAME/.hotreload"
