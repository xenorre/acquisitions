export const cookies = {
  getOptions: () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  }),

  set: (res, name, value, options = {}) => {
    // Express response exposes `res.cookie(...)` (not `res.cookies`).
    // Use it to set the cookie with our default options merged with any overrides.
    res.cookie(name, value, { ...cookies.getOptions(), ...options });
  },

  clear: (res, name, options = {}) => {
    res.clearCookie(name, { ...cookies.getOptions(), ...options });
  },

  get: (req, name) => {
    // req.cookies may be undefined if cookie-parser middleware isn't registered.
    return req.cookies?.[name];
  },
};
