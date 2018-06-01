# BreatheCo.de Desktop Client

This is the application use to deliver the courses.

## Instalation

1. Download the repository
```sh
$ git clone <repo_url>
```
2. Install npm packaes
```sh
$ npm install
```
3. clone this repot inside your /src/js/utils folder:
```
$ cd /src/js/utils
$ git clone https://github.com/breatheco-de/react-components
$ mv react-components/ bc-components/
$ git clone https://github.com/breatheco-de/api-javascript-wrapper.git
$ mv api-javascript-wrapper/ api/
```

3. Create your **.env.dev** and file and setup the envirnoment variables
```js
// .env

STATIC_PATH=

ENVIRONMENT=development
CMS_URL=https://breatheco.de
API_URL=https://talenttree-alesanchezr.c9users.io
ASSETS_URL=https://assets-alesanchezr.c9users.io/apis
REPLIT_URL=https://assets.breatheco.de/apps/replit?r=
```
