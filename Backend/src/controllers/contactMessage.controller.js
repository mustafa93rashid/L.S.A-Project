const {
  ContactMessage,
} = require("../models/contactMessage.model");

const {
  sendContactMessageReceivedEmail,
} = require("../services/email.service");

const {
  createContactMessageNotification,
} = require("../services/notification.service");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const CONTACT_MESSAGE_POPULATE_FIELDS = [
  {
    path: "updatedBy",
    select: "fullName email role",
  },
];

const STATUS_DATE_FIELDS = {
  read: "readAt",
  replied: "repliedAt",
  archived: "archivedAt",
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

// ==================================================
// Get Current User ID
// ==================================================

const getCurrentUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

// ==================================================
// Escape Regular Expression
// ==================================================

const escapeRegex = (value) => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
};

// ==================================================
// Build Dashboard Filter
// ==================================================

const buildDashboardFilter = (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.service) {
    filter.service = query.service;
  }

  if (query.search) {
    const searchTerm = escapeRegex(
      query.search.trim(),
    );

    filter.$or = [
      {
        fullName: {
          $regex: searchTerm,
          $options: "i",
        },
      },
      {
        email: {
          $regex: searchTerm,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: searchTerm,
          $options: "i",
        },
      },
      {
        projectDescription: {
          $regex: searchTerm,
          $options: "i",
        },
      },
    ];
  }

  return filter;
};

// ==================================================
// Build Pagination
// ==================================================

const buildPagination = (query) => {
  const page = Math.max(
    Number(query.page) || 1,
    1,
  );

  const limit = Math.min(
    Math.max(
      Number(query.limit) || 20,
      1,
    ),
    100,
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

// ==================================================
// Send Received Email Safely
// ==================================================

const sendReceivedEmailSafely = async ({
  contactMessage,
}) => {
  try {
    await sendContactMessageReceivedEmail({
      to: contactMessage.email,

      fullName:
        contactMessage.fullName,

      service:
        contactMessage.service,

      messageId:
        contactMessage._id,
    });
  } catch (error) {
    console.error(
      "Contact message received email failed:",
      {
        contactMessageId:
          contactMessage._id,

        email:
          contactMessage.email,

        message:
          error.message,
      },
    );
  }
};

// ==================================================
// Create Dashboard Notification Safely
// ==================================================

const createNotificationSafely = async ({
  contactMessage,
}) => {
  try {
    await createContactMessageNotification({
      contactMessage,
    });
  } catch (error) {
    console.error(
      "Contact message notification failed:",
      {
        contactMessageId:
          contactMessage._id,

        message:
          error.message,
      },
    );
  }
};

/*
|--------------------------------------------------------------------------
| Contact Message Controller
|--------------------------------------------------------------------------
*/

class ContactMessageController {
  /*
  |--------------------------------------------------------------------------
  | Public
  |--------------------------------------------------------------------------
  */

  // ==================================================
  // Create Contact Message
  // ==================================================

  createContactMessage = async (
    req,
    res,
  ) => {
    const {
      fullName,
      email,
      phone,
      service,
      projectDescription,
    } = req.body;

    const contactMessage =
      await ContactMessage.create({
        fullName,
        email,
        phone,

        service:
          service ||
          "General Inquiry",

        projectDescription,

        status: "new",
      });

    /*
    |--------------------------------------------------------------------------
    | Side Effects
    |--------------------------------------------------------------------------
    |
    | فشل البريد أو الإشعار لا يؤدي إلى حذف الرسالة
    | بعد نجاح حفظها في قاعدة البيانات.
    |
    */

    await Promise.allSettled([
      sendReceivedEmailSafely({
        contactMessage,
      }),

      createNotificationSafely({
        contactMessage,
      }),
    ]);

    return res.status(201).json({
      success: true,

      message:
        "Your message has been received successfully. Our team will contact you soon.",

      data: {
        message: {
          _id:
            contactMessage._id,

          fullName:
            contactMessage.fullName,

          email:
            contactMessage.email,

          service:
            contactMessage.service,

          status:
            contactMessage.status,

          createdAt:
            contactMessage.createdAt,
        },
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  // ==================================================
  // Get All Contact Messages
  // ==================================================

  getAllContactMessages = async (
    req,
    res,
  ) => {
    const filter =
      buildDashboardFilter(
        req.query,
      );

    const {
      page,
      limit,
      skip,
    } = buildPagination(
      req.query,
    );

    const [
      contactMessages,
      total,
    ] = await Promise.all([
      ContactMessage.find(filter)
        .populate(
          CONTACT_MESSAGE_POPULATE_FIELDS,
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      ContactMessage.countDocuments(
        filter,
      ),
    ]);

    const totalPages = Math.ceil(
      total / limit,
    );

    return res.status(200).json({
      success: true,

      count:
        contactMessages.length,

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },

      data: contactMessages,
    });
  };

  // ==================================================
  // Get Contact Message By ID
  // ==================================================

  getContactMessageById = async (
    req,
    res,
  ) => {
    const contactMessage =
      await ContactMessage.findById(
        req.params.id,
      )
        .populate(
          CONTACT_MESSAGE_POPULATE_FIELDS,
        )
        .lean();

    if (!contactMessage) {
      return res.status(404).json({
        success: false,

        message:
          "Contact message not found.",
      });
    }

    return res.status(200).json({
      success: true,

      data: contactMessage,
    });
  };

  // ==================================================
  // Update Contact Message Status
  // ==================================================

  updateContactMessageStatus = async (
    req,
    res,
  ) => {
    const contactMessage =
      await ContactMessage.findById(
        req.params.id,
      );

    if (!contactMessage) {
      return res.status(404).json({
        success: false,

        message:
          "Contact message not found.",
      });
    }

    const { status } = req.body;

    const previousStatus =
      contactMessage.status;

    contactMessage.status =
      status;

    contactMessage.updatedBy =
      getCurrentUserId(req);

    /*
    |--------------------------------------------------------------------------
    | Timeline
    |--------------------------------------------------------------------------
    */

    const newDateField =
      STATUS_DATE_FIELDS[status];

    if (
      newDateField &&
      !contactMessage[newDateField]
    ) {
      contactMessage[newDateField] =
        new Date();
    }

    const previousDateField =
      STATUS_DATE_FIELDS[
        previousStatus
      ];

    if (
      previousDateField &&
      previousStatus !== status
    ) {
      contactMessage[
        previousDateField
      ] = null;
    }

    await contactMessage.save();

    await contactMessage.populate(
      CONTACT_MESSAGE_POPULATE_FIELDS,
    );

    return res.status(200).json({
      success: true,

      message:
        "Contact message status updated successfully.",

      data: contactMessage,
    });
  };

  // ==================================================
  // Delete Contact Message
  // ==================================================

  deleteContactMessage = async (
    req,
    res,
  ) => {
    const contactMessage =
      await ContactMessage.findById(
        req.params.id,
      );

    if (!contactMessage) {
      return res.status(404).json({
        success: false,

        message:
          "Contact message not found.",
      });
    }

    await contactMessage.deleteOne();

    return res.status(200).json({
      success: true,

      message:
        "Contact message deleted successfully.",
    });
  };

  // ==================================================
  // Get Contact Message Statistics
  // ==================================================

  getContactMessageStatistics = async (
    req,
    res,
  ) => {
    const statistics =
      await ContactMessage.aggregate([
        {
          $group: {
            _id: "$status",

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const statusCounts = {
      new: 0,
      read: 0,
      replied: 0,
      archived: 0,
    };

    for (const item of statistics) {
      if (
        Object.prototype.hasOwnProperty.call(
          statusCounts,
          item._id,
        )
      ) {
        statusCounts[item._id] =
          item.count;
      }
    }

    const total =
      Object.values(
        statusCounts,
      ).reduce(
        (sum, count) =>
          sum + count,
        0,
      );

    return res.status(200).json({
      success: true,

      data: {
        total,

        ...statusCounts,
      },
    });
  };
}

module.exports =
  new ContactMessageController();