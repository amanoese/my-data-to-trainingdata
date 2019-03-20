#!/bin/bash

set -euc

SCRIPT_DIR=$(cd $(dirname $0); pwd)
cd $SCRIPT_DIR

echo "$1"
cat "$2"
echo

DRAW_BOXS=$(
  cat $2 |
  cut -d  ' ' -f 2- |
  awk '{$3=$3+$1;$4=$4+$2}{print $1","$2,$3","$4}' |
  xargs -L1 -i echo -n ' -draw "rectangle {}"')

echo -n $DRAW_BOXS

echo convert "$1" -stroke '#ff0000' -strokewidth 1 -fill '#00000000' "$DRAW_BOXS" "${3:-test.png}"
bash -c "convert $1 -stroke '#ff0000' -strokewidth 1 -fill '#00000000' $DRAW_BOXS ${3:-test.png}"
echo

