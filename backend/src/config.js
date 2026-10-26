export const config = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/hustlehub',
  port: Number(process.env.PORT || 3443),
  useMongo: process.env.USE_MONGO === 'true'
};
