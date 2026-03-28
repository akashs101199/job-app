const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

const SALT_ROUNDS = 10;

const isBcryptHash = (str) => /^\$2[aby]?\$/.test(str);

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

const comparePassword = async (plaintext, stored) => {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(plaintext, stored);
  }
  // Plaintext fallback for legacy passwords
  return plaintext === stored;
};

const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

const findUserProfile = (email) =>
  prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      profilePic: true,
      dateOfBirth: true,
      googleId: false,
      password: false,
    },
  });

const createUser = async ({ email, password, firstName, lastName, dob }) => {
  const hashed = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      password: hashed,
      firstName,
      lastName,
      dateOfBirth: new Date(dob),
    },
  });
};

const migratePasswordIfNeeded = async (email, password, stored) => {
  if (!isBcryptHash(stored)) {
    const hashed = await hashPassword(password);
    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    });
  }
};

const findOrCreateGoogleUser = async (profile) => {
  const googleId = profile.id;
  const email = profile.emails[0].value;
  const firstName = profile.name.givenName;
  const lastName = profile.name.familyName || '';
  const profilePic = profile.photos?.[0]?.value || null;

  let user = await prisma.user.findUnique({ where: { googleId } });
  if (user) return user;

  // Check if a user with this email already exists (registered via password)
  user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // Link the Google account to the existing user
    return prisma.user.update({
      where: { email },
      data: { googleId, profilePic },
    });
  }

  // Create a brand-new Google user
  return prisma.user.create({
    data: {
      email,
      googleId,
      firstName,
      lastName,
      profilePic,
      dateOfBirth: new Date('1970-01-01'), // placeholder for OAuth users
    },
  });
};

const updateRefreshToken = async (email, refreshToken) =>
  prisma.user.update({
    where: { email },
    data: { refreshToken },
  });

module.exports = {
  findUserByEmail,
  findUserProfile,
  createUser,
  comparePassword,
  migratePasswordIfNeeded,
  findOrCreateGoogleUser,
  updateRefreshToken,
};
