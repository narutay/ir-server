#!/bin/bash

DIR=`dirname ${0}`
CF_MANIFEST="${DIR}/manifest.yml"
OUT="${DIR}/server/vcap-local.json"

app_name=$(grep host ${CF_MANIFEST} | awk '{print $2}')

if [[ -z "${app_name}" ]];then
    echo "ERR: not found manifest.yml or 'host' line in manifest.yml"
    exit 1
fi

vcap_services=$(LANG=C bx app env ${app_name} 2>/dev/null| sed -n '/^System-Provided:/,/VCAP_APPLICATION/p' \
    | sed -e '/^System-Provided:/d' \
    | sed -e '/VCAP_APPLICATION/d' \
    | sed -e 's/VCAP_SERVICES/services/' \
    | sed -e '$d')

if [[ -z "${vcap_services}" ]];then
    echo "ERR: not found VCAP_SERVICES in bx app environment"
    exit 1
fi

echo "${vcap_services}" > "${OUT}"

echo "Success create ${OUT}"

exit 0