import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '../../data/users.json');

export async function readUsers() {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8') || '[]');
  } catch {
    return [];
  }
}

export async function writeUsers(users) {
  await fs.writeFile(file, JSON.stringify(users, null, 2));
}
