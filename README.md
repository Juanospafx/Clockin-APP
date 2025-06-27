# React + TypeScript + Vite + Fastapi

Proyecto para gestión de clockins y monitoreo de horas de trabajo de emepleados en una pequeña o mediana empresa. 


Proximamente con un detector de epps para empleados que trabajan en campo y sus jefes necesitan asegurarse de que siempre empiezan con los equipos de protección personal puestos. 



## Configuración de entorno

Todas las variables necesarias para el frontend y backend se definen en el
archivo `.env` ubicado en la raíz del proyecto.  Entre ellas:

```
VITE_API_URL=http://186.150.228.64:8000
FRONTEND_ORIGINS=http://186.150.228.64:3000
```

`FRONTEND_ORIGINS` es usado por el backend para permitir las llamadas CORS del
cliente desplegado.
