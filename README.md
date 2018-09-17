# IBM Cloudアカウント作成後の流れ
## bluemixにログインする
`bx login`コマンドでログインする。

    $ bx login
    API エンドポイント: https://api.ng.bluemix.net

    Email> <メールアドレスを入力>

    Password> <パスワードを入力>
    認証中です...
    OK

    アカウントを選択します (または Enter キーを押してスキップします):
    1. naruta's Account (<accound_id>)
    数値を入力してください> 1 ターゲットのアカウント naruta's Account (<accound_id>)

    ターゲットのリソース・グループ Default


    API エンドポイント:   https://api.ng.bluemix.net (API バージョン: 2.92.0)
    地域:               us-south
    ユーザー:             <メールアドレス>
    アカウント:          narutay Account (<accout_id>)
    リソース・グループ:    Default
    組織:
    スペース:

## 組織、スペースを設定する
アカウント作成後、設定変更等していなければ対話は無く自動定義される。

    $ bx target --cf
    ターゲットの組織 <メールアドレス>
    ターゲットのスペース dev

    API エンドポイント:   https://api.ng.bluemix.net (API バージョン: 2.92.0)
    地域:               us-south
    ユーザー:             <メールアドレス>
    アカウント:          narutay Account (<accout_id>)
    リソース・グループ:    Default
    組織:                <メールアドレス>
    スペース:            dev

## サービスを作成する
### Db2

    $ bx service create "dashDB For Transactions" Lite sv-db2 -c '{"email": "<メールアドレス>"}'
    OK

### Internet of Things Platform

    $ bx service create iotf-service iotf-service-free sv-iot
    OK

### Watson Natural Language Classifier

    $ bx service create natural_language_classifier standard sv-watson-nlc
    OK

### Watson Speech to text

    $ bx service create speech_to_text lite sv-watson-stt
    OK

## サービスを関連付けする

    $ bx service bind irserver sv-db2
    $ bx service bind irserver sv-iot
    $ bx service bind irserver sv-watson-nlc
    $ bx service bind irserver sv-watson-stt

## 環境変数の設定

### Googleの認証用トークンの登録

    $ bx app env-set irserver GOOGLE_CLIENT_ID <クライアントID>
    $ bx app env-set irserver GOOGLE_CLIENT_SECRET <クライアントシークレット>
    $ bx app env-set irserver GOOGLE_CALLBACK_URL <コールバックURL>

### Auth0のClient ID, Client Secretの 登録

    $ bx app env-set irserver AUTH0_DOMAIN <Auth0のドメイン>
    $ bx app env-set irserver AUTH0_AUDIENCE <Auth0のClient ID>
    $ bx app env-set irserver AUTH0_SECRET <Auth0のClient Secret>

## サービスをデプロイする

    $ bx app push

    略....

    要求された状態: started
    インスタンス: 1/1
    使用: 256M x 1 インスタンス
    URL: irserver.mybluemix.net
    最終アップロード日時: Sat Jan 13 00:06:27 UTC 2018
    スタック: cflinuxfs2
    ビルドパック: nodejs_buildpack

        状態   開始日時                 CPU     メモリー             ディスク         詳細
    #0   実行   2018-01-13 09:08:36 AM   23.6%   256M の中の 126.1M   1G の中の 191M
