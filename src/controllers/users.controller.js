import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.service.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Fetching all users');
    const allUsers = await getAllUsers();

    res.json({
      message: 'Users fetched successfully',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error('Error fetching users', e);
    next(e);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const idValidation = userIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { id } = idValidation.data;

    logger.info(`Fetching user by id: ${id}`);
    const user = await getUserByIdService(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User fetched successfully', user });
  } catch (e) {
    logger.error('Error fetching user by id', e);
    next(e);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const idValidation = userIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const { id } = idValidation.data;

    const bodyValidation = updateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({ error: 'Validation failed' });
    }
    const updates = bodyValidation.data;

    const token = cookies.get(req, 'token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let currentUser;
    try {
      currentUser = jwttoken.verify(token);
    } catch (e) {
      logger.warn('Invalid token on updateUser', e);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (updates.role && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update role' });
    }

    logger.info(
      `Updating user ${id} by ${currentUser.email || currentUser.id}`
    );

    const updated = await updateUserService(id, updates);

    res.json({ message: 'User updated successfully', user: updated });
  } catch (e) {
    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error('Error updating user', e);
    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const idValidation = userIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const { id } = idValidation.data;

    const token = cookies.get(req, 'token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let currentUser;
    try {
      currentUser = jwttoken.verify(token);
    } catch (e) {
      logger.warn('Invalid token on deleteUser ', e);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    logger.info(
      `Deleting user ${id} by ${currentUser.email || currentUser.id}`
    );

    const deleted = await deleteUserService(id);

    res.json({ message: 'User deleted successfully', user: deleted });
  } catch (e) {
    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error('Error deleting user', e);
    next(e);
  }
};
