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


module.exports = class AzureBlobStorageTransport extends Transport {
  constructor(opts) {
    super(opts);
    const {
      accountName, accountKey, storageUrl, containerName,
    } = opts;
    const credentials = new SharedKeyCredential(accountName, accountKey);
    const pipeline = StorageURL.newPipeline(credentials);
    const serviceUrl = new ServiceURL(storageUrl, pipeline);
    this.containerUrl = ContainerURL.fromServiceURL(serviceUrl, containerName);
    this.logSize = 0;
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
        this.containerUrl.create(Aborter.none)
          .then(() => this.logMessage(info));
      } else if (errorMessage.includes('blob')) {
        appendBlob.create().then(() => this.logMessage(info));
      } else {
        throw error;
      }
    };
  }
  logMessage(info) {
    const now = new Moment();
    const message = `${info.message}\n`;
    const logSize = message.length;
    const appendBlob = AppendBlobURL.fromContainerURL(this.containerUrl, `log-${now.format('YYYY-MM-DD')}.log`);
    appendBlob.appendBlock(Aborter.none, info.message, logSize).catch(this.checkError(info, appendBlob));
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });
    this.logMessage(info);
    callback();
  }
};

