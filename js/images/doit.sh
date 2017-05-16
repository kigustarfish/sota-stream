#!/bin/bash
dir="."
for f in "$dir"/*; do
  
  a="$(echo "$f" | sed 's/[0-9][0-9]px-//' | sed 's/_icon//g' |sed 's/_//g' | awk '{print tolower($0)}')"
  cp $f ./output/$a;
done
