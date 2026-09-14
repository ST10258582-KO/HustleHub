const { v4: uuidv4 } = require('uuid');

const users = [];

const findByEmail = (email) =>
  users.find((u) => u.email === email.toLowerCase());

const findById = (id) =>
  users.find((u) => u.id === id);

const create = ({ name, email, passwordHash, role = 'client' }) => {
  const user = {
    id: uuidv4(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    createdAt: new Date(),
  };
  users.push(user);
  return user;
};

const clear = () => {
  users.length = 0;
};

module.exports = { findByEmail, findById, create, clear };
