# Guia de troubleshooting

## Conectividad

Comprueba primero el token, el `actorId` y el acceso al dataset. Un fallo de
permisos debe resolverse en Apify y no ocultarse cambiando el resultado del
check.

## Contrato de datos

Compara los nombres y tipos de los items con `expected-schema.json`. Si el
actor cambia su salida, actualiza el contrato junto con una prueba de
compatibilidad.

## Operacion

Revisa el estado y los logs del run. Un dataset puede estar accesible y aun
asi ser inutil si esta vacio, desactualizado o tiene una tasa alta de errores.
