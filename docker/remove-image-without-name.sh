#!/bin/sh

docker images | while read row; do
    awk '{print $1}' <<<$row | grep -q none
    if [[ $? -eq 0 ]]; then
        docker image rm $(awk '{print $3}' <<<$row); 
    fi; 
done
