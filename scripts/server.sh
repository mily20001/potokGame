#!/usr/bin/env bash

./node_modules/.bin/mkdirp ./build/

build_server_cmd="node_modules/.bin/babel backend/ --out-dir ./build/ --ignore .eslintrc";

eval "${build_server_cmd}";

node_modules/.bin/nodemon --config ./scripts/nodemon.json --watch backend/ --exec "${build_server_cmd}" &

node_modules/.bin/nodemon --config ./scripts/nodemon_server.json --watch build/ --exec "cd ./build; node ./app.js"