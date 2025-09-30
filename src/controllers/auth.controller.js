import logger from '#config/logger.js';
import { signUpSchema, signInSchema } from '#validations/auth.validation.js';
import { formatValidationError } from '#utils/format.js';
import { createUser, authenticateUser } from '#services/auth.service.js';
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const signUp = async (req, res, next) => {
  try {
    const validationResult = signUpSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res
        .status(400)
        .json({
          error: 'Validation failed',
          details: formatValidationError(validationResult.error),
        });
    }

    const { name, email, password, role } = validationResult.data;

    const user = await createUser({ name, email, password, role });

    if (!user) {
      logger.error('createUser returned undefined or null');
      return res.status(500).json({ error: 'Unable to create user' });
    }

    const token = jwttoken.sign({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User registered successfully: ${email}`);
    res.status(201).json({
      message: 'User registered',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    logger.error('Sign-up error:', e);

    if (e.message === 'User with this email already exists') {
      res.status(409).json({ error: 'Email already in use' });
    } else {
      next(e);
    }
  }
};

export const signIn = async (req, res, next) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res
        .status(400)
        .json({
          error: 'Validation failed',
          details: formatValidationError(validationResult.error),
        });
    }

    const { email, password } = validationResult.data;

    const user = await authenticateUser({ email, password });

    if (!user) {
      logger.error('authenticateUser returned undefined or null');
      return res.status(500).json({ error: 'Unable to authenticate user' });
    }

    const token = jwttoken.sign({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User signed in successfully: ${email}`);
    res.status(200).json({
      message: 'User signed in',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    logger.error('Sign-in error:', e);

    if (e.message === 'Invalid email or password') {
      res.status(401).json({ error: 'Invalid credentials' });
    } else {
      next(e);
    }
  }
};

export const signOut = async (req, res, next) => {
  try {
    // Get the current user's email from token for logging (optional)
    const token = cookies.get(req, 'token');
    let userEmail = 'unknown';
    
    if (token) {
      try {
        const decoded = jwttoken.verify(token);
        userEmail = decoded.email;
      } catch (tokenError) {
        // Token might be invalid, but we can still proceed with logout
        logger.warn('Invalid token during sign-out:', tokenError.message);
      }
    }

    // Clear the authentication cookie
    cookies.clear(res, 'token');

    logger.info(`User signed out successfully: ${userEmail}`);
    res.status(200).json({
      message: 'User signed out successfully',
    });
  } catch (e) {
    logger.error('Sign-out error:', e);
    next(e);
  }
};
