#!/bin/bash

DIR=`dirname ${0}`

if [ $# -ne 2 ];then
  echo "usage: app_name1 app_name2"
  exit 1
fi

app_name=$1
dest_app_name=$2

vcap_services=$(LANG=C bx app env ${app_name} 2>/dev/null| sed -n '/^User-Provided:/,/Running Environment Variable Groups:/p' \
    | sed -e '/^User-Provided:/d' \
    | sed -e '/Running Environment Variable Groups:/d' \
    | sed -e '$d')

if [[ -z "${vcap_services}" ]];then
    echo "ERR: not found VCAP_SERVICES in bx app environment"
    exit 1
fi

set_env() {
  local key=$(echo $1 | sed 's/:.*$//')
  local value=$2
  bx app env-set ${dest_app_name} ${key} ${value}
}

echo "${vcap_services}" | while read line; do
  set_env $line
done

exit 0
