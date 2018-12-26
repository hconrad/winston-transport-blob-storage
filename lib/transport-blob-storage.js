const Transport = require('winston-transport');
const Moment = require('moment');
const {
  ServiceURL,
  ContainerURL,
  AppendBlobURL,
  Aborter,
  SharedKeyCredential,
  StorageURL,
} = require('@azure/storage-blob');

function checkStringValue(value) {
  if(!value || typeof value !== 'string' || value.length === 0) {
    throw new Error('Invalid value supplied');
  }
}

module.exports = class AzureBlobStorageTransport extends Transport {
  constructor(opts) {
    super(opts);
    const {
      accountName, accountKey, storageUrl, containerName,
    } = opts;
    Object.values(opts).forEach((val) => checkStringValue(val));
    const credentials = new SharedKeyCredential(accountName, accountKey);
    const pipeline = StorageURL.newPipeline(credentials);
    const serviceUrl = new ServiceURL(storageUrl, pipeline);
    this.containerUrl = ContainerURL.fromServiceURL(serviceUrl, containerName);
  }

  checkError(info, appendBlob) {
    return (error) => {
      if (error.statusCode !== 404) {
        throw error;
      }
      if (!error.message || !error.message) {
        throw error;
      }
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('container')) {
        return this.containerUrl.create(Aborter.none)
          .then(() => this.logMessage(appendBlob, info));
      } else if (errorMessage.includes('blob')) {
        return appendBlob.create().then(() => this.logMessage(appendBlob, info));
      } else {
        throw error;
      }
    };
  }

  logMessage(appendBlob, info) {
    const message = `${info.message}\n`;
    const logSize = message.length;
    return appendBlob.appendBlock(Aborter.none, info.message, logSize).catch(this.checkError(info, appendBlob));
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });
    const now = new Moment();
    const appendBlob = AppendBlobURL.fromContainerURL(this.containerUrl, `log-${now.format('YYYY-MM-DD')}.log`);
    this.logMessage(appendBlob, info);
    callback();
  }
};

