const Transport = require('./transport-blob-storage');

function createTransportProps(props) {
    const defaultProps = {
        accountName: 'testAccount',
        accountKey: 'testKey',
        storageUrl: 'testUrl',
        containerName: 'testContainer',
    };
    return {
        ...defaultProps,
        ...props,
    }
}

function createMockContainerUrl() {
    return {
        create: jest.fn().mockResolvedValue({}),
    }
}

function createMockAppendBlob() {
    return {
        create: jest.fn().mockResolvedValue({}),
        appendBlock: jest.fn().mockResolvedValue({}),
    }
}

describe('transport-blob-storage', () => {
    test('constructor param validation', () => {
        const badProps = createTransportProps({accountName: undefined});
        expect(() => new Transport(badProps)).toThrow('Invalid value supplied');
        const goodProps = createTransportProps({});
        const transport = new Transport(goodProps);
        expect(transport.containerUrl).toBeDefined();
    });
    test('checkError exception paths', () => {
        const transport = new Transport(createTransportProps());
        const errorCheck = transport.checkError(null, null);
        expect(() => errorCheck({})).toThrow();
        expect(() => errorCheck({statusCode: 404})).toThrow();
        expect(() => errorCheck({statusCode: 404, message: null})).toThrow();
    });
    test('checkError good paths container', (done) => {
        const transport = new Transport(createTransportProps());
        const spy = jest.spyOn(transport, 'logMessage');

        const mockAppendBlob = createMockAppendBlob();
        transport.containerUrl = createMockContainerUrl();
        const errorCheck = transport.checkError({message: 'test message'}, mockAppendBlob);
        errorCheck({statusCode: 404, message: 'container'}).then(() => {
            expect(transport.containerUrl.create).toBeCalled();
            expect(mockAppendBlob.appendBlock).toBeCalled();
            expect(transport.logMessage).toBeCalled();
            done();
        });
    });
    test('checkError good paths blob', (done) => {
        const transport = new Transport(createTransportProps());
        const spy = jest.spyOn(transport, 'logMessage');

        const mockAppendBlob = createMockAppendBlob();
        transport.containerUrl = createMockContainerUrl();
        const errorCheck = transport.checkError({message: 'test message'}, mockAppendBlob);
        errorCheck({statusCode: 404, message: 'blob'}).then(() => {
            expect(transport.containerUrl.create.length).toBe(0);
            expect(mockAppendBlob.appendBlock.length).toBe(0);
            expect(mockAppendBlob.create).toBeCalled();
            expect(transport.logMessage).toBeCalled();
            done();
        });
    });
    test('checkError last bad path', () => {
        const transport = new Transport(createTransportProps());
        const mockAppendBlob = createMockAppendBlob();
        transport.containerUrl = createMockContainerUrl();
        const errorCheck = transport.checkError({message: 'test message'}, mockAppendBlob);
        expect(() => errorCheck({statusCode: 404, message: 'unkown'})).toThrow();
    });
    test('log function', () => {
        const transport = new Transport(createTransportProps());
        const mockCallback = jest.fn();

        transport.log({ message: 'test message'}, mockCallback);

        expect(mockCallback).toBeCalled();
    })
});

