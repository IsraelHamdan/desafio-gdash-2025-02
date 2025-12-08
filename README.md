**Pra conseguir rodar a aplicação execute o comando**
```sh
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml down
```

Como eu uso dois docker compose eu preciso mesclar eles, para conseguir subir a aplicação
pois sem isso o container do Go não faz o build,

*Tecnologias usadas:*
* Backend: Nest.js, usando FastifyAdpter pra ter mais desempenho 
  - Zod para validação
  - Mongoose para se conectar com o banco
  - Axios para consumir api's 
* Worker de dados: Python, não usei framework
* Worker de mensagens: Go
* RabbitMQ para fila de mensagens 
* Frontend: 
  - Vite
  - React: 19.2
  - Zod
  - TanStack Query + Axios: Consumo de API 
  - TanStack Table: Para construção de tabelas
  - TanStack Form: Para formulários
  - Tailwind CSS + Shadcn + AnimateUi: Estilização


