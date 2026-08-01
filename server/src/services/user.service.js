// Mock dataset / service layer implementation
const mockUsers = [
  { id: 1, name: 'Budi Santoso', role: 'Admin', email: 'budi@sinaranugrah.com' },
  { id: 2, name: 'Siti Rahma', role: 'User', email: 'siti@sinaranugrah.com' },
  { id: 3, name: 'Agus Setiawan', role: 'User', email: 'agus@sinaranugrah.com' },
];

export const fetchAllUsers = async () => {
  // Logic for DB query (e.g. Prisma / Mongoose / SQL) goes here
  return mockUsers;
};

export const fetchUserById = async (id) => {
  const user = mockUsers.find((u) => u.id === Number(id));
  if (!user) {
    const error = new Error(`User with ID ${id} not found`);
    error.statusCode = 404;
    throw error;
  }
  return user;
};
