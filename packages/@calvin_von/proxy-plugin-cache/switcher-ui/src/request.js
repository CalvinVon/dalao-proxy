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
        const res = await http.get('/sync-config');
        console.log('res: ', res);
        return res;
    }
};

export default request;