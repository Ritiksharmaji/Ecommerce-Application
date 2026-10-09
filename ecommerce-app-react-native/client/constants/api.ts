import axios from "axios";
import { Platform } from "react-native";

// const LOCAL_API_URL = Platform.select({
//     android: "http://192.168.0.55:3000/api",
//     ios: "http://192.168.0.55:3000/api",
//     default: "http://localhost:3000/api",
// });

const LOCAL_API_URL = Platform.select({
    android: "http://10.187.147.11:3000/api",
    ios: "http://10.187.147.11:3000/api",
    default: "http://localhost:3000/api",
});

const api = axios.create({ baseURL: "https://ecommerce-react-native-backend.vercel.app" });

export default api;


// import axios from "axios";
// import { Platform } from "react-native";

// const YOUR_COMPUTER_IP = "10.187.147.141";

// const LOCAL_API_URL = Platform.select({
//     android: `http://${YOUR_COMPUTER_IP}:3000/api`,
//     ios: `http://${YOUR_COMPUTER_IP}:3000/api`,
//     default: "http://localhost:3000/api",
// });

// console.log('🌐 API Base URL:', LOCAL_API_URL);

// const api = axios.create({ 
//     baseURL: LOCAL_API_URL,
//     timeout: 10000,
// });

// // Add request interceptor
// api.interceptors.request.use(request => {
//     console.log('📤 Request:', {
//         method: request.method?.toUpperCase(),
//         url: request.url,
//         baseURL: request.baseURL,
//         fullURL: `${request.baseURL}${request.url}`,
//         data: request.data
//     });
//     return request;
// });

// // Add response interceptor
// api.interceptors.response.use(
//     response => {
//         console.log('📥 Response:', {
//             status: response.status,
//             url: response.config.url,
//             data: response.data
//         });
//         return response;
//     },
//     error => {
//         console.log('❌ API Error Details:', {
//             message: error.message,
//             code: error.code,
//             url: error.config?.url,
//             baseURL: error.config?.baseURL,
//             fullURL: error.config?.baseURL + error.config?.url,
//             method: error.config?.method,
//             stack: error.stack
//         });
        
//         if (error.code === 'ERR_NETWORK') {
//             console.log('🔍 Network Error - Possible causes:');
//             console.log('   1. Server not running');
//             console.log('   2. Wrong IP address');
//             console.log('   3. Firewall blocking');
//             console.log('   4. Phone/computer on different networks');
//             console.log('   5. CORS issues');
//         }
//         return Promise.reject(error);
//     }
// );

// export default api;