#!/bin/bash
# List largest files in unpushed commits - helps identify push blockers
echo "=== LARGEST FILES IN UNPUSHED COMMITS ==="
echo ""
git rev-list origin/main..main --objects 2>/dev/null | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' 2>/dev/null | \
  awk '/^blob/ {printf "%8.1f MB  %s\n", $3/1024/1024, $4}' | \
  sort -rn | head -30

echo ""
echo "=== SIZE BY DIRECTORY ==="
git rev-list origin/main..main --objects 2>/dev/null | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' 2>/dev/null | \
  awk '/^blob/ {
    path=$4
    n=split(path,parts,"/")
    if(n>1) path=parts[1]"/"parts[2]
    else path="(root)"
    size[path]+=$3
    count[path]++
  }
  END {
    for(p in size) printf "%8.1f MB  %4d files  %s\n", size[p]/1024/1024, count[p], p
  }' | sort -rn

echo ""
echo "=== TOTAL UNPUSHED SIZE ==="
git rev-list origin/main..main --objects 2>/dev/null | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize)' 2>/dev/null | \
  awk '/^blob/ {sum+=$3} END {printf "%.1f MB (%.0f bytes)\n", sum/1024/1024, sum}'
