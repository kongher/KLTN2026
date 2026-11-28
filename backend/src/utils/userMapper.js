function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role?.name || user.role,
    avatar: user.avatar,
    status: user.status,
    marketingEmailOptIn: user.marketingEmailOptIn !== false,
  };
}

function toAuthUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role?.name || user.role,
  };
}

const BLOCKED_STATUSES = new Set(["INACTIVE", "LOCKED", "BANNED"]);

function isAccountBlocked(status) {
  return BLOCKED_STATUSES.has(status);
}

module.exports = {
  toPublicUser,
  toAuthUser,
  isAccountBlocked,
};
