let config;
let RAW_FILES_BUFFERS_RECORDS = [];

const Storage = module.exports;
Storage.init = function init(setting) {
    config = setting;
};

Storage.storeRecord = function storeRecord(record) {
    const { maxRecords } = config;
    let limitIndex = RAW_FILES_BUFFERS_RECORDS.length - maxRecords;
    if (limitIndex < 0) {
        limitIndex = 0;
    }
    RAW_FILES_BUFFERS_RECORDS = [...RAW_FILES_BUFFERS_RECORDS, record].slice(limitIndex);
};

Storage.getRecord = function getRecord(recordId) {
    return RAW_FILES_BUFFERS_RECORDS.filter(item => item.id === recordId)[0];
};

Storage.clean = function clean() {
    RAW_FILES_BUFFERS_RECORDS = [];
}