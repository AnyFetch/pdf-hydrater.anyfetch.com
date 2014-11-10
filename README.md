# Pdf AnyFetch Hydrater
> Visit http://anyfetch.com for details about AnyFetch.

AnyFetch Hydrater for pdf files

# How to install?

You need `pdf2htmlex`. To install:
```sh
sudo add-apt-repository ppa:coolwanglu/pdf2htmlex --yes
sudo apt-get update -qq
sudo apt-get install -qq pdf2htmlex
npm install
```

# Before deploying on Heroku

You need to set BUILDPACK_URL before deploying on Heroku:
```sh
heroku config:add BUILDPACK_URL=https://github.com/ddollar/heroku-buildpack-multi.git
```

Support: `support@papiel.fr`.
