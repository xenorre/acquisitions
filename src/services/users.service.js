import { db } from '#config/database.js';
import logger from '#config/logger.js';
import users from '#models/user.model.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from '#services/auth.service.js';

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);
  } catch (e) {
    logger.error('Error fetching users:', e);
    throw e;
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  } catch (e) {
    logger.error('Error fetching user by ID:', e);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // Ensure user exists
    const [existing] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existing) {
      throw new Error('User not found');
    }

    const allowed = ['name', 'email', 'role', 'password'];
    const payload = Object.fromEntries(
      Object.entries(updates || {}).filter(([k, v]) => allowed.includes(k) && v !== undefined)
    );

    if ('password' in payload) {
      payload.password = await hashPassword(payload.password);
    }

    if (Object.keys(payload).length === 0) {
      // Nothing to update
      const [unchanged] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return unchanged;
    }

    const [updated] = await db
      .update(users)
      .set(payload)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return updated;
  } catch (e) {
    logger.error('Error updating user:', e);
    throw e;
  }
};

export const deleteUser = async id => {
  try {
    // Ensure user exists first
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existing) {
      throw new Error('User not found');
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return deleted;
  } catch (e) {
    logger.error('Error deleting user:', e);
    throw e;
  }
};
