#!/bin/bash

SCRIPT_DIR=$(cd $(dirname $0); pwd)
cd $SCRIPT_DIR

echo convert "$1" -stroke '#ff0000' -strokewidth 5 -fill '#00000000' -draw "rectangle $(echo "$2" | awk '{$1=$1-$3/2;$2=$2-$4/2;$3=$3+$1;$4=$4+$2}4')" "${3:-out.jpg}"
convert "$1" -stroke '#ff0000' -strokewidth 5 -fill '#00000000' -draw "rectangle $(echo "$2" | awk '{$1=$1-$3/2;$2=$2-$4/2;$3=$3+$1;$4=$4+$2}4')" "${3:-out.jpg}"
