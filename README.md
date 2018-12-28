# Winston Transport for Azure Blob Storage

This simple transport allows log statements to be directly uploaded to Blob Storage. 

Presently the logger will do a daily rolling log file in your specified container.

The log file will be named

`log-YYYY-MM-DD.log`

## Installation

``yarn install``
or
``npm install``

## Tests
``yarn test``
or ``npm test``

## Sample Usage
The transport constructor accepts an object that has to have the following properties:
* accountName - The account name for your blob storage account
* accountKey - The secret account key for your blob storage account
* storageUrl - The url to your storage account.
* containerName - The container name where you want your log stored. The container name can have / to place the file in a "folder". So putting myproject/logs is valid.
```javascript
const winston = require('winston');
const WinstonTransportBlobStorage = require('winston-transport-blob-storage');
const { createLogger, transports } = winston;

const logger = createLogger({
  transports: [
    new transports.Console(),
    new WinstonTransportBlobStorage({
     accountName: 'myBlobStorageAccountName',
     accountKey: 'myBlobStorageAccountKey',
     storageUrl: 'https://myaccount.blob.core.windows.net',
     containerName: 'logs',
    })
  ]
})
```

## Future considerations
* Add the ability to have options on when the log rolls over (daily, hourly, monthly, size etc.)
* Add the ability to have a custom log message

