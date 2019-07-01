const os = require('os');
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
  if (!value || typeof value !== 'string' || value.length === 0) {
    throw new Error('Invalid value supplied');
  }
}

module.exports = class AzureBlobStorageTransport extends Transport {
  constructor(opts) {
    super(opts);
    if (!opts) {
      throw new Error('No options provided');
    }
    const {
      accountName, accountKey, storageUrl, containerName, createContainer, storeInDateFolder,
    } = opts;
    checkStringValue(accountName);
    checkStringValue(accountKey);
    checkStringValue(storageUrl);
    checkStringValue(containerName);

    this.createContainer = createContainer;
    this.storeInDateFolder = storeInDateFolder;
    const credentials = new SharedKeyCredential(accountName, accountKey);
    const pipeline = StorageURL.newPipeline(credentials);
    const serviceUrl = new ServiceURL(storageUrl, pipeline);
    this.containerUrl = ContainerURL.fromServiceURL(serviceUrl, containerName);
  }

  checkError(info, appendBlob, callback) {
    return (error) => {
      if (!error || error.statusCode !== 404 || !error.message) {
        callback(error, false);
        return;
      }

      const errorMessage = error.message.toLowerCase();
      if (this.createContainer && errorMessage.includes('container')) {
        this.containerUrl.create(Aborter.none)
          .then(() => this.logMessage(appendBlob, info));
        return;
      } if (errorMessage.includes('blob')) {
        appendBlob.create().then(() => this.logMessage(appendBlob, info));
        return;
      }
      callback(error, false);
    };
  }

  logMessage(appendBlob, info, callback) {
    const message = `${info[Symbol.for('message')]}\r\n`;
    const logSize = message.length;
    return appendBlob.appendBlock(Aborter.none, message, logSize)
      .catch(this.checkError(info, appendBlob, callback));
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });
    const now = new Moment();
    const fileName = this.storeInDateFolder
      ? `${now.format('YYYY/MM/DD')}/log-${now.format('YYYY-MM-DD')}.log`
      : `log-${now.format('YYYY-MM-DD')}`;
    const appendBlob = AppendBlobURL.fromContainerURL(this.containerUrl, fileName);
    this.logMessage(appendBlob, info, callback).then(() => callback());
  }
};
