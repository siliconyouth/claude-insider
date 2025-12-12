import { getPayload } from 'payload';
import config from './payload.config';

async function createFirstUser() {
  const payload = await getPayload({ config });
  
  try {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'vladimir@dukelic.com',
        password: 'TestPassword123',
        name: 'Vladimir Dukelic',
        role: 'admin',
      },
    });
    console.log('User created successfully:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  }
  
  process.exit(0);
}

createFirstUser();
