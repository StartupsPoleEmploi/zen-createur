# Zen

## Setup

**A `.env.development` file must be created and populated with appropriate configuration values. Sample values in the `.env.example` file.**

**For front-end Sentry use, a `front/.env.local` needs creation and configuration too.**

Install Docker, Docker-Compose and yarn, then

```
yarn run start:dev
```

Dev containers start with :

- Express app on port 8080
- React app on port 3000
- nginx (last React production build) on port 80

Production containers only open port 443 & 80

## Development help

- Pressing Escape on the development environment will show a modal allowing to edit the contents of `req.session.user`, allowing for quick user change
- Adding a `local-development.js` file in `api/config` will allow disabling calls to pe-api, resulting in less dependencies and easier development in case of partner qa environment failures. Template :

```js
module.exports = {
  bypassDeclarationDispatch: true, // disables calls to pe-api for documents
  bypassDocumentsDispatch: true // disables calls to pe-api for declarations
};
```

## Deploy QA OR production
  - update / create the `.env.qa` or `.env.production` file
  - update / create the `./api/config/local-qa.js` or `./api/config/local-production.js` file
  - update / create the `./nginx/.htpasswd.qa` or `./nginx/.htpasswd.production` file
  - create the `./nginx/entrust-zen.pole-emploi.fr-key.pem` file
  - run : `sh ./script/deploy.sh qa` or `sh ./script/deploy.sh production`
  - connect to the server `ssh zen-createur-qa` or `ssh zen-createur-production`
  - go to teh correct folder `cd /home/docker/zen-createur`
  - update docker : `sh ./script/start.sh qa` or  `sh ./script/start.sh production`

### HTTPS certificate

The entrust-zen.pole-emploi.fr-key.pem file must be put in the nginx folder
