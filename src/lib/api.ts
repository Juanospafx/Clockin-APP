import axios from 'axios';

// Base de la API obtenida desde el entorno. Al desplegar la aplicación
// se debe definir `VITE_API_URL` apuntando a la IP pública del backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export default api;
