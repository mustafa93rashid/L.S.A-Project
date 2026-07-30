const { Server } = require("socket.io");

const User = require("../models/user.model");
const jwtService = require("../utils/jwtService");

let io;

/*
|--------------------------------------------------------------------------
| Socket.IO Configuration
|--------------------------------------------------------------------------
*/

const ALLOWED_ROLES = [
  "superadmin",
  "equipmentManager",
  "hrManager",
  "contentManager",
];

// ==================================================
// Get Allowed Origins
// ==================================================
const getAllowedOrigins = () => {
  const origins = [
    process.env.CLIENT_URL,
    process.env.DASHBOARD_URL,
  ].filter(Boolean);

  return origins;
};

// ==================================================
// Extract Socket Token
// ==================================================
const extractSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;

  const authorizationHeader =
    socket.handshake.headers?.authorization;

  const bearerToken = authorizationHeader
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  return authToken || bearerToken || null;
};

// ==================================================
// Initialize Socket Server
// ==================================================
const initializeSocket = (httpServer) => {
  if (io) {
    return io; 
  }

  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST"],
    },

    transports: ["websocket", "polling"],

    pingTimeout: 20000,

    pingInterval: 25000,
  });

  // ==================================================
  // Authenticate Socket Connection
  // ==================================================
  io.use(async (socket, next) => {
    try {
      const token = extractSocketToken(socket);

      if (!token) {
        return next(
          new Error("Authentication token is required"),
        );
      }

      const decoded =
        jwtService.verifyAccessToken(token);

      if (!decoded?.id) {
        return next(
          new Error("Invalid authentication token"),
        );
      }

      const user = await User.findById(decoded.id)
        .select("_id role isActive")
        .lean();

      if (!user) {
        return next(
          new Error("Authenticated user was not found"),
        );
      }

      if (!user.isActive) {
        return next(
          new Error("User account is inactive"),
        );
      }

      if (!ALLOWED_ROLES.includes(user.role)) {
        return next(
          new Error("User role is not authorized"),
        );
      }

      socket.user = {
        id: user._id.toString(),
        role: user.role,
      };

      next();
    } catch (error) {
      next(
        new Error(
          "Invalid or expired authentication token",
        ),
      );
    }
  });

  // ==================================================
  // Handle Socket Connection
  // ==================================================
  io.on("connection", (socket) => {
    const userRoom = `user:${socket.user.id}`;
    const roleRoom = `role:${socket.user.role}`;

    socket.join(userRoom);
    socket.join(roleRoom);

    socket.emit("socket:connected", {
      success: true,
      message: "Socket connected successfully",
      data: {
        socketId: socket.id,
        userId: socket.user.id,
        role: socket.user.role,
      },
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id} - ${reason}`,
      );
    });

    socket.on("error", (error) => {
      console.error(
        `Socket error: ${socket.id}`,
        error,
      );
    });
  });

  return io;
};

// ==================================================
// Get Socket Server
// ==================================================
const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized",
    );
  }

  return io;
};

// ==================================================
// Emit To User
// ==================================================
const emitToUser = (userId, eventName, payload) => {
  if (!userId || !eventName) {
    throw new Error(
      "User ID and event name are required",
    );
  }

  getIO()
    .to(`user:${userId}`)
    .emit(eventName, payload);
};

// ==================================================
// Emit To Role
// ==================================================
const emitToRole = (role, eventName, payload) => {
  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("Invalid notification role");
  }

  if (!eventName) {
    throw new Error("Event name is required");
  }

  getIO()
    .to(`role:${role}`)
    .emit(eventName, payload);
};

// ==================================================
// Emit To Multiple Roles
// ==================================================
const emitToRoles = (
  roles,
  eventName,
  payload,
) => {
  if (!Array.isArray(roles) || !roles.length) {
    throw new Error(
      "At least one role is required",
    );
  }

  if (!eventName) {
    throw new Error("Event name is required");
  }

  const validRoles = [
    ...new Set(
      roles.filter((role) =>
        ALLOWED_ROLES.includes(role),
      ),
    ),
  ];

  if (!validRoles.length) {
    throw new Error(
      "No valid notification roles were provided",
    );
  }

  const roleRooms = validRoles.map(
    (role) => `role:${role}`,
  );

  getIO()
    .to(roleRooms)
    .emit(eventName, payload);
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToRoles,
};