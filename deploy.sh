#!/bin/bash
export LANG=C
CF="cf"

rollback() {
  local app_name=$1
  if ${CF} app ${app_name}; then
      ${CF} logs ${app_name} --recent
      ${CF} delete ${app_name} -f
  fi
  exit 1
}

set_env() {
  local app_name=$1
  local key=$(echo $2 | sed 's/:.*$//')
  local value=$3
  ${CF} set-env ${app_name} ${key} ${value}
}

copy_env() {
  local app_name=$1
  local new_app_name=$2
  local vcap_services=$(${CF} env ${app_name} 2>/dev/null| sed -n '/^User-Provided:/,/Running Environment Variable Groups:/p' \
      | sed -e '/^User-Provided:/d' \
      | sed -e '/Running Environment Variable Groups:/d' \
      | sed -e '$d')

  if [[ -z "${vcap_services}" ]];then
      echo "ERR: not found VCAP_SERVICES in bx app environment"
      return 1
  fi

  echo "${vcap_services}" | while read line; do
    set_env ${new_app_name} $line
  done
}

deploy() {
  local app_name=$1
  local domain=$2
  local host=$3
  local new_app_name="${app_name}_new"
  local old_app_name="${app_name}_old"

  local opt=""
  if [ -z ${host} ];then
    opt="--no-hostname"
  else
    opt="--hostname ${host}"
  fi

  if [ $# -lt 2 ];then
    echo "usage: app_name domain [host]"
    exit 1
  fi

  if ! ${CF} app ${app_name}; then
    ${CF} push ${app_name} -d ${domain} ${opt}
  else
    trap "rollback ${new_app_name}" ERR
    # 新アプリケーションのデプロイ
    ${CF} push ${new_app_name} -f manifest.yml -d ${domain} --hostname ${new_app_name} --no-start

    # 環境変数のコピー & リステージ
    copy_env ${app_name} ${new_app_name}
    ${CF} start ${new_app_name}

    # ssh の無効化
    ${CF} disable-ssh ${new_app_name}

    # デフォルトrouteの削除
    ${CF} unmap-route ${new_app_name} ${domain} --hostname ${new_app_name}
    ${CF} delete-route ${domain} --hostname ${new_app_name} -f

    # 経路のマッピング
    ${CF} map-route ${new_app_name} ${domain} ${host:+--hostname ${host}}

    # リネーム
    ${CF} rename ${app_name} ${old_app_name}

    trap "" ERR
    ${CF} rename ${new_app_name} ${app_name}
    ${CF} unmap-route ${old_app_name} ${domain} ${host:+--hostname ${host}}
    ${CF} delete ${old_app_name} -f
  fi
}

