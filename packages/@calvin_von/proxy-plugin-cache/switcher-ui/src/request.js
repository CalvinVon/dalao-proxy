import axios from 'axios';

const http = axios.create({
    baseURL: '/__plugin_ui_switcher__',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 60000
});

http.interceptors.response.use(response => {
    if (response.status === 200) {
        if (response.data.code === 200) {
            return response.data.data;
        }
        else {
            return Promise.reject(response.data.message);
        }
    }
    else {
        return Promise.reject(response.statusText);
    }
});

const request = {
    async sync() {
        const config = await http.get('/sync-config');

        const { maxAge, filters } = config.cache;
        config.cache.enable = config.enable;
        delete config.enable;

        const maxAgeUnit = maxAge[1];
        const matchResult = maxAgeUnit.match(/(^s)|(^m)|(^h)/);
        if (matchResult[1]) {
            maxAge[1] = 'seconds';
        }
        else if (matchResult[2]) {
            maxAge[1] = 'minutes';
        }
        else if (matchResult[3]) {
            maxAge[1] = 'hours';
        }
        else {
            maxAge[1] = 'seconds';
        }

        config.cache.maxAgeNumber = maxAge[0];
        config.cache.maxAgeUnit = maxAge[1];

        filters.forEach(filter => {
            if (isNaN(filter.value)) {
                filter._isNumber = false;
            }
            else {
                filter._isNumber = true;
                filter.value = +filter.value;
            }
        });

        return config;
    },

    async upload(config) {
        const { maxAgeNumber, maxAgeUnit, filters } = config.cache;

        config.cache.maxAge = [
            maxAgeNumber,
            maxAgeUnit
        ];

        delete config.cache.maxAgeNumber;
        delete config.cache.maxAgeUnit;

        filters.forEach(filter => {
            delete filter._isNumber;
        });

        await http.post('/upload-config', config);
        return config;
    },

    async reload() {
        await http.post('/reload-server');
    },

    async cleanFiles(data) {
        await http.post('/clean', data);
    },

    async storeFiles(data) {
        await http.post('/store', data);
    }
};

export default request;