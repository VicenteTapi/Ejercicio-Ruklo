# PARTE 1
## Explica cómo harías para evitar errores si esto se ejecuta sobre muchos eventos (¿usarías un job, caché, base de datos?, ¿cómo lo validarías?).
Para garantizar que el procesamiento de miles o incluso cientos de miles de eventos diarios no desencadene errores ni pérdidas de datos, implementaría una arquitectura con API Gateway y Lambda. Cada POST /events pasaría por API Gateway, donde validamos esquema y autenticidad (por ejemplo, con JWT y límites de solicitud), y se invoca inmediatamente una función Lambda que normaliza el payload y aplica la lógica de negocio. Al mantener todo dentro de Lambda, evitamos cuellos de botella en servidores fijos, ya que AWS escala automáticamente las instancias de la función según la concurrencia.

Dentro de esa Lambda, usaría ElastiCache Redis para el contador de visitas consecutivas por par clientId|storeId. Luego de actualizar el contador o resetearlo al detectar una recarga, la misma Lambda inserta el evento en la base de datos y, si llega a cinco visitas, crea el registro de beneficio.

Para validar y asegurar que todo fluye sin errores, implementaría pruebas de carga antes de producción, simulando el envío masivo de eventos y midiendo latencias y errores en Lambda, Redis y la base de datos.

# Parte 2
## ¿Qué limitaciones tiene tu solución actual?
El endpoint consulta en tiempo real toda la tabla de Event de un cliente y luego itera en memoria para generar la serie de semanas, lo cual crece con el número de recargas. También el contador de visitas está en un Map en memoria de la instancia, por lo que si el servidor se reinicia se pierde el estado.

## ¿Qué pasaría con 100 000 eventos al día?

Con ese volumen, el Map local se volvería insuficiente, y las escrituras síncronas sobrecargarían la base de datos. Habría alta latencia y timeouts de Prisma. También las queries de findMany tardarían cada vez más (decenas de miles de filas) y el cálculo de promedios en JS se haría lento, provocando timeouts en el request. La base de datos recibiría una carga constante de lecturas masivas. 


## Cómo usar el código

Genera el cliente Prisma y aplica las migraciones (crea dev.db automáticamente):
```
npm run prisma:generate
npm run prisma:migrate
```
## Ejecución


# 1. Levantar el servidor API
En un terminal, arranca Express en modo desarrollo:
```
npm run dev  # Deberías ver: "Server listening on port 3002"
```
En otra terminal, ejecuta el script principal:
```
npm run main
```
# Intreacción con la consola:
## Opción 1: Otorgar beneficio automático
El script limpia la base de datos (Event y Benefit).

Publica 1000 eventos desde data/ruklo_events_1000.json al endpoint /events.

Recorre cada clientId único y consulta /clients/:id/benefits.

Imprime en consola tablas con los beneficios generados para cada cliente.

Si ningún cliente cumple la condición (5 visitas seguidas sin recarga), muestra:

Ningún cliente cumple la condición para el beneficio automático.
## Opción 2: Ver historial de transacciones
Pregunta:
¿Qué historial desea? (visit / recharge):
Si ingresas visit: imprime la tabla de todos los eventos de tipo visit para el cliente.

Si ingresas recharge: imprime la tabla rechargesByWeek con { weekStart, avgAmount }, incluyendo semanas sin recargas (avgAmount 0).

Antes de mostrar, pide:

Ingrese el clientId:
mostrando la lista de IDs disponibles.
El cliente id se debe ingresar en el formado client_id dado en las opciones no simplemente el id
Si el clientId no está en la lista, muestra “clientId no reconocido. Saliendo.” y finaliza.
