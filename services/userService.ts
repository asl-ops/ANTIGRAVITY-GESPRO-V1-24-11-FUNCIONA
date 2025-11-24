import { User } from '../types';

const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Gestor Principal', initials: 'GP', avatarColor: 'bg-sky-600' },
  { id: 'user-2', name: 'Marta López', initials: 'ML', avatarColor: 'bg-emerald-600' },
  { id: 'user-3', name: 'Carlos Vega', initials: 'CV', avatarColor: 'bg-amber-600' },
  { id: 'user-4', name: 'Ana Torres', initials: 'AT', avatarColor: 'bg-indigo-600' },
];

/**
 * Simulates fetching the list of users from a database.
 * @returns A promise that resolves to an array of User objects.
 */
export const getUsers = (): Promise<User[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(MOCK_USERS);
    }, 200); // Simulate a small delay
  });
};

/**
 * Simulates fetching a single user by their ID.
 * @param userId The ID of the user to fetch.
 * @returns A promise that resolves to a User object or undefined if not found.
 */
export const getUserById = (userId: string): Promise<User | undefined> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(MOCK_USERS.find(user => user.id === userId));
      }, 100);
    });
};
