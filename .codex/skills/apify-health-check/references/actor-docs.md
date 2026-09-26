# Documentacion del actor Apify

Este proyecto usa un snapshot de la API de Apify para representar el resultado
de un actor y su dataset. En una integracion real, el actor se identifica por
`actorId`, el ultimo run informa `status` y `finishedAt`, y el dataset expone
una lista de records.

El health check no almacena tokens. Solo comprueba el indicador booleano
`tokenConfigured` que entrega el adaptador de la aplicacion.
